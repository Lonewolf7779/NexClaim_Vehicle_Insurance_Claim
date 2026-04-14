from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PolicyBase(BaseModel):
    policy_number: str
    policy_holder_name: str
    vehicle_number: str
    vehicle_model: Optional[str] = None
    policy_start_date: datetime
    policy_end_date: datetime
    is_active: bool
    idv_amount: float
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    driving_license_number: Optional[str] = None
    rc_number: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    policy_type: str = "COMPREHENSIVE"
    has_zero_depreciation: bool = False



class PolicyResponse(PolicyBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
