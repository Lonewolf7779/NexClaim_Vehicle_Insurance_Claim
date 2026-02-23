from datetime import datetime
from pydantic import BaseModel
from app.models.claim_status import ClaimStatus


class ClaimStatusHistoryResponse(BaseModel):
    id: int
    claim_id: int
    old_status: ClaimStatus
    new_status: ClaimStatus
    changed_at: datetime

    class Config:
        orm_mode = True
