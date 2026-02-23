"""
-------------------------------------------------
Validation Result Model
-------------------------------------------------
Stores the outcome of claim validation rule checks.
Records discrepancies between expected and actual values
with severity classification for review prioritization.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.validation_severity import ValidationSeverity


class ValidationResult(Base):
    """
    ORM model for validation rule results.
    
    Tracks validation outcomes against claims including:
    - Rule identification
    - Expected vs actual value comparison
    - Match status
    - Severity classification
    - Timestamp for audit trail
    """
    __tablename__ = "validation_results"

    # -------------------------------------------------
    # Primary Key
    # -------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)

    # -------------------------------------------------
    # Claim Association
    # -------------------------------------------------
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)

    # -------------------------------------------------
    # Validation Rule Details
    # -------------------------------------------------
    rule_name = Column(String, nullable=False)

    # -------------------------------------------------
    # Value Comparison
    # -------------------------------------------------
    expected_value = Column(String, nullable=True)
    actual_value = Column(String, nullable=True)

    # -------------------------------------------------
    # Match Status
    # -------------------------------------------------
    is_match = Column(Boolean, nullable=False)

    # -------------------------------------------------
    # Severity Classification
    # -------------------------------------------------
    severity = Column(SQLEnum(ValidationSeverity), nullable=False)

    # -------------------------------------------------
    # Audit Timestamp
    # -------------------------------------------------
    created_at = Column(DateTime, server_default=func.now())
