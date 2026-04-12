"""
-------------------------------------------------
Claim Router
-------------------------------------------------
Handles all claim-related API endpoints including
claim creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from datetime import datetime

from app.db.deps import get_db
from app.models.models import Claim, ClaimStatusHistory, Policy
from app.schemas.claim import ClaimCreate, ClaimResponse, ClaimUpdateStatus, EscalationRequest, OverrideApprovalRequest, RejectionRequest, SurveyReportResponse, SurveyReportSubmitRequest, SurveyReinspectionRequest


from app.models.claim_status import ClaimStatus
from app.models.extracted_document import ExtractedDocument
from app.models.extracted_field import ExtractedField
from app.models.document_type import DocumentType
from app.models.validation_result import ValidationResult
from app.models.validation_severity import ValidationSeverity
from app.services.settlement_engine import calculate_settlement
from app.models.settlement_ledger import SettlementLedger
from app.models.survey_report import SurveyReport

from pydantic import BaseModel
from typing import Dict
from typing import Optional
from typing import List




# -------------------------------------------------
# Router Initialization
# -------------------------------------------------
router = APIRouter(prefix="/claims", tags=["Claims"])


def get_latest_survey_report(db: Session, claim_id: int):
    try:
        return (
            db.query(SurveyReport)
            .filter(SurveyReport.claim_id == claim_id)
            .order_by(SurveyReport.version_number.desc())
            .first()
        )
    except OperationalError:
        return None


def get_next_survey_report_version(db: Session, claim_id: int) -> int:
    latest_report = get_latest_survey_report(db, claim_id)
    return 1 if latest_report is None else latest_report.version_number + 1


def serialize_claim(db: Session, claim: Claim) -> dict:
    claim_data = ClaimResponse.model_validate(claim, from_attributes=True).model_dump()
    latest_report = get_latest_survey_report(db, claim.id)
    claim_data["latest_survey_report"] = (
        SurveyReportResponse.model_validate(latest_report, from_attributes=True).model_dump()
        if latest_report else None
    )
    try:
        claim_data["survey_report_count"] = db.query(SurveyReport).filter(SurveyReport.claim_id == claim.id).count()
    except OperationalError:
        claim_data["survey_report_count"] = 0
    return claim_data


# -------------------------------------------------
# Claim Creation
# -------------------------------------------------
@router.post("/", response_model=ClaimResponse)
def create_claim(claim: ClaimCreate, response: Response, db: Session = Depends(get_db)):
    """
    Create a new claim with generated claim number.
    Default status is set to SUBMITTED.
    
    Validation: A policy cannot have multiple active claims.
    Active claims are those with status NOT IN (APPROVED, REJECTED).
    """
    # Check if there's already an active claim for this policy
    existing_active_claim = db.query(Claim).filter(
        Claim.policy_id == claim.policy_id,
        Claim.status.notin_([ClaimStatus.APPROVED, ClaimStatus.REJECTED])
    ).first()
    
    if existing_active_claim:
        # Keep one-active-claim rule, but return current active claim so UI can continue gracefully.
        response.headers["X-Existing-Claim"] = "true"
        return serialize_claim(db, existing_active_claim)
    
    claim_number = f"CLM-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    db_claim = Claim(
        claim_number=claim_number,
        policy_id=claim.policy_id,
        incident_date=claim.incident_date,
        description=claim.description,
        status=ClaimStatus.SUBMITTED
    )

    # Persist claim to database
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)

    response.headers["X-Existing-Claim"] = "false"
    return serialize_claim(db, db_claim)


# -------------------------------------------------
# Claim Retrieval
# -------------------------------------------------
@router.get("/", response_model=list[ClaimResponse])
def get_claims(
    status: Optional[ClaimStatus] = Query(default=None),
    policy_number: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Retrieve claims from the database.
    When `policy_number` is provided, only claims matching that policy are returned.
    This allows simple per-customer scoping when the frontend supplies the customer's policy number.
    """
    # Start base query
    if policy_number:
        # Join Policy to filter by policy_number
        query = db.query(Claim).join(Policy, Claim.policy_id == Policy.id).filter(Policy.policy_number == policy_number)
    else:
        query = db.query(Claim)

    if status is not None:
        query = query.filter(Claim.status == status)

    claims = query.order_by(Claim.updated_at.desc(), Claim.created_at.desc()).all()
    return [serialize_claim(db, claim) for claim in claims]


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single claim by ID.
    Returns 404 if claim not found.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return serialize_claim(db, claim)


@router.get("/{claim_id}/survey-reports", response_model=list[SurveyReportResponse])
def get_claim_survey_reports(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    try:
        reports = (
            db.query(SurveyReport)
            .filter(SurveyReport.claim_id == claim_id)
            .order_by(SurveyReport.version_number.desc())
            .all()
        )
    except OperationalError:
        reports = []
    return reports


# -------------------------------------------------
# Get Claim Status History
# -------------------------------------------------
@router.get("/{claim_id}/history")
def get_claim_history(claim_id: int, db: Session = Depends(get_db)):
    history = (
        db.query(ClaimStatusHistory)
        .filter(ClaimStatusHistory.claim_id == claim_id)
        .all()
    )
    return history


# -------------------------------------------------
# Claim Processing Trigger
# -------------------------------------------------
@router.post("/{claim_id}/trigger-processing", response_model=ClaimResponse)
def trigger_claim_processing(claim_id: int, db: Session = Depends(get_db)):
    """
    Trigger processing workflow for a claim.
    Only claims in SUBMITTED status can be moved to PROCESSING.
    """
    # -------------------------------------------------
    # Fetch Claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # -------------------------------------------------
    # State Validation
    # -------------------------------------------------
    if claim.status != ClaimStatus.SUBMITTED:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in SUBMITTED status to start processing."
        )

    # -------------------------------------------------
    # Status Update Logic
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.PROCESSING

    # -------------------------------------------------
    # Audit Logging
    # -------------------------------------------------
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.PROCESSING
    )

    # Persist changes
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    return claim


