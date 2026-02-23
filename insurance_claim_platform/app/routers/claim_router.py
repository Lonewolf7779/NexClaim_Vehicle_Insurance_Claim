"""
-------------------------------------------------
Claim Router
-------------------------------------------------
Handles all claim-related API endpoints including
claim creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.deps import get_db
from app.models.models import Claim, ClaimStatusHistory, Policy
from app.schemas.claim import ClaimCreate, ClaimResponse, ClaimUpdateStatus
from app.models.claim_status import ClaimStatus
from app.models.extracted_document import ExtractedDocument
from app.models.extracted_field import ExtractedField
from app.models.document_type import DocumentType
from app.models.validation_result import ValidationResult
from app.models.validation_severity import ValidationSeverity
from app.services.settlement_engine import calculate_settlement
from app.models.settlement_ledger import SettlementLedger

from pydantic import BaseModel
from typing import Dict
from typing import Optional
from typing import List




# -------------------------------------------------
# Router Initialization
# -------------------------------------------------
router = APIRouter(prefix="/claims", tags=["Claims"])


# -------------------------------------------------
# Claim Creation
# -------------------------------------------------
@router.post("/", response_model=ClaimResponse)
def create_claim(claim: ClaimCreate, db: Session = Depends(get_db)):
    """
    Create a new claim with generated claim number.
    Default status is set to SUBMITTED.
    """
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

    return db_claim


# -------------------------------------------------
# Claim Retrieval
# -------------------------------------------------
@router.get("/", response_model=list[ClaimResponse])
def get_claims(db: Session = Depends(get_db)):
    """
    Retrieve all claims from the database.
    """
    return db.query(Claim).all()


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single claim by ID.
    Returns 404 if claim not found.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


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
    # Document Creation
    # -------------------------------------------------
    extracted_doc = ExtractedDocument(
        claim_id=claim.id,
        document_type=document.document_type
    )
    db.add(extracted_doc)
    db.flush()

    # -------------------------------------------------
    # Field Insertion
    # -------------------------------------------------
    for field_name, field_data in document.fields.items():
        extracted_field = ExtractedField(
            document_id=extracted_doc.id,
            field_name=field_name,
            field_value=field_data.value,
            confidence_score=field_data.confidence
        )
        db.add(extracted_field)

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


class RejectionRequest(BaseModel):
    """Request body for claim rejection."""
    rejection_reason: str


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
    
    if claim.status != ClaimStatus.READY_FOR_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in READY_FOR_REVIEW status to approve."
        )
    
    # -------------------------------------------------
    # Step 2: Fetch linked policy for IDV enforcement
    # -------------------------------------------------
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=400, detail="Policy not found for claim")
    
    # -------------------------------------------------
    # Step 3: Calculate settlement using depreciation engine
    # -------------------------------------------------
    # Convert parts to dict format expected by settlement engine
    parts_dict = [{"type": p.type, "amount": p.amount} for p in request.parts]
    
    settlement = calculate_settlement(
        parts=parts_dict,
        vehicle_age_years=request.vehicle_age_years,
        deductible=request.deductible_amount
    )
    
    # -------------------------------------------------
    # Step 4: Apply IDV cap enforcement
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
    # Step 5: Determine ledger version number
    # -------------------------------------------------
    # Count existing ledger entries for this claim to determine next version
    # Versioning enables audit trail for recalculations
    # -------------------------------------------------
    existing_ledger_count = db.query(SettlementLedger).filter(
        SettlementLedger.claim_id == claim_id
    ).count()
    version_number = existing_ledger_count + 1
    
    # -------------------------------------------------
    # Step 6: Insert immutable SettlementLedger record
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
    # Step 7: Update claim snapshot fields
    # -------------------------------------------------
    # Store final settlement values on claim for quick reference
    # These fields provide the current financial snapshot
    # -------------------------------------------------
    claim.estimated_amount = settlement.estimated_amount
    claim.depreciation_amount = settlement.total_depreciation
    claim.deductible_amount = request.deductible_amount
    claim.final_payable = final_payable
    
    # -------------------------------------------------
    # Step 8: Update claim status
    # -------------------------------------------------
    old_status = claim.status
    claim.status = ClaimStatus.APPROVED
    
    # -------------------------------------------------
    # Step 9: Create status history record
    # -------------------------------------------------
    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=ClaimStatus.APPROVED
    )
    db.add(status_history)
    
    # -------------------------------------------------
    # Step 10: Commit transaction
    # -------------------------------------------------
    # All changes (ledger, claim snapshot, status) committed atomically
    # -------------------------------------------------
    db.commit()
    db.refresh(claim)
    
    # -------------------------------------------------
    # Step 11: Return settlement summary
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
    
    if claim.status != ClaimStatus.READY_FOR_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Claim must be in READY_FOR_REVIEW status to reject."
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
