import os
import sys
import subprocess
import time
import uuid
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from sqlalchemy.orm import Session
from app.routers import claim_router
from app.routers import policy_router
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.deps import get_db
from app.models.models import Policy
from app.models.extracted_document import ExtractedDocument
from app.models.document_type import DocumentType

# -------------------------------------------------
# Model Imports for Table Creation
# -------------------------------------------------
# Import all models to ensure they are registered with
# SQLAlchemy's metadata for automatic table creation.
# SettlementLedger provides immutable audit trail for
# claim settlement calculations.
# -------------------------------------------------
from app.models.settlement_ledger import SettlementLedger
from app.models.survey_report import SurveyReport

@asynccontextmanager
async def lifespan(app: FastAPI):
    watcher_proc = None
    da_watcher_proc = None
    _seed_demo_policies()
    try:
        # Startup: Start policy watcher safely
        watcher_path = os.path.join(os.getcwd(), '..', 'policy_watcher.py')
        watcher_proc = subprocess.Popen([sys.executable, watcher_path], shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0)
        print(f"Started policy watcher: {watcher_path} (PID: {watcher_proc.pid})")
        
        # Startup: Start DA watcher safely
        da_watcher_path = os.path.join(os.getcwd(), '..', 'da_watcher.py')
        da_watcher_proc = subprocess.Popen([sys.executable, da_watcher_path], shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0)
        print(f"Started DA watcher: {da_watcher_path} (PID: {da_watcher_proc.pid})")
    except Exception as e:
        print(f"Failed to start watchers: {e}")
    
    yield
    
    # Shutdown: Terminate watchers safely
    if watcher_proc:
        watcher_proc.terminate()
        try:
            watcher_proc.wait(timeout=5)
            print("Terminated policy watcher")
        except subprocess.TimeoutExpired:
            watcher_proc.kill()
            print("Killed policy watcher")
            
    if da_watcher_proc:
        da_watcher_proc.terminate()
        try:
            da_watcher_proc.wait(timeout=5)
            print("Terminated DA watcher")
        except subprocess.TimeoutExpired:
            da_watcher_proc.kill()
            print("Killed DA watcher")


def _run_startup_migrations() -> None:
    """Apply lightweight SQLite migrations (no Alembic).

    NOTE: `Base.metadata.create_all()` does not alter existing tables.
    """
    if engine.dialect.name != "sqlite":
        return

    try:
        with engine.begin() as conn:
            cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(extracted_documents)").fetchall()]
            if "file_path" not in cols:
                conn.exec_driver_sql(
                    "ALTER TABLE extracted_documents ADD COLUMN file_path VARCHAR(500)"
                )

            claim_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(claims)").fetchall()]
            if "rejection_reason" not in claim_cols:
                conn.exec_driver_sql(
                    "ALTER TABLE claims ADD COLUMN rejection_reason VARCHAR(2000)"
                )
    except Exception as e:
        # Keep startup resilient; downstream endpoints will surface issues if migration truly failed.
        print(f"Startup migration warning: {e}")


