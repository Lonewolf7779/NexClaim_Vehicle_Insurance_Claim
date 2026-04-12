"""
-------------------------------------------------
Extracted Document Model
-------------------------------------------------
Represents documents that have been extracted and processed
for a specific claim. Tracks the document type and extraction timestamp.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.document_type import DocumentType


class ExtractedDocument(Base):
    """
    SQLAlchemy model for extracted documents associated with claims.
    """
    __tablename__ = "extracted_documents"

    # -------------------------------------------------
    # Primary Key
    # -------------------------------------------------
    id = Column(Integer, primary_key=True)

    # -------------------------------------------------
    # Foreign Key Relationships
    # -------------------------------------------------
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)

    # -------------------------------------------------
    # Document Metadata
    # -------------------------------------------------
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_path = Column(String(500), nullable=True)

    # -------------------------------------------------
    # Timestamps
    # -------------------------------------------------
    extracted_at = Column(DateTime, server_default=func.now())