# -------------------------------------------------
# Inline Schemas for Document Ingestion
# -------------------------------------------------
class FieldData(BaseModel):
    value: str
    # Confidence is optional because GenAI-based extraction may not always provide confidence scores
    confidence: Optional[float] = None




class DocumentIngestRequest(BaseModel):
    document_type: DocumentType
    # Optional targeting fields to ensure we update an existing uploaded document row.
    # When omitted, the server will try to resolve a unique matching document.
    document_id: Optional[int] = None
    file_path: Optional[str] = None
    fields: Dict[str, FieldData]


# -------------------------------------------------
# Document Ingestion
# -------------------------------------------------
@router.post("/{claim_id}/documents", response_model=ClaimResponse)
def ingest_document(
    claim_id: int,
    document: DocumentIngestRequest,
    db: Session = Depends(get_db)
):
    """
    Ingest extracted document data for a claim.
    Only claims in PROCESSING status can ingest documents.
    Updates claim status to READY_FOR_REVIEW after ingestion.
    """
    # -------------------------------------------------
    # State Validation
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != ClaimStatus.PROCESSING:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in PROCESSING status to ingest documents."
        )

    # -------------------------------------------------
    # Locate Existing Document (no duplicates)
    # -------------------------------------------------
    extracted_doc = None

    if document.document_id is not None:
        extracted_doc = (
            db.query(ExtractedDocument)
            .filter(
                ExtractedDocument.id == document.document_id,
                ExtractedDocument.claim_id == claim.id,
            )
            .first()
        )
        if not extracted_doc:
            raise HTTPException(status_code=404, detail="Document not found for claim")

    elif document.file_path:
        extracted_doc = (
            db.query(ExtractedDocument)
            .filter(
                ExtractedDocument.claim_id == claim.id,
                ExtractedDocument.file_path == document.file_path,
            )
            .first()
        )
        if not extracted_doc:
            raise HTTPException(status_code=404, detail="Document not found for claim and file_path")

    else:
        candidates = (
            db.query(ExtractedDocument)
            .filter(
                ExtractedDocument.claim_id == claim.id,
                ExtractedDocument.document_type == document.document_type,
            )
            .order_by(ExtractedDocument.id.asc())
            .all()
        )

        if not candidates:
            raise HTTPException(
                status_code=404,
                detail="No matching document found. Upload the file before ingesting fields.",
            )

        if len(candidates) == 1:
            extracted_doc = candidates[0]
        else:
            unprocessed = (
                db.query(ExtractedDocument)
                .outerjoin(ExtractedField, ExtractedField.document_id == ExtractedDocument.id)
                .filter(
                    ExtractedDocument.claim_id == claim.id,
                    ExtractedDocument.document_type == document.document_type,
                )
                .group_by(ExtractedDocument.id)
                .having(func.count(ExtractedField.id) == 0)
                .order_by(ExtractedDocument.id.asc())
                .all()
            )

            if len(unprocessed) == 1:
                extracted_doc = unprocessed[0]
            elif len(unprocessed) > 1:
                raise HTTPException(
                    status_code=409,
                    detail="Multiple matching documents found. Provide document_id or file_path.",
                )
            else:
                raise HTTPException(
                    status_code=409,
                    detail="All matching documents already have extracted fields. Provide document_id or file_path.",
                )

    # Ensure payload type matches the resolved record.
    if extracted_doc.document_type != document.document_type:
        raise HTTPException(
            status_code=409,
            detail="document_type does not match the existing document record",
        )

    # If the client provides file_path, use it to backfill missing values.
    if document.file_path and not extracted_doc.file_path:
        extracted_doc.file_path = document.file_path

    # -------------------------------------------------
    # Field Upsert
    # -------------------------------------------------
    existing_fields = (
        db.query(ExtractedField)
        .filter(ExtractedField.document_id == extracted_doc.id)
        .all()
    )
    existing_by_name = {f.field_name: f for f in existing_fields}
    incoming_names = set(document.fields.keys())

    # Remove stale fields if the incoming payload is the new source of truth.
    for existing in existing_fields:
        if existing.field_name not in incoming_names:
            db.delete(existing)

    for field_name, field_data in document.fields.items():
        existing = existing_by_name.get(field_name)
        if existing:
            existing.field_value = field_data.value
            existing.confidence_score = field_data.confidence
        else:
            db.add(
                ExtractedField(
                    document_id=extracted_doc.id,
                    field_name=field_name,
                    field_value=field_data.value,
                    confidence_score=field_data.confidence,
                )
            )

    # Mark extraction timestamp at ingest time.
    extracted_doc.extracted_at = datetime.utcnow()

    # -------------------------------------------------
    # Status Transition
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.READY_FOR_REVIEW

    # -------------------------------------------------
    # Audit Logging
    # -------------------------------------------------
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.READY_FOR_REVIEW
    )
    db.add(status_history)

    # Persist all changes
    db.commit()
    db.refresh(claim)

    return claim


