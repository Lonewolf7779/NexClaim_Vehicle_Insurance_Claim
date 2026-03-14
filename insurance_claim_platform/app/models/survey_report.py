from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class SurveyReport(Base):
    __tablename__ = "survey_reports"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    surveyor_id = Column(String, nullable=False)
    surveyor_name = Column(String, nullable=True)
    assignment_notes = Column(String, nullable=True)
    damage_description = Column(String, nullable=True)
    vehicle_condition = Column(String, nullable=True)
    parts_damaged = Column(String, nullable=True)
    estimated_repair_cost = Column(Float, nullable=True)
    recommendation = Column(String, nullable=True)
    officer_review_notes = Column(String, nullable=True)
    assigned_at = Column(DateTime, server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)