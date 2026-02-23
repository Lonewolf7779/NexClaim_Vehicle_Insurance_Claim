from datetime import datetime
from pydantic import BaseModel


class PolicyBase(BaseModel):
    policy_number: str
    policy_holder_name: str
    vehicle_number: str
    policy_start_date: datetime
    policy_end_date: datetime
    is_active: bool
    idv_amount: float



class PolicyResponse(PolicyBase):
    id: int

    class Config:
        orm_mode = True
