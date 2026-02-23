"""
-------------------------------------------------
Extracted Field Model
-------------------------------------------------
Represents individual fields extracted from documents.
Stores field names, values, and confidence scores for data extraction.
"""

from sqlalchemy import Column, Integer, ForeignKey, String, Float

from app.db.base import Base


class ExtractedField(Base):
    """
    SQLAlchemy model for fields extracted from documents.
    """
    __tablename__ = "extracted_fields"

    # -------------------------------------------------
    # Primary Key
    # -------------------------------------------------
    id = Column(Integer, primary_key=True)

    # -------------------------------------------------
    # Foreign Key Relationships
    # -------------------------------------------------
    document_id = Column(Integer, ForeignKey("extracted_documents.id"), nullable=False)

    # -------------------------------------------------
    # Field Data
    # -------------------------------------------------
    field_name = Column(String, nullable=False)
    field_value = Column(String, nullable=True)

    # -------------------------------------------------
    # Extraction Metadata
    # -------------------------------------------------
    confidence_score = Column(Float, nullable=True)
