"""
-------------------------------------------------
Validation Severity Enum
-------------------------------------------------
Defines severity levels for claim validation results.
Used to classify validation failures by impact level.
"""

from enum import Enum


class ValidationSeverity(str, Enum):
    """
    Severity levels for validation rule results.
    
    LOW: Minor discrepancy, claim can proceed
    MEDIUM: Moderate issue, may require review
    HIGH: Critical failure, blocks claim processing
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
