"""
-------------------------------------------------
Policy Router
-------------------------------------------------
Handles all policy-related API endpoints including
policy creation and retrieval operations.
"""

from fastapi import APIRouter, Depends, HTTPException
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
def create_policy(policy: PolicyBase, db: Session = Depends(get_db)):
    """
    Create a new policy record.
    Accepts policy data and persists to database.
    """
    db_policy = Policy(
        policy_number=policy.policy_number,
        policy_holder_name=policy.policy_holder_name,
        vehicle_number=policy.vehicle_number,
        policy_start_date=policy.policy_start_date,
        policy_end_date=policy.policy_end_date,
        is_active=policy.is_active,
        idv_amount=policy.idv_amount
    )


    # Persist policy to database
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