# -------------------------------------------------
# Claim Status Management
# -------------------------------------------------
@router.patch("/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: int,
    status_update: ClaimUpdateStatus,
    db: Session = Depends(get_db)
):
    """
    Update claim status and record the change in status history.
    Returns 404 if claim not found.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status

    # Update claim status
    claim.status = status_update.status

    # Record status change in history
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=status_update.status
    )

    # Persist status history and updated claim
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    return claim


# -------------------------------------------------
# Claim Validation
# -------------------------------------------------
@router.post("/{claim_id}/run-validation")
def run_claim_validation(claim_id: int, db: Session = Depends(get_db)):
    """
    Run validation rules against a claim.
    Only claims in READY_FOR_REVIEW status can be validated.
    Compares extracted document fields against policy data.
    """
    # -------------------------------------------------
    # Fetch Claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # -------------------------------------------------
    # State Validation
    # -------------------------------------------------
    if claim.status != ClaimStatus.READY_FOR_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in READY_FOR_REVIEW status to run validation."
        )

    # -------------------------------------------------
    # Fetch Linked Policy
    # -------------------------------------------------
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=400, detail="Policy not found")

    # -------------------------------------------------
    # Fetch Claim Form Document
    # -------------------------------------------------
    claim_form_doc = (
        db.query(ExtractedDocument)
        .filter(
            ExtractedDocument.claim_id == claim.id,
            ExtractedDocument.document_type == DocumentType.CLAIM_FORM
        )
        .first()
    )
    if not claim_form_doc:
        raise HTTPException(status_code=400, detail="Claim form document not found")

    # -------------------------------------------------
    # Extract Fields into Dictionary
    # -------------------------------------------------
    extracted_fields = (
        db.query(ExtractedField)
        .filter(ExtractedField.document_id == claim_form_doc.id)
        .all()
    )
    extracted = {field.field_name: field.field_value for field in extracted_fields}

    # -------------------------------------------------
    # Validation Rule Execution
    # -------------------------------------------------
    validation_results = []
    failed_count = 0

    # Rule 1: Policy Number Match
    policy_number_match = extracted.get("policy_number") == policy.policy_number
    validation_results.append(
        ValidationResult(
            claim_id=claim.id,
            rule_name="Policy Number Match",
            expected_value=policy.policy_number,
            actual_value=extracted.get("policy_number"),
            is_match=policy_number_match,
            severity=ValidationSeverity.HIGH
        )
    )
    if not policy_number_match:
        failed_count += 1

    # Rule 2: Vehicle Number Match
    vehicle_number_match = extracted.get("vehicle_number") == policy.vehicle_number
    validation_results.append(
        ValidationResult(
            claim_id=claim.id,
            rule_name="Vehicle Number Match",
            expected_value=policy.vehicle_number,
            actual_value=extracted.get("vehicle_number"),
            is_match=vehicle_number_match,
            severity=ValidationSeverity.HIGH
        )
    )
    if not vehicle_number_match:
        failed_count += 1

    # Rule 3: Policy Active
    policy_active = policy.is_active
    validation_results.append(
        ValidationResult(
            claim_id=claim.id,
            rule_name="Policy Active",
            expected_value="True",
            actual_value=str(policy.is_active),
            is_match=policy_active,
            severity=ValidationSeverity.HIGH
        )
    )
    if not policy_active:
        failed_count += 1

    # Rule 4: Incident Date Within Policy Period
    incident_date_valid = (
        policy.policy_start_date <= claim.incident_date <= policy.policy_end_date
    )
    validation_results.append(
        ValidationResult(
            claim_id=claim.id,
            rule_name="Incident Date Within Policy Period",
            expected_value=f"{policy.policy_start_date} to {policy.policy_end_date}",
            actual_value=str(claim.incident_date),
            is_match=incident_date_valid,
            severity=ValidationSeverity.HIGH
        )
    )
    if not incident_date_valid:
        failed_count += 1

    # -------------------------------------------------
    # Result Insertion
    # -------------------------------------------------
    for result in validation_results:
        db.add(result)

    # -------------------------------------------------
    # Commit Transaction
    # -------------------------------------------------
    db.commit()

    # -------------------------------------------------
    # Summary Response
    # -------------------------------------------------
    return {
        "message": "Validation completed",
        "total_rules": len(validation_results),
        "failed_rules": failed_count
    }


# -------------------------------------------------
# Risk Evaluation Endpoint
# -------------------------------------------------
@router.post("/{claim_id}/evaluate-risk")
def evaluate_claim_risk(claim_id: int, db: Session = Depends(get_db)):
    """
    Evaluate risk level for a claim based on validation failures.
    
    RISK AGGREGATION:
    - Counts validation failures by severity level (HIGH, MEDIUM, LOW)
    - Only counts failures where is_match == False
    
    ESCALATION RULE:
    - HIGH >= 2: Claim is automatically escalated to ESCALATED status
    - HIGH == 1: Medium risk, no escalation
    - Otherwise: Low risk, no escalation
    
    STATUS MUTATION LOGIC:
    - Only commits transaction if claim status changes from READY_FOR_REVIEW to ESCALATED
    - Creates ClaimStatusHistory record when status changes
    
    SUMMARY RESPONSE:
    - Returns risk_level, failure counts, and escalation status
    """
    # -------------------------------------------------
    # Step 1: Fetch claim by claim_id
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # -------------------------------------------------
    # Step 2: Ensure claim.status == READY_FOR_REVIEW
    # -------------------------------------------------
    if claim.status != ClaimStatus.READY_FOR_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in READY_FOR_REVIEW status to evaluate risk."
        )

    # -------------------------------------------------
    # Step 3: Fetch all ValidationResult rows for claim_id
    # -------------------------------------------------
    validation_results = db.query(ValidationResult).filter(
        ValidationResult.claim_id == claim_id
    ).all()

    # -------------------------------------------------
    # Step 4: Count failures by severity
    # -------------------------------------------------
    high_failures = 0
    medium_failures = 0
    low_failures = 0

    for result in validation_results:
        if result.is_match is False:
            if result.severity == ValidationSeverity.HIGH:
                high_failures += 1
            elif result.severity == ValidationSeverity.MEDIUM:
                medium_failures += 1
            elif result.severity == ValidationSeverity.LOW:
                low_failures += 1

    # -------------------------------------------------
    # Step 5: Apply risk logic
    # -------------------------------------------------
    escalated = False
    risk_level = "LOW"

    if high_failures >= 2:
        # Escalation rule: 2 or more HIGH failures triggers escalation
        old_status = claim.status
        claim.status = ClaimStatus.ESCALATED

        # Insert ClaimStatusHistory record
        status_history = ClaimStatusHistory(
            claim_id=claim.id,
            old_status=old_status,
            new_status=ClaimStatus.ESCALATED
        )
        db.add(status_history)

        escalated = True
        risk_level = "HIGH"

    elif high_failures == 1:
        # Single HIGH failure: medium risk, no escalation
        risk_level = "MEDIUM"
        escalated = False

    else:
        # No HIGH failures: low risk
        risk_level = "LOW"
        escalated = False

    # -------------------------------------------------
    # Step 6: Commit transaction ONLY if status changed
    # -------------------------------------------------
    if escalated:
        db.commit()
        db.refresh(claim)

    # -------------------------------------------------
    # Step 7: Return JSON response
    # -------------------------------------------------
    return {
        "risk_level": risk_level,
        "high_failures": high_failures,
        "medium_failures": medium_failures,
        "low_failures": low_failures,
        "escalated": escalated
    }


# -------------------------------------------------
# Get Validation Results Endpoint
# -------------------------------------------------
@router.get("/{claim_id}/validation-results")
def get_claim_validation_results(claim_id: int, db: Session = Depends(get_db)):
    """
    Retrieve validation results for a claim.
    
    EXPLAINABILITY PURPOSE:
    - Provides transparency into why a claim was validated the way it was
    - Allows users to understand specific rule failures and their severity
    - Supports audit and compliance requirements
    
    RETRIEVAL LOGIC:
    - First verifies the claim exists (404 if not found)
    - Queries all ValidationResult records associated with the claim_id
    - Returns empty list if no validation results exist (NOT an error)
    - Assumes all results belong to the latest validation run
    
    RESPONSE STRUCTURE:
    - List of validation result objects containing:
      - rule_name: Name of the validation rule
      - expected_value: What the value should have been
      - actual_value: What the value actually was
      - is_match: Whether the validation passed
      - severity: HIGH, MEDIUM, or LOW
      - created_at: Timestamp of when the result was created
    """
    # -------------------------------------------------
    # Step 1: Fetch claim by claim_id
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # -------------------------------------------------
    # Step 2: Fetch all ValidationResult rows for claim_id
    # -------------------------------------------------
    validation_results = db.query(ValidationResult).filter(
        ValidationResult.claim_id == claim_id
    ).all()

    # -------------------------------------------------
    # Step 3: Build response with validation result details
    # -------------------------------------------------
    results = []
    for result in validation_results:
        results.append({
            "rule_name": result.rule_name,
            "expected_value": result.expected_value,
            "actual_value": result.actual_value,
            "is_match": result.is_match,
            "severity": result.severity.value,
            "created_at": result.created_at.isoformat() if result.created_at else None
        })

    return results


# -------------------------------------------------
# Settlement Request Schema
# -------------------------------------------------
class PartItem(BaseModel):
    """Part item for settlement calculation."""
    type: str
    amount: float


class SettlementRequest(BaseModel):
    """Request body for claim approval with settlement calculation."""
    vehicle_age_years: float
    parts: List[PartItem]
    deductible_amount: float


# -------------------------------------------------
# Additional Request Schemas
# -------------------------------------------------
class AssignClaimRequest(BaseModel):
    officer_id: str
    notes: Optional[str] = None


class RequestDocumentsRequest(BaseModel):
    document_types: List[str]
    reason: str


class AssignSurveyorRequest(BaseModel):
    surveyor_id: str
    surveyor_name: str
    notes: Optional[str] = None


class UpdateClaimStatusRequest(BaseModel):
    status: ClaimStatus
    notes: Optional[str] = None


class ClaimClosureRequest(BaseModel):
    final_notes: str
    settlement_mode: Optional[str] = None  # "CASHLESS" or "REIMBURSEMENT"


# -------------------------------------------------
# New Workflow Endpoints
# -------------------------------------------------

# -------------------------------------------------
# Assign Claim to Officer
# -------------------------------------------------
@router.post("/{claim_id}/assign", response_model=ClaimResponse)
def assign_claim(
    claim_id: int,
    request: AssignClaimRequest,
    db: Session = Depends(get_db)
):
    """
    Assign a claim to an officer for review.
    Changes status from SUBMITTED to UNDER_REVIEW.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in SUBMITTED or UNDER_REVIEW status to assign."
        )
    
    old_status = claim.status
    if claim.status == ClaimStatus.SUBMITTED:
        claim.status = ClaimStatus.UNDER_REVIEW
        status_history = ClaimStatusHistory(
            claim_id=claim.id,
            old_status=old_status,
            new_status=ClaimStatus.UNDER_REVIEW
        )
        db.add(status_history)
    
    db.commit()
    db.refresh(claim)
    
    return claim


# -------------------------------------------------
# Request Additional Documents
# -------------------------------------------------
@router.post("/{claim_id}/request-documents")
def request_documents(
    claim_id: int,
    request: RequestDocumentsRequest,
    db: Session = Depends(get_db)
):
    """
    Request additional documents from customer.
    Changes status to DOCUMENT_REQUIRED.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.UNDER_REVIEW, ClaimStatus.DOCUMENT_REQUIRED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in UNDER_REVIEW or DOCUMENT_REQUIRED status."
        )
    
    old_status = claim.status
    claim.status = ClaimStatus.DOCUMENT_REQUIRED
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.DOCUMENT_REQUIRED
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)
    
    return {
        "message": "Documents requested",
        "document_types": request.document_types,
        "reason": request.reason,
        "claim_id": claim.id
    }


# -------------------------------------------------
# Assign Surveyor
# -------------------------------------------------
@router.post("/{claim_id}/assign-surveyor")
def assign_surveyor(
    claim_id: int,
    request: AssignSurveyorRequest,
    db: Session = Depends(get_db)
):
    """
    Assign a surveyor to inspect the vehicle.
    For major accidents. Changes status to SURVEY_ASSIGNED.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status != ClaimStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in UNDER_REVIEW status to assign surveyor."
        )
    
    old_status = claim.status
    claim.status = ClaimStatus.SURVEY_ASSIGNED

    survey_report = SurveyReport(
        claim_id=claim.id,
        version_number=get_next_survey_report_version(db, claim.id),
        surveyor_id=request.surveyor_id,
        surveyor_name=request.surveyor_name,
        assignment_notes=request.notes,
        assigned_at=datetime.utcnow()
    )
    db.add(survey_report)
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.SURVEY_ASSIGNED
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    return serialize_claim(db, claim)


# -------------------------------------------------
# Mark Survey Complete
# -------------------------------------------------
@router.post("/{claim_id}/survey-complete", response_model=ClaimResponse)
def survey_complete(
    claim_id: int,
    request: SurveyReportSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Mark survey as complete after surveyor uploads report.
    Changes status from SURVEY_ASSIGNED to SURVEY_COMPLETED.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status != ClaimStatus.SURVEY_ASSIGNED:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in SURVEY_ASSIGNED status."
        )

    survey_report = (
        db.query(SurveyReport)
        .filter(
            SurveyReport.claim_id == claim.id,
            SurveyReport.submitted_at.is_(None)
        )
        .order_by(SurveyReport.version_number.desc())
        .first()
    )

    if survey_report is None:
        survey_report = SurveyReport(
            claim_id=claim.id,
            version_number=get_next_survey_report_version(db, claim.id),
            surveyor_id=request.surveyor_id,
            surveyor_name=request.surveyor_name,
            assigned_at=datetime.utcnow()
        )
        db.add(survey_report)

    survey_report.surveyor_id = request.surveyor_id
    if request.surveyor_name:
        survey_report.surveyor_name = request.surveyor_name
    survey_report.damage_description = request.damage_description
    survey_report.vehicle_condition = request.vehicle_condition
    survey_report.parts_damaged = request.parts_damaged
    survey_report.estimated_repair_cost = request.estimated_repair_cost
    survey_report.recommendation = request.recommendation
    survey_report.submitted_at = datetime.utcnow()
    
    old_status = claim.status
    claim.status = ClaimStatus.SURVEY_COMPLETED
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.SURVEY_COMPLETED
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    return serialize_claim(db, claim)


@router.post("/{claim_id}/reopen-survey", response_model=ClaimResponse)
def reopen_survey(
    claim_id: int,
    request: SurveyReinspectionRequest,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != ClaimStatus.SURVEY_COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in SURVEY_COMPLETED status to request reinspection."
        )

    previous_report = get_latest_survey_report(db, claim.id)
    if previous_report is not None:
        previous_report.officer_review_notes = request.reason

    next_report = SurveyReport(
        claim_id=claim.id,
        version_number=get_next_survey_report_version(db, claim.id),
        surveyor_id=request.surveyor_id,
        surveyor_name=request.surveyor_name,
        assignment_notes=request.reason,
        assigned_at=datetime.utcnow(),
        officer_review_notes=request.reason
    )
    db.add(next_report)

    old_status = claim.status
    claim.status = ClaimStatus.SURVEY_ASSIGNED

    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.SURVEY_ASSIGNED
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    return serialize_claim(db, claim)


# -------------------------------------------------
# Flag for Investigation
# -------------------------------------------------
@router.post("/{claim_id}/flag-investigation", response_model=ClaimResponse)
def flag_investigation(
    claim_id: int,
    reason: str,
    db: Session = Depends(get_db)
):
    """
    Flag claim for fraud investigation.
    Changes status to UNDER_INVESTIGATION.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.UNDER_REVIEW, ClaimStatus.SURVEY_COMPLETED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in UNDER_REVIEW or SURVEY_COMPLETED status."
        )
    
    old_status = claim.status
    claim.status = ClaimStatus.UNDER_INVESTIGATION
    claim.escalation_reason = reason
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.UNDER_INVESTIGATION
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)
    
    return claim


# -------------------------------------------------
# Update Claim Status (Generic)
# -------------------------------------------------
@router.post("/{claim_id}/update-status", response_model=ClaimResponse)
def update_claim_status_workflow(
    claim_id: int,
    request: UpdateClaimStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Update claim status to any valid status.
    Used for payment and closure workflows.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    old_status = claim.status
    claim.status = request.status
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=request.status
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)
    
    return claim


# -------------------------------------------------
# Close Claim
# -------------------------------------------------
@router.post("/{claim_id}/close")
def close_claim(
    claim_id: int,
    request: ClaimClosureRequest,
    db: Session = Depends(get_db)
):
    """
    Close a claim after payment or repair completion.
    Changes status to CLOSED.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.PAID, ClaimStatus.APPROVED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in PAID or APPROVED status to close."
        )
    
    old_status = claim.status
    claim.status = ClaimStatus.CLOSED
    claim.escalation_reason = request.final_notes
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.CLOSED
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)
    
    return {
        "message": "Claim closed successfully",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status.value,
        "settlement_mode": request.settlement_mode,
        "final_notes": request.final_notes
    }


