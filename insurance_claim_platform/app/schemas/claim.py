from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.claim_status import ClaimStatus




class ClaimCreate(BaseModel):
    policy_id: int
    incident_date: datetime
    description: str


class SurveyReportResponse(BaseModel):
    id: int
    claim_id: int
    version_number: int
    surveyor_id: str
    surveyor_name: Optional[str] = None
    assignment_notes: Optional[str] = None
    damage_description: Optional[str] = None
    vehicle_condition: Optional[str] = None
    parts_damaged: Optional[str] = None
    estimated_repair_cost: Optional[float] = None
    recommendation: Optional[str] = None
    officer_review_notes: Optional[str] = None
    assigned_at: datetime
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SurveyReportSubmitRequest(BaseModel):
    surveyor_id: str
    surveyor_name: Optional[str] = None
    damage_description: str
    vehicle_condition: str
    parts_damaged: Optional[str] = None
    estimated_repair_cost: float
    recommendation: str


class SurveyReinspectionRequest(BaseModel):
    surveyor_id: str
    surveyor_name: str
    reason: str


class ClaimResponse(BaseModel):
    id: int
    claim_number: str
    policy_id: int
    incident_date: datetime
    description: str
    status: ClaimStatus
    created_at: datetime
    updated_at: datetime
    escalated_by: Optional[str] = None
    escalation_reason: Optional[str] = None
    escalated_at: Optional[datetime] = None
    estimated_amount: Optional[float] = None
    depreciation_amount: Optional[float] = None
    deductible_amount: Optional[float] = None
    final_payable: Optional[float] = None
    latest_survey_report: Optional[SurveyReportResponse] = None
    survey_report_count: int = 0

    model_config = ConfigDict(from_attributes=True)



class ClaimUpdateStatus(BaseModel):
    status: ClaimStatus


class EscalationRequest(BaseModel):
    officer_id: str
    reason: str


class RejectionRequest(BaseModel):
    """Request body for claim rejection."""
    rejection_reason: str


class PartItem(BaseModel):
    """Part item for settlement calculation."""
    type: str
    amount: float


class OverrideApprovalRequest(BaseModel):
    """Request body for senior officer override approval."""
    senior_officer_id: str
    reason: str
    vehicle_age_years: float
    parts: List[PartItem]
    deductible_amount: float
