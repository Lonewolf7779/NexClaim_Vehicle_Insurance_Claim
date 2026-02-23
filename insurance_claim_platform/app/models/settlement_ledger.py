# -------------------------------------------------
# Settlement Ledger Model
# -------------------------------------------------
# Immutable audit trail for claim settlement calculations.
# Each approval generates a new ledger entry with version
# numbering to maintain complete financial history.
#
# AUDIT PURPOSE:
# - Provides immutable record of settlement calculations
# - Enables forensic analysis of claim decisions
# - Supports regulatory compliance requirements
# - Tracks IDV cap enforcement decisions
#
# VERSIONING STRATEGY:
# - Each recalculation increments version_number
# - Previous versions remain immutable
# - Creates complete audit trail for claim lifecycle
# -------------------------------------------------

from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class SettlementLedger(Base):
    """
    Immutable settlement calculation ledger.
    
    Stores each settlement calculation as a separate record
    to maintain complete audit history. Version numbers
    enable tracking of recalculations and amendments.
    """
    __tablename__ = "settlement_ledgers"

    # -------------------------------------------------
    # Primary Key
    # -------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)

    # -------------------------------------------------
    # Foreign Key Relationships
    # -------------------------------------------------
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)

    # -------------------------------------------------
    # Version Control
    # -------------------------------------------------
    # Incremental version number for audit trail
    # First calculation = 1, amendments = 2, 3, etc.
    # -------------------------------------------------
    version_number = Column(Integer, nullable=False)

    # -------------------------------------------------
    # Financial Calculation Fields
    # -------------------------------------------------
    # Raw settlement amounts before IDV cap enforcement
    # -------------------------------------------------
    estimated_amount = Column(Float, nullable=False)
    total_depreciation = Column(Float, nullable=False)
    deductible_amount = Column(Float, nullable=False)
    calculated_payable = Column(Float, nullable=False)

    # -------------------------------------------------
    # IDV Cap Enforcement Fields
    # -------------------------------------------------
    # Tracks IDV (Insured Declared Value) cap application
    # idv_amount: The policy's maximum liability value
    # idv_capped: Whether payout was limited by IDV
    # final_payable: Amount after IDV cap (if applied)
    # -------------------------------------------------
    idv_amount = Column(Float, nullable=False)
    idv_capped = Column(Boolean, nullable=False, default=False)
    final_payable = Column(Float, nullable=False)

    # -------------------------------------------------
    # Audit Timestamp
    # -------------------------------------------------
    # Immutable record creation time
    # -------------------------------------------------
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