# -------------------------------------------------
# Claim Approval Endpoint
# -------------------------------------------------
@router.post("/{claim_id}/approve")
def approve_claim(
    claim_id: int,
    request: SettlementRequest,
    db: Session = Depends(get_db)
):
    """
    Approve a claim and calculate settlement using depreciation engine.
    
    WORKFLOW:
    1. Verify claim exists and is in READY_FOR_REVIEW status
    2. Fetch linked policy for IDV cap enforcement
    3. Call settlement engine to calculate:
       - estimated_amount: Total parts cost before depreciation
       - total_depreciation: Depreciation based on part types and vehicle age
       - calculated_payable: Amount after depreciation minus deductible
    4. Apply IDV cap enforcement:
       - If calculated_payable > policy.idv_amount: cap at IDV
       - Otherwise: use calculated amount
    5. Insert immutable SettlementLedger record with versioning
    6. Update claim snapshot fields with final settlement values
    7. Update claim status to APPROVED
    8. Create status history record
    9. Commit transaction
    
    DEPRECIATION RULES APPLIED:
    - Non-metal parts: Fixed rates (PLASTIC/RUBBER/NYLON: 50%, FIBRE: 30%, GLASS: 0%)
    - Metal parts: Age-based rates (5%-50% based on vehicle age)
    
    IDV ENFORCEMENT:
    - Ensures payout never exceeds policy's Insured Declared Value
    - Tracks IDV cap application in ledger for audit
    """
    # -------------------------------------------------
    # Step 1: Fetch and validate claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.READY_FOR_REVIEW, ClaimStatus.UNDER_REVIEW, ClaimStatus.SURVEY_COMPLETED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in READY_FOR_REVIEW, UNDER_REVIEW, or SURVEY_COMPLETED status to approve."
        )
    
    # -------------------------------------------------
    # Step 2: Fetch linked policy for IDV enforcement
    # -------------------------------------------------
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=400, detail="Policy not found for claim")
    
    # -------------------------------------------------
    # Step 3: Guard checks before settlement calculation
    # -------------------------------------------------
    
    # Check 1: Policy must be active
    if not policy.is_active:
        raise HTTPException(
            status_code=400,
            detail="Approval blocked: Policy is inactive."
        )
    
    # Check 2: Incident date must be within policy period
    if not (policy.policy_start_date <= claim.incident_date <= policy.policy_end_date):
        raise HTTPException(
            status_code=400,
            detail="Approval blocked: Incident date outside policy coverage period."
        )
    
    # Check 3: Count HIGH validation failures
    high_failures = db.query(ValidationResult).filter(
        ValidationResult.claim_id == claim_id,
        ValidationResult.is_match == False,
        ValidationResult.severity == ValidationSeverity.HIGH
    ).count()
    
    if high_failures >= 2:
        raise HTTPException(
            status_code=400,
            detail="Approval blocked: Multiple HIGH validation failures. Escalation required."
        )
    
    # -------------------------------------------------
    # Step 4: Calculate settlement using depreciation engine
    # -------------------------------------------------

    # Convert parts to dict format expected by settlement engine
    parts_dict = [{"type": p.type, "amount": p.amount} for p in request.parts]
    
    settlement = calculate_settlement(
        parts=parts_dict,
        vehicle_age_years=request.vehicle_age_years,
        deductible=request.deductible_amount
    )
    
    # -------------------------------------------------
    # Step 5: Apply IDV cap enforcement
    # -------------------------------------------------

    # IDV (Insured Declared Value) is the maximum liability for the policy
    # If calculated amount exceeds IDV, cap the payout at IDV amount
    # -------------------------------------------------
    calculated_payable = settlement.final_payable
    idv_capped = False
    final_payable = calculated_payable
    
    if calculated_payable > policy.idv_amount:
        # IDV cap triggered: payout limited to policy maximum
        final_payable = policy.idv_amount
        idv_capped = True
    
    # -------------------------------------------------
    # Step 6: Determine ledger version number
    # -------------------------------------------------

    # Count existing ledger entries for this claim to determine next version
    # Versioning enables audit trail for recalculations
    # -------------------------------------------------
    existing_ledger_count = db.query(SettlementLedger).filter(
        SettlementLedger.claim_id == claim_id
    ).count()
    version_number = existing_ledger_count + 1
    
    # -------------------------------------------------
    # Step 7: Insert immutable SettlementLedger record
    # -------------------------------------------------

    # Ledger provides immutable audit trail of settlement calculations
    # Each approval creates a new versioned record
    # -------------------------------------------------
    ledger_entry = SettlementLedger(
        claim_id=claim.id,
        version_number=version_number,
        estimated_amount=settlement.estimated_amount,
        total_depreciation=settlement.total_depreciation,
        deductible_amount=request.deductible_amount,
        calculated_payable=calculated_payable,
        idv_amount=policy.idv_amount,
        idv_capped=idv_capped,
        final_payable=final_payable
    )
    db.add(ledger_entry)
    
    # -------------------------------------------------
    # Step 8: Update claim snapshot fields
    # -------------------------------------------------

    # Store final settlement values on claim for quick reference
    # These fields provide the current financial snapshot
    # -------------------------------------------------
    claim.estimated_amount = settlement.estimated_amount
    claim.depreciation_amount = settlement.total_depreciation
    claim.deductible_amount = request.deductible_amount
    claim.final_payable = final_payable
    
    # -------------------------------------------------
    # Step 9: Update claim status
    # -------------------------------------------------

    old_status = claim.status
    claim.status = ClaimStatus.APPROVED
    
    # -------------------------------------------------
    # Step 10: Create status history record
    # -------------------------------------------------

    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.APPROVED
    )
    db.add(status_history)
    
    # -------------------------------------------------
    # Step 11: Commit transaction
    # -------------------------------------------------

    # All changes (ledger, claim snapshot, status) committed atomically
    # -------------------------------------------------
    db.commit()
    db.refresh(claim)
    
    # -------------------------------------------------
    # Step 12: Return settlement summary
    # -------------------------------------------------

    return {
        "message": "Claim approved successfully",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status.value,
        "settlement": {
            "estimated_amount": settlement.estimated_amount,
            "total_depreciation": settlement.total_depreciation,
            "deductible_amount": request.deductible_amount,
            "calculated_payable": calculated_payable,
            "idv_amount": policy.idv_amount,
            "idv_capped": idv_capped,
            "final_payable": final_payable,
            "ledger_version": version_number
        }
    }