def _seed_demo_policies() -> None:
    """Ensure demo policies exist in SQLite.

    Inserts missing demo `policy_number` rows while leaving existing policies intact.
    This keeps customer flows (policy lookup, claim filing) usable in local demos.
    """
    if engine.dialect.name != "sqlite":
        return

    db = SessionLocal()
    try:
        existing_numbers = {
            row[0]
            for row in db.query(Policy.policy_number).all()
            if row and row[0]
        }

        now = datetime.now()
        start = now - timedelta(days=365)
        end = now + timedelta(days=365)

        demo_policies = [
            {
                "policy_number": "POL1001",
                "policy_holder_name": "Rajesh Kumar",
                "vehicle_number": "MH01AB1234",
                "vehicle_model": "Honda City",
                "idv_amount": 850000.0,
                "aadhar_number": "123456789012",
                "pan_number": "ABCDE1234F",
                "driving_license_number": "MH01-20190012345",
                "rc_number": "MH01AB1234/2021",
                "chassis_number": "MA3ET6HT9HJ123456",
                "engine_number": "L13JED789012",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False,
            },
            {
                "policy_number": "POL1002",
                "policy_holder_name": "Priya Sharma",
                "vehicle_number": "DL01CD5678",
                "vehicle_model": "Toyota Innova",
                "idv_amount": 1200000.0,
                "aadhar_number": "987654321098",
                "pan_number": "PQRST5678K",
                "driving_license_number": "DL01-20180054321",
                "rc_number": "DL01CD5678/2020",
                "chassis_number": "WVWZZZ3CZ8E000001",
                "engine_number": "2TR5DYE234567",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True,
            },
            {
                "policy_number": "POL1003",
                "policy_holder_name": "Amit Patel",
                "vehicle_number": "GJ01EF9012",
                "vehicle_model": "Maruti Swift",
                "idv_amount": 550000.0,
                "aadhar_number": "456789123456",
                "pan_number": "GHIJK9012M",
                "driving_license_number": "GJ01-20190098765",
                "rc_number": "GJ01EF9012/2019",
                "chassis_number": "MAT12345ET678901",
                "engine_number": "K12M5678901",
                "policy_type": "THIRD_PARTY",
                "has_zero_depreciation": False,
            },
            {
                "policy_number": "POL1004",
                "policy_holder_name": "Sneha Reddy",
                "vehicle_number": "KA01GH3456",
                "vehicle_model": "Hyundai Creta",
                "idv_amount": 950000.0,
                "aadhar_number": "321654987012",
                "pan_number": "LMNOP3456N",
                "driving_license_number": "KA01-20170123456",
                "rc_number": "KA01GH3456/2018",
                "chassis_number": "MAT12345JH678901",
                "engine_number": "G4LA234567",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False,
            },
            {
                "policy_number": "POL1005",
                "policy_holder_name": "Vikram Singh",
                "vehicle_number": "TN01IJ7890",
                "vehicle_model": "Kia Seltos",
                "idv_amount": 1100000.0,
                "aadhar_number": "654321789012",
                "pan_number": "QRSTU7890P",
                "driving_license_number": "TN01-20180123456",
                "rc_number": "TN01IJ7890/2020",
                "chassis_number": "SKAF3A4901H003546",
                "engine_number": "TQN12345678",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True,
            },
            {
                "policy_number": "POL-2024-001",
                "policy_holder_name": "John Smith",
                "vehicle_number": "MH01AB1234",
                "vehicle_model": "Toyota Innova Crysta",
                "idv_amount": 500000.0,
                "aadhar_number": "1234 5678 9012",
                "pan_number": "ABCDE1234F",
                "driving_license_number": "MH01-2020-123456",
                "rc_number": "MH01-2020-123456",
                "chassis_number": "MA3EN6HT0HJ123456",
                "engine_number": "2TR2DYE567890",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False,
            },
            {
                "policy_number": "POL-2024-002",
                "policy_holder_name": "Jane Doe",
                "vehicle_number": "DL01CD5678",
                "vehicle_model": "Honda City",
                "idv_amount": 750000.0,
                "aadhar_number": "9876 5432 1098",
                "pan_number": "FGHIJ5678K",
                "driving_license_number": "DL01-2021-234567",
                "rc_number": "DL01-2021-234567",
                "chassis_number": "MA3ET6HT1HJ234567",
                "engine_number": "L13JED890123",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True,
            },
            {
                "policy_number": "POL-2024-003",
                "policy_holder_name": "Robert Johnson",
                "vehicle_number": "KA01EF9012",
                "vehicle_model": "Hyundai Creta",
                "idv_amount": 350000.0,
                "aadhar_number": "4567 8901 2345",
                "pan_number": "KLMNO9012P",
                "driving_license_number": "KA01-2019-345678",
                "rc_number": "KA01-2019-345678",
                "chassis_number": "MAT12345JH345678",
                "engine_number": "G4LA345678",
                "policy_type": "THIRD_PARTY",
                "has_zero_depreciation": False,
            },
            {
                "policy_number": "POL-2024-004",
                "policy_holder_name": "Maria Garcia",
                "vehicle_number": "TN01GH3456",
                "vehicle_model": "BMW 3 Series",
                "idv_amount": 1200000.0,
                "aadhar_number": "1357 2468 9012",
                "pan_number": "PQRST3456U",
                "driving_license_number": "TN01-2022-456789",
                "rc_number": "TN01-2022-456789",
                "chassis_number": "WBADT43452G296260",
                "engine_number": "N47D20A456789",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": True,
            },
            {
                "policy_number": "POL-2024-005",
                "policy_holder_name": "David Wilson",
                "vehicle_number": "MH02IJ7890",
                "vehicle_model": "Maruti Swift",
                "idv_amount": 450000.0,
                "aadhar_number": "8642 9753 1086",
                "pan_number": "UVWXY7890Z",
                "driving_license_number": "MH02-2020-567890",
                "rc_number": "MH02-2020-567890",
                "chassis_number": "MAT12345ET567890",
                "engine_number": "K12M5234567",
                "policy_type": "COMPREHENSIVE",
                "has_zero_depreciation": False,
            },
        ]

        inserted = 0
        for payload in demo_policies:
            policy_number = payload.get("policy_number")
            if not policy_number or policy_number in existing_numbers:
                continue

            db.add(
                Policy(
                    policy_number=policy_number,
                    policy_holder_name=payload["policy_holder_name"],
                    vehicle_number=payload["vehicle_number"],
                    vehicle_model=payload.get("vehicle_model"),
                    policy_start_date=start,
                    policy_end_date=end,
                    is_active=True,
                    idv_amount=float(payload["idv_amount"]),
                    aadhar_number=payload.get("aadhar_number"),
                    pan_number=payload.get("pan_number"),
                    driving_license_number=payload.get("driving_license_number"),
                    rc_number=payload.get("rc_number"),
                    # Avoid unique-field collisions with existing local data.
                    chassis_number=None,
                    engine_number=None,
                    policy_type=payload.get("policy_type") or "COMPREHENSIVE",
                    has_zero_depreciation=bool(payload.get("has_zero_depreciation", False)),
                )
            )
            inserted += 1

        if inserted > 0:
            db.commit()
            print(f"Seeded {inserted} demo policies (SQLite)")
    except Exception as e:
        db.rollback()
        print(f"Demo policy seed warning: {e}")
    finally:
        db.close()

