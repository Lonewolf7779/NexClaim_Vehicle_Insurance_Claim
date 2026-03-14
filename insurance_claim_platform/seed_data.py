
"""
Seed Script for Insurance Claim Platform
Run this script to create sample policies for testing
"""
from datetime import datetime, timedelta
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.models import Policy, Claim
from app.models.claim_status import ClaimStatus

def create_seed_data():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_policies = db.query(Policy).count()
        if existing_policies > 0:
            print(f"Database already has {existing_policies} policies. Skipping seed.")
            return
        
        # Create sample policies
        policies = [
            Policy(
                policy_number="POL-2024-001",
                policy_holder_name="John Smith",
                vehicle_number="MH01AB1234",
                vehicle_model="Toyota Innova Crysta",
                policy_start_date=datetime.now() - timedelta(days=180),
                policy_end_date=datetime.now() + timedelta(days=185),
                is_active=True,
                idv_amount=500000.00,
                aadhar_number="1234 5678 9012",
                pan_number="ABCDE1234F",
                driving_license_number="MH01-2020-123456",
                rc_number="MH01-2020-123456"
            ),
            Policy(
                policy_number="POL-2024-002",
                policy_holder_name="Jane Doe",
                vehicle_number="DL01CD5678",
                vehicle_model="Honda City",
                policy_start_date=datetime.now() - timedelta(days=90),
                policy_end_date=datetime.now() + timedelta(days=275),
                is_active=True,
                idv_amount=750000.00,
                aadhar_number="9876 5432 1098",
                pan_number="FGHIJ5678K",
                driving_license_number="DL01-2021-234567",
                rc_number="DL01-2021-234567"
            ),
            Policy(
                policy_number="POL-2024-003",
                policy_holder_name="Robert Johnson",
                vehicle_number="KA01EF9012",
                vehicle_model="Hyundai Creta",
                policy_start_date=datetime.now() - timedelta(days=365),
                policy_end_date=datetime.now(),
                is_active=True,
                idv_amount=350000.00,
                aadhar_number="4567 8901 2345",
                pan_number="KLMNO9012P",
                driving_license_number="KA01-2019-345678",
                rc_number="KA01-2019-345678"
            ),
            Policy(
                policy_number="POL-2024-004",
                policy_holder_name="Maria Garcia",
                vehicle_number="TN01GH3456",
                vehicle_model="BMW 3 Series",
                policy_start_date=datetime.now() - timedelta(days=60),
                policy_end_date=datetime.now() + timedelta(days=305),
                is_active=True,
                idv_amount=1200000.00,
                aadhar_number="1357 2468 9012",
                pan_number="PQRST3456U",
                driving_license_number="TN01-2022-456789",
                rc_number="TN01-2022-456789"
            ),
            Policy(
                policy_number="POL-2024-005",
                policy_holder_name="David Wilson",
                vehicle_number="MH02IJ7890",
                vehicle_model="Maruti Swift",
                policy_start_date=datetime.now() - timedelta(days=200),
                policy_end_date=datetime.now() + timedelta(days=165),
                is_active=True,
                idv_amount=450000.00,
                aadhar_number="8642 9753 1086",
                pan_number="UVWXY7890Z",
                driving_license_number="MH02-2020-567890",
                rc_number="MH02-2020-567890"
            ),
        ]
        
        db.add_all(policies)
        db.commit()
        
        print("Successfully created 5 sample policies!")
        print("\nTest Credentials:")
        print("-" * 50)
        for p in policies:
            print(f"Policy Number: {p.policy_number}")
            print(f"Vehicle Number: {p.vehicle_number}")
            print(f"Holder Name: {p.policy_holder_name}")
            print(f"IDV Amount: Rs{p.idv_amount:,.2f}")
            print("-" * 50)
        
    except Exception as e:
        print(f"Error creating seed data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_seed_data()