# -------------------------------------------------
# Claim Rejection Endpoint
# -------------------------------------------------
@router.post("/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    request: RejectionRequest,
    db: Session = Depends(get_db)
):
    """
    Reject a claim with a provided reason.
    
    WORKFLOW:
    1. Verify claim exists and is in READY_FOR_REVIEW status
    2. Update claim status to REJECTED
    3. Create status history record with rejection context
    4. Commit transaction
    
    Note: Rejection reason is stored in the response for audit purposes
    but not persisted to the claim record (can be extended if needed).
    """
    # -------------------------------------------------
    # Step 1: Fetch and validate claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.READY_FOR_REVIEW, ClaimStatus.UNDER_REVIEW, ClaimStatus.SUBMITTED, ClaimStatus.SURVEY_COMPLETED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in a reviewable status to reject."
        )
    
    # -------------------------------------------------
    # Step 2: Update claim status
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.REJECTED
    
    # -------------------------------------------------
    # Step 3: Create status history record
    # -------------------------------------------------
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.REJECTED
    )
    db.add(status_history)
    
    # -------------------------------------------------
    # Step 4: Commit transaction
    # -------------------------------------------------
    db.commit()
    db.refresh(claim)
    
    # -------------------------------------------------
    # Step 5: Return rejection summary
    # -------------------------------------------------
    return {
        "message": "Claim rejected successfully",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status.value,
        "rejection_reason": request.rejection_reason
    }


# -------------------------------------------------
# Manual Claim Escalation Endpoint
# -------------------------------------------------
@router.post("/{claim_id}/escalate", response_model=ClaimResponse)
def escalate_claim(
    claim_id: int,
    request: EscalationRequest,
    db: Session = Depends(get_db)
):
    """
    Manually escalate a claim to senior officer review.
    
    WORKFLOW:
    1. Verify claim exists and is in READY_FOR_REVIEW status
    2. Update claim status to ESCALATED
    3. Store escalation metadata (officer_id, reason, timestamp)
    4. Create status history record with explicit enum values
    5. Commit transaction
    
    RULES:
    - Only claims in READY_FOR_REVIEW status can be escalated
    - Escalation is permanent and requires senior officer override to resolve
    """
    # -------------------------------------------------
    # Step 1: Fetch and validate claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status not in [ClaimStatus.READY_FOR_REVIEW, ClaimStatus.UNDER_REVIEW, ClaimStatus.SURVEY_COMPLETED]:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in a reviewable status to escalate."
        )
    
    # -------------------------------------------------
    # Step 2: Update claim status and escalation fields
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.ESCALATED
    claim.escalated_by = request.officer_id
    claim.escalation_reason = request.reason
    claim.escalated_at = datetime.now()
    
    # -------------------------------------------------
    # Step 3: Create status history record with explicit enum values
    # -------------------------------------------------
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=ClaimStatus.READY_FOR_REVIEW,
        new_status=ClaimStatus.ESCALATED
    )
    db.add(status_history)
    
    # -------------------------------------------------
    # Step 4: Commit transaction
    # -------------------------------------------------
    db.commit()
    db.refresh(claim)
    
    # -------------------------------------------------
    # Step 5: Return escalation summary
    # -------------------------------------------------
    return claim