# Create tables automatically (before app)
Base.metadata.create_all(bind=engine)
_run_startup_migrations()

# App creation at end
app = FastAPI(lifespan=lifespan)

# -------------------------------------------------
# CORS Middleware Configuration
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Create DA Architecture Folders
# -------------------------------------------------
BASE_OPS_DIR = r"D:\Nexclaim_operations"
DA_INPUT_DIR = os.path.join(BASE_OPS_DIR, "DA_Input")
DA_SUCCESS_DIR = os.path.join(BASE_OPS_DIR, "DA_Success")
DA_ARCHIVE_DIR = os.path.join(BASE_OPS_DIR, "DA_Archive")

os.makedirs(BASE_OPS_DIR, exist_ok=True)
os.makedirs(DA_INPUT_DIR, exist_ok=True)
os.makedirs(DA_SUCCESS_DIR, exist_ok=True)
os.makedirs(DA_ARCHIVE_DIR, exist_ok=True)

# -------------------------------------------------
# Serve uploaded files from Inbound directory
# -------------------------------------------------
app.mount("/documents", StaticFiles(directory=BASE_OPS_DIR), name="documents")

# Include claim routes
app.include_router(claim_router.router)

# Include policy routes - GET /policies/ available
app.include_router(policy_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# -------------------------------------------------
# File Upload Endpoint
# -------------------------------------------------
@app.post("/upload/{claim_id}")
def upload_file(
    claim_id: int,
    files: List[UploadFile] = File(...),
    document_type: str = Query(default="INVOICE"),
    db: Session = Depends(get_db)
):
    import shutil
    """
    Upload one or more document files for a claim.
    Each file is saved inside D:\\Nexclaim_operations\\CLAIM_{claim_id}\\.
    If document_type is REPAIR_ESTIMATE, a copy is routed to DA_Input.
    """
    safe_type = "".join(c for c in document_type if c.isalnum() or c == "_")
    saved_files = []

    # Create customer specific folder inside D:\\Nexclaim_operations
    claim_folder = os.path.join(BASE_OPS_DIR, f"CLAIM_{claim_id}")
    os.makedirs(claim_folder, exist_ok=True)

    for file in files:
        # Reset file pointer to ensure full content is read
        file.file.seek(0)
        unique_id = uuid.uuid4().hex[:8]
        # Ensure original file extension is maintained
        ext = os.path.splitext(file.filename)[1]
        if not ext:
            ext = ".pdf"
            
        file_name = f"CLAIM_{claim_id}_{safe_type}_{unique_id}{ext}"
        file_path = os.path.join(claim_folder, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # If Repair Invoice, route a copy to DA_Input
        if document_type.upper() == "REPAIR_ESTIMATE":
            da_input_path = os.path.join(DA_INPUT_DIR, file_name)
            shutil.copy2(file_path, da_input_path)

        # Construct safe relative path to send to frontend
        # The frontend uses this to make GET requests to /documents/...
        frontend_file_path = f"/documents/CLAIM_{claim_id}/{file_name}"
        saved_files.append({"file_name": file_name, "file_path": frontend_file_path})

        # Register document in the database instantly
        try:
            doc_enum = DocumentType(document_type.upper())
        except ValueError:
            doc_enum = DocumentType.INVOICE
        
        db_doc = ExtractedDocument(
            claim_id=claim_id, 
            document_type=doc_enum,
            file_path=frontend_file_path
        )
        # Give it a baseline extraction timestamp since it's uploaded
        db_doc.extracted_at = datetime.utcnow()
        db.add(db_doc)
        db.commit()

    # Cooldown: ensure Windows completes the write before downstream RPA bot picks up the file
    time.sleep(2)

    return {
        "message": f"{len(saved_files)} file(s) uploaded successfully",
        "files": saved_files
    }

