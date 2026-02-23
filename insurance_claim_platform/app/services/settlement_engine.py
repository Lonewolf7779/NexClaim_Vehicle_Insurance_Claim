# -------------------------------------------------
# Indian Motor Depreciation Settlement Engine
# -------------------------------------------------
# Calculates claim settlement amounts based on Indian motor insurance
# depreciation rules. Applies depreciation to parts based on material
# type and vehicle age, then deducts policy deductible.
#
# DEPRECIATION RULES (Non-Metal Parts):
#   - PLASTIC: 50%
#   - RUBBER: 50%
#   - NYLON: 50%
#   - FIBRE: 30%
#   - GLASS: 0%
#
# DEPRECIATION RULES (Metal Parts - Age-based):
#   - < 0.5 years: 5%
#   - 0.5 - 1 years: 10%
#   - 1 - 2 years: 20%
#   - 2 - 3 years: 30%
#   - 3 - 4 years: 40%
#   - >= 4 years: 50%
# -------------------------------------------------

from typing import List, Dict
from pydantic import BaseModel


# -------------------------------------------------
# Data Models
# -------------------------------------------------
class PartItem(BaseModel):
    """Represents a vehicle part for settlement calculation."""
    type: str  # Part material type (PLASTIC, RUBBER, METAL, etc.)
    amount: float  # Original cost of the part


class SettlementResult(BaseModel):
    """Result of settlement calculation."""
    estimated_amount: float  # Total before depreciation
    total_depreciation: float  # Total depreciation applied
    final_payable: float  # Amount after depreciation and deductible


# -------------------------------------------------
# Fixed Depreciation Rates (Non-Metal Parts)
# -------------------------------------------------
FIXED_DEPRECIATION_RATES = {
    "PLASTIC": 0.50,  # 50% depreciation
    "RUBBER": 0.50,   # 50% depreciation
    "NYLON": 0.50,    # 50% depreciation
    "FIBRE": 0.30,    # 30% depreciation
    "GLASS": 0.00,    # 0% depreciation (no depreciation)
}


def calculate_fixed_depreciation(part_type: str, amount: float) -> float:
    """
    Calculate depreciation for non-metal parts using fixed rates.
    
    Args:
        part_type: Material type of the part (PLASTIC, RUBBER, etc.)
        amount: Original cost of the part
    
    Returns:
        Depreciation amount to be deducted
    """
    # Normalize part type to uppercase for matching
    normalized_type = part_type.upper()
    
    # Get depreciation rate (default to 0 if type not found)
    rate = FIXED_DEPRECIATION_RATES.get(normalized_type, 0.00)
    
    # Calculate depreciation amount
    depreciation = amount * rate
    
    return depreciation


def calculate_metal_depreciation(vehicle_age_years: float, amount: float) -> float:
    """
    Calculate depreciation for metal parts based on vehicle age.
    
    Age-based depreciation schedule:
        < 0.5 years: 5%
        0.5 - 1 years: 10%
        1 - 2 years: 20%
        2 - 3 years: 30%
        3 - 4 years: 40%
        >= 4 years: 50%
    
    Args:
        vehicle_age_years: Age of vehicle in years
        amount: Original cost of the metal part
    
    Returns:
        Depreciation amount to be deducted
    """
    # Determine depreciation rate based on vehicle age
    if vehicle_age_years < 0.5:
        rate = 0.05  # 5%
    elif vehicle_age_years < 1.0:
        rate = 0.10  # 10%
    elif vehicle_age_years < 2.0:
        rate = 0.20  # 20%
    elif vehicle_age_years < 3.0:
        rate = 0.30  # 30%
    elif vehicle_age_years < 4.0:
        rate = 0.40  # 40%
    else:
        rate = 0.50  # 50%
    
    # Calculate depreciation amount
    depreciation = amount * rate
    
    return depreciation


def calculate_settlement(
    parts: List[Dict[str, any]], 
    vehicle_age_years: float, 
    deductible: float
) -> SettlementResult:
    """
    Calculate full settlement for a motor insurance claim.
    
    Processes each part:
        - Non-metal parts: Apply fixed depreciation rates
        - Metal parts: Apply age-based depreciation
        - Other parts: No depreciation applied
    
    Then subtracts policy deductible from net amount.
    
    Args:
        parts: List of parts with 'type' and 'amount' keys
        vehicle_age_years: Age of vehicle in years
        deductible: Policy deductible amount
    
    Returns:
        SettlementResult with estimated_amount, total_depreciation, final_payable
    """
    # -------------------------------------------------
    # Initialize Calculation Variables
    # -------------------------------------------------
    estimated_amount = 0.0
    total_depreciation = 0.0
    
    # -------------------------------------------------
    # Process Each Part
    # -------------------------------------------------
    for part in parts:
        part_type = part.get("type", "").upper()
        part_amount = float(part.get("amount", 0))
        
        # Add to estimated amount (before depreciation)
        estimated_amount += part_amount
        
        # Calculate depreciation based on part type
        if part_type == "METAL":
            # Metal parts use age-based depreciation
            depreciation = calculate_metal_depreciation(vehicle_age_years, part_amount)
        elif part_type in FIXED_DEPRECIATION_RATES:
            # Non-metal parts use fixed depreciation rates
            depreciation = calculate_fixed_depreciation(part_type, part_amount)
        else:
            # Unknown part types get no depreciation
            depreciation = 0.0
        
        total_depreciation += depreciation
    
    # -------------------------------------------------
    # Calculate Final Payable
    # -------------------------------------------------
    # Subtract total depreciation and deductible from estimated amount
    final_payable = estimated_amount - total_depreciation - deductible
    
    # Ensure final payable is not negative
    if final_payable < 0:
        final_payable = 0.0
    
    # -------------------------------------------------
    # Return Settlement Result
    # -------------------------------------------------
    return SettlementResult(
        estimated_amount=round(estimated_amount, 2),
        total_depreciation=round(total_depreciation, 2),
        final_payable=round(final_payable, 2)
    )
