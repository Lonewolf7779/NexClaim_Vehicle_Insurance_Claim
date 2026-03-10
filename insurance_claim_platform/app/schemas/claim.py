from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.claim_status import ClaimStatus




class ClaimCreate(BaseModel):
    policy_id: int
    incident_date: datetime
    description: str


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

    class Config:
        orm_mode = True



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
