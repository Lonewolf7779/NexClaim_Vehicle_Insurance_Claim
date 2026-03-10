from enum import Enum


class ClaimStatus(Enum):
    # Initial submission
    SUBMITTED = "SUBMITTED"
    
    # Officer review stages
    UNDER_REVIEW = "UNDER_REVIEW"
    DOCUMENT_REQUIRED = "DOCUMENT_REQUIRED"
    SURVEY_ASSIGNED = "SURVEY_ASSIGNED"
    SURVEY_COMPLETED = "SURVEY_COMPLETED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    
    # Processing stages (legacy - for backward compatibility)
    PROCESSING = "PROCESSING"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    
    # Final decisions
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"
    
    # Payment and closure stages
    REPAIR_IN_PROGRESS = "REPAIR_IN_PROGRESS"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"
    CLOSED = "CLOSED"


# Alias mappings for backward compatibility
CLAIM_STATUS_ALIASES = {
    "PROCESSING": "UNDER_REVIEW",
    "READY_FOR_REVIEW": "UNDER_REVIEW",
}
