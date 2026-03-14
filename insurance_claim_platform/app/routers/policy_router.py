"""
-------------------------------------------------
Policy Router
-------------------------------------------------
Handles all policy-related API endpoints including
policy creation and retrieval operations.
"""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.models import Policy
from app.schemas.policy import PolicyBase, PolicyResponse


# -------------------------------------------------
# Router Initialization
# -------------------------------------------------
router = APIRouter(prefix="/policies", tags=["Policies"])


# -------------------------------------------------
# Policy Creation
# -------------------------------------------------
@router.post("/", response_model=PolicyResponse)
def create_policy(
    policy: PolicyBase,
    db: Session = Depends(get_db),
    x_replace_existing_policies: bool = Header(default=False)
):
    """
    Create a new policy record.
    Accepts policy data and persists to database.
    """
    normalized_policy_number = policy.policy_number.strip()

    if x_replace_existing_policies:
        existing_policies = db.query(Policy).order_by(Policy.id.asc()).all()
        primary_policy = existing_policies[0] if existing_policies else None

        if primary_policy:
            primary_policy.policy_number = normalized_policy_number
            primary_policy.policy_holder_name = policy.policy_holder_name
            primary_policy.vehicle_number = policy.vehicle_number
            primary_policy.vehicle_model = policy.vehicle_model
            primary_policy.policy_start_date = policy.policy_start_date
            primary_policy.policy_end_date = policy.policy_end_date
            primary_policy.is_active = policy.is_active
            primary_policy.idv_amount = policy.idv_amount
            primary_policy.aadhar_number = policy.aadhar_number
            primary_policy.pan_number = policy.pan_number
            primary_policy.driving_license_number = policy.driving_license_number
            primary_policy.rc_number = policy.rc_number

            for stale_policy in existing_policies[1:]:
                db.delete(stale_policy)

            db.commit()
            db.refresh(primary_policy)
            return primary_policy

    existing_policy = db.query(Policy).filter(Policy.policy_number == normalized_policy_number).first()

    if existing_policy:
        existing_policy.policy_holder_name = policy.policy_holder_name
        existing_policy.vehicle_number = policy.vehicle_number
        existing_policy.vehicle_model = policy.vehicle_model
        existing_policy.policy_start_date = policy.policy_start_date
        existing_policy.policy_end_date = policy.policy_end_date
        existing_policy.is_active = policy.is_active
        existing_policy.idv_amount = policy.idv_amount
        existing_policy.aadhar_number = policy.aadhar_number
        existing_policy.pan_number = policy.pan_number
        existing_policy.driving_license_number = policy.driving_license_number
        existing_policy.rc_number = policy.rc_number

        db.commit()
        db.refresh(existing_policy)
        return existing_policy

    db_policy = Policy(
        policy_number=normalized_policy_number,
        policy_holder_name=policy.policy_holder_name,
        vehicle_number=policy.vehicle_number,
        vehicle_model=policy.vehicle_model,
        policy_start_date=policy.policy_start_date,
        policy_end_date=policy.policy_end_date,
        is_active=policy.is_active,
        idv_amount=policy.idv_amount,
        aadhar_number=policy.aadhar_number,
        pan_number=policy.pan_number,
        driving_license_number=policy.driving_license_number,
        rc_number=policy.rc_number
    )

    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)

    return db_policy


# -------------------------------------------------
# Policy Retrieval
# -------------------------------------------------
@router.get("/", response_model=list[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    """
    Retrieve all policies from the database.
    """
    return db.query(Policy).all()


@router.get("/by-number/{policy_number}", response_model=PolicyResponse)
def get_policy_by_number(policy_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a policy by policy number.
    Returns 404 if policy not found.
    """
    policy = db.query(Policy).filter(Policy.policy_number == policy_number.strip()).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.get("/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single policy by ID.
    Returns 404 if policy not found.
    """
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy
