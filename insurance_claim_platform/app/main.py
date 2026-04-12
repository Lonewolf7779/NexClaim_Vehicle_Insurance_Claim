import os
import sys
import subprocess
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from sqlalchemy.orm import Session
from app.routers import claim_router
from app.routers import policy_router
from app.db.base import Base
from app.db.session import engine
from app.db.deps import get_db
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
    try:
        # Startup: Start policy watcher safely
        watcher_path = os.path.join(os.getcwd(), '..', 'policy_watcher.py')
        watcher_proc = subprocess.Popen([sys.executable, watcher_path], shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0)
        print(f"Started policy watcher: {watcher_path} (PID: {watcher_proc.pid})")
    except Exception as e:
        print(f"Failed to start watcher: {e}")
    
    yield
    
    # Shutdown: Terminate watcher safely
    if watcher_proc:
        watcher_proc.terminate()
        try:
            watcher_proc.wait(timeout=5)
            print("Terminated policy watcher")
        except subprocess.TimeoutExpired:
            watcher_proc.kill()
            print("Killed policy watcher")


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
    except Exception as e:
        # Keep startup resilient; downstream endpoints will surface issues if migration truly failed.
        print(f"Startup migration warning: {e}")

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
# Create Inbound Directory for RPA File Drops
# -------------------------------------------------
INBOUND_DIR = r"D:\NexClaim_RPA\Inbound"
os.makedirs(INBOUND_DIR, exist_ok=True)

# -------------------------------------------------
# Serve uploaded files from Inbound directory
# -------------------------------------------------
app.mount("/rpa-data/Inbound", StaticFiles(directory=INBOUND_DIR), name="inbound-files")

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
    """
    Upload one or more document files for a claim.
    Each file is saved as ClaimID_{id}_{document_type}.pdf
    in the NexClaim_RPA Inbound directory.
    """
    safe_type = "".join(c for c in document_type if c.isalnum() or c == "_")
    saved_files = []

    for file in files:
        # Reset file pointer to ensure full content is read
        file.file.seek(0)
        unique_id = uuid.uuid4().hex
        file_name = f"{unique_id}_{safe_type}.pdf"
        file_path = os.path.join(INBOUND_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        # Construct safe relative path to send to frontend
        # The frontend uses this to make GET requests to /rpa-data/Inbound/...
        frontend_file_path = f"/rpa-data/Inbound/{file_name}"
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
        db.add(db_doc)
        db.commit()

    # Cooldown: ensure Windows completes the write before
    # any downstream RPA bot picks up the file
    time.sleep(2)

    return {
        "message": f"{len(saved_files)} file(s) uploaded successfully",
        "files": saved_files
    }

