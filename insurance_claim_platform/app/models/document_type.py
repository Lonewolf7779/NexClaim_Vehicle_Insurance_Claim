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
    DAMAGE_PHOTOS = "DAMAGE_PHOTOS"
    DISCHARGE_VOUCHER = "DISCHARGE_VOUCHER"
    DRIVING_LICENSE = "DRIVING_LICENSE"
    FIR = "FIR"
    FORM28 = "FORM28"
    FORM29 = "FORM29"
    FORM30 = "FORM30"
    INVOICE = "INVOICE"
    REPAIR_INVOICE = "REPAIR_INVOICE"
    REPAIR_BILLS = "REPAIR_BILLS"
    REPAIR_ESTIMATE = "REPAIR_ESTIMATE"
    RC_BOOK = "RC_BOOK"
    SUBROGATION_LETTER = "SUBROGATION_LETTER"
    SURVEY_REPORT = "SURVEY_REPORT"
    VEHICLE_KEYS = "VEHICLE_KEYS"