# -------------------------------------------------
# Senior Officer Override Approval Endpoint
# -------------------------------------------------
@router.post("/{claim_id}/override-approve")
def override_approve_claim(
    claim_id: int,
    request: OverrideApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Senior officer override approval for escalated claims.
    
    WORKFLOW:
    1. Verify claim exists and is in ESCALATED status
    2. Fetch linked policy for IDV cap enforcement
    3. Guard checks (policy active, incident date within period)
    4. Calculate settlement using depreciation engine
    5. Apply IDV cap enforcement
    6. Insert immutable SettlementLedger record
    7. Update claim snapshot fields
    8. Store override metadata (senior_officer_id, reason, timestamp)
    9. Update claim status to APPROVED
    10. Create status history record (ESCALATED -> APPROVED)
    11. Commit transaction
    
    RULES:
    - Only claims in ESCALATED status can be override-approved
    - Policy must be active
    - Incident date must be within policy period
    - HIGH validation failure count is IGNORED (bypassed by senior officer)
    """
    # -------------------------------------------------
    # Step 1: Fetch and validate claim
    # -------------------------------------------------
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status != ClaimStatus.ESCALATED:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in ESCALATED status for override approval."
        )
    
    # -------------------------------------------------
    # Step 2: Fetch linked policy for IDV enforcement
    # -------------------------------------------------
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=400, detail="Policy not found for claim")
    
    # -------------------------------------------------
    # Step 3: Guard checks before settlement calculation
    # -------------------------------------------------
    
    # Check 1: Policy must be active
    if not policy.is_active:
        raise HTTPException(
            status_code=400,
            detail="Approval blocked: Policy is inactive."
        )
    
    # Check 2: Incident date must be within policy period
    if not (policy.policy_start_date <= claim.incident_date <= policy.policy_end_date):
        raise HTTPException(
            status_code=400,
            detail="Approval blocked: Incident date outside policy coverage period."
        )
    
    # Note: HIGH validation failure count is intentionally NOT checked
    # Senior officer has authority to override validation failures
    
    # -------------------------------------------------
    # Step 4: Calculate settlement using depreciation engine
    # -------------------------------------------------
    # Convert parts to dict format expected by settlement engine
    parts_dict = [{"type": p.type, "amount": p.amount} for p in request.parts]
    
    settlement = calculate_settlement(
        parts=parts_dict,
        vehicle_age_years=request.vehicle_age_years,
        deductible=request.deductible_amount
    )
    
    # -------------------------------------------------
    # Step 5: Apply IDV cap enforcement
    # -------------------------------------------------
    calculated_payable = settlement.final_payable
    idv_capped = False
    final_payable = calculated_payable
    
    if calculated_payable > policy.idv_amount:
        # IDV cap triggered: payout limited to policy maximum
        final_payable = policy.idv_amount
        idv_capped = True
    
    # -------------------------------------------------
    # Step 6: Determine ledger version number
    # -------------------------------------------------
    existing_ledger_count = db.query(SettlementLedger).filter(
        SettlementLedger.claim_id == claim_id
    ).count()
    version_number = existing_ledger_count + 1
    
    # -------------------------------------------------
    # Step 7: Insert immutable SettlementLedger record
    # -------------------------------------------------
    ledger_entry = SettlementLedger(
        claim_id=claim.id,
        version_number=version_number,
        estimated_amount=settlement.estimated_amount,
        total_depreciation=settlement.total_depreciation,
        deductible_amount=request.deductible_amount,
        calculated_payable=calculated_payable,
        idv_amount=policy.idv_amount,
        idv_capped=idv_capped,
        final_payable=final_payable
    )
    db.add(ledger_entry)
    
    # -------------------------------------------------
    # Step 8: Update claim snapshot fields
    # -------------------------------------------------
    claim.estimated_amount = settlement.estimated_amount
    claim.depreciation_amount = settlement.total_depreciation
    claim.deductible_amount = request.deductible_amount
    claim.final_payable = final_payable
    
    # -------------------------------------------------
    # Step 9: Store override metadata
    # -------------------------------------------------
    claim.override_by = request.senior_officer_id
    claim.override_reason = request.reason
    claim.override_at = datetime.now()
    
    # -------------------------------------------------
    # Step 10: Update claim status and create history
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.APPROVED
    
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=ClaimStatus.ESCALATED,
        new_status=ClaimStatus.APPROVED
    )
    db.add(status_history)
    
    # -------------------------------------------------
    # Step 11: Commit transaction
    # -------------------------------------------------
    db.commit()
    db.refresh(claim)
    
    # -------------------------------------------------
    # Step 12: Return settlement summary
    # -------------------------------------------------
    return {
        "message": "Claim override-approved successfully by senior officer",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status.value,
        "override_by": claim.override_by,
        "override_reason": claim.override_reason,
        "settlement": {
            "estimated_amount": settlement.estimated_amount,
            "total_depreciation": settlement.total_depreciation,
            "deductible_amount": request.deductible_amount,
            "calculated_payable": calculated_payable,
            "idv_amount": policy.idv_amount,
            "idv_capped": idv_capped,
            "final_payable": final_payable,
            "ledger_version": version_number
        }
    }


# -------------------------------------------------
# Get Documents for a Claim
# -------------------------------------------------
@router.get("/{claim_id}/documents")
def get_claim_documents(claim_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all extracted documents and their fields for a claim.
    Returns a list of documents, each containing its type,
    extraction timestamp, and all extracted fields.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    documents = (
        db.query(ExtractedDocument)
        .filter(ExtractedDocument.claim_id == claim_id)
        .all()
    )

    result = []
    for doc in documents:
        fields = (
            db.query(ExtractedField)
            .filter(ExtractedField.document_id == doc.id)
            .all()
        )
        result.append({
            "id": doc.id,
            "document_type": doc.document_type.value,
            "file_path": doc.file_path,
            "extracted_at": doc.extracted_at.isoformat() if doc.extracted_at else None,
            "fields": [
                {
                    "field_name": f.field_name,
                    "field_value": f.field_value,
                    "confidence_score": f.confidence_score
                }
                for f in fields
            ]
        })

    return result
