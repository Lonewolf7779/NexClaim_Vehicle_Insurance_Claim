from datetime import datetime
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

    class Config:
        orm_mode = True


class ClaimUpdateStatus(BaseModel):
    status: ClaimStatus
