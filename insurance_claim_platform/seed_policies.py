#!/usr/bin/env python3
"""
Seed Script for NexClaim Insurance Platform
Inserts sample policies for demo purposes
"""

from datetime import datetime
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Policy, Base

# Database URL
DATABASE_URL = "sqlite:///./nexclaim.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_policies():
    """Insert sample policies into the database"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = SessionLocal()
    
    try:
        # Check if policies already exist
        existing = session.query(Policy).count()
        if existing > 0:
            print("Found " + str(existing) + " existing policies. Skipping seed.")
            return
        
        # Sample policies data
        policies = [
            {
                "policy_number": "POL1001",
                "policy_holder_name": "Rajesh Kumar",
                "vehicle_number": "MH01AB1234",
                "vehicle_model": "Honda City",
                "policy_start_date": datetime(2024, 1, 1),
                "policy_end_date": datetime(2025, 12, 31),
                "idv_amount": 850000,
                "is_active": True,
                "aadhar_number": "123456789012",
                "pan_number": "ABCDE1234F",
                "driving_license_number": "MH01-20190012345",
                "rc_number": "MH01AB1234/2021",
                "chassis_number": "MA3ET6HT9HJ123456",
                "engine_number": "L13JED789012",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False
            },
            {
                "policy_number": "POL1002",
                "policy_holder_name": "Priya Sharma",
                "vehicle_number": "DL01CD5678",
                "vehicle_model": "Toyota Innova",
                "policy_start_date": datetime(2024, 3, 15),
                "policy_end_date": datetime(2025, 3, 14),
                "idv_amount": 1200000,
                "is_active": True,
                "aadhar_number": "987654321098",
                "pan_number": "PQRST5678K",
                "driving_license_number": "DL01-20180054321",
                "rc_number": "DL01CD5678/2020",
                "chassis_number": "WVWZZZ3CZ8E000001",
                "engine_number": "2TR5DYE234567",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True
            },
            {
                "policy_number": "POL1003",
                "policy_holder_name": "Amit Patel",
                "vehicle_number": "GJ01EF9012",
                "vehicle_model": "Maruti Swift",
                "policy_start_date": datetime(2024, 6, 1),
                "policy_end_date": datetime(2025, 5, 31),
                "idv_amount": 550000,
                "is_active": True,
                "aadhar_number": "456789123456",
                "pan_number": "GHIJK9012M",
                "driving_license_number": "GJ01-20190098765",
                "rc_number": "GJ01EF9012/2019",
                "chassis_number": "MAT12345ET678901",
                "engine_number": "K12M5678901",
                "policy_type": "THIRD_PARTY",
                "has_zero_depreciation": False
            },
            {
                "policy_number": "POL1004",
                "policy_holder_name": "Sneha Reddy",
                "vehicle_number": "KA01GH3456",
                "vehicle_model": "Hyundai Creta",
                "policy_start_date": datetime(2024, 2, 10),
                "policy_end_date": datetime(2025, 2, 9),
                "idv_amount": 950000,
                "is_active": True,
                "aadhar_number": "321654987012",
                "pan_number": "LMNOP3456N",
                "driving_license_number": "KA01-20170123456",
                "rc_number": "KA01GH3456/2018",
                "chassis_number": "MAT12345JH678901",
                "engine_number": "G4LA234567",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False
            },
            {
                "policy_number": "POL1005",
                "policy_holder_name": "Vikram Singh",
                "vehicle_number": "TN01IJ7890",
                "vehicle_model": "Kia Seltos",
                "policy_start_date": datetime(2024, 4, 20),
                "policy_end_date": datetime(2025, 4, 19),
                "idv_amount": 1100000,
                "is_active": True,
                "aadhar_number": "654321789012",
                "pan_number": "QRSTU7890P",
                "driving_license_number": "TN01-20180123456",
                "rc_number": "TN01IJ7890/2020",
                "chassis_number": "SKAF3A4901H003546",
                "engine_number": "TQN12345678",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True
            },
        ]
        
        # Insert policies
        for policy_data in policies:
            policy = Policy(**policy_data)
            session.add(policy)
        
        session.commit()
        print("Successfully seeded " + str(len(policies)) + " policies!")
        
        # Display seeded policies
        print("\nSeeded Policies:")
        print("-" * 80)
        all_policies = session.query(Policy).all()
        for p in all_policies:
            print("  " + str(p.policy_number) + ": " + str(p.policy_holder_name) + " - " + str(p.vehicle_number) + " (" + str(p.vehicle_model) + ")")
        
    except Exception as e:
        session.rollback()
        print("Error seeding policies: " + str(e))
    finally:
        session.close()


if __name__ == "__main__":
    seed_policies()

