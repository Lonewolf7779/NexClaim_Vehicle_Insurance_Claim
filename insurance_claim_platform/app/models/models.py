from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Enum as SQLEnum

from sqlalchemy.sql import func
from app.db.base import Base
from app.models.claim_status import ClaimStatus


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_number = Column(String, unique=True, nullable=False)
    policy_holder_name = Column(String, nullable=False)
    vehicle_number = Column(String, nullable=False)
    vehicle_model = Column(String, nullable=True)
    policy_start_date = Column(DateTime, nullable=False)
    policy_end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # -------------------------------------------------
    # IDV (Insured Declared Value) Field
    # -------------------------------------------------
    # Maximum liability amount for the policy. Used as a cap
    # for claim settlements to ensure payouts do not exceed
    # the vehicle's insured value.
    # -------------------------------------------------
    idv_amount = Column(Float, nullable=False)
    
    # -------------------------------------------------
    # Customer Identity Fields (from documents)
    # -------------------------------------------------
    # These fields store customer identity information
    # submitted during policy purchase
    # -------------------------------------------------
    aadhar_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    driving_license_number = Column(String, nullable=True)
    rc_number = Column(String, nullable=True)


class Claim(Base):

    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    status = Column(SQLEnum(ClaimStatus), nullable=False, default=ClaimStatus.SUBMITTED)
    
    # -------------------------------------------------
    # Settlement Engine Fields
    # -------------------------------------------------
    # These fields store the calculated settlement amounts
    # after depreciation and deductible adjustments.
    # All fields are nullable until claim is approved.
    # -------------------------------------------------
    estimated_amount = Column(Float, nullable=True)
    depreciation_amount = Column(Float, nullable=True)
    deductible_amount = Column(Float, nullable=True)
    final_payable = Column(Float, nullable=True)
    
    # -------------------------------------------------
    # Escalation Fields
    # -------------------------------------------------
    # Track manual escalation and senior officer overrides
    # for audit and compliance purposes.
    # -------------------------------------------------
    escalated_by = Column(String, nullable=True)
    escalation_reason = Column(String, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    override_by = Column(String, nullable=True)
    override_reason = Column(String, nullable=True)
    override_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())



class ClaimStatusHistory(Base):
    __tablename__ = "claim_status_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    old_status = Column(SQLEnum(ClaimStatus), nullable=True)
    new_status = Column(SQLEnum(ClaimStatus), nullable=False)
    changed_at = Column(DateTime, server_default=func.now())
