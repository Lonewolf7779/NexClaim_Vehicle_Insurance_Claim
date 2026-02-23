"""
-------------------------------------------------
Document Type Enum
-------------------------------------------------
Defines the types of documents that can be extracted
and processed in the claim workflow.
"""

from enum import Enum


class DocumentType(Enum):
    """
    Enumeration of supported document types for claim processing.
    """
    CLAIM_FORM = "CLAIM_FORM"
    REPAIR_INVOICE = "REPAIR_INVOICE"
