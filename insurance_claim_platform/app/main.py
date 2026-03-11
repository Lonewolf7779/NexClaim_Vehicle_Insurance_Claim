import os
import time

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



app = FastAPI()

# -------------------------------------------------
# CORS Middleware Configuration
# -------------------------------------------------
# CORS (Cross-Origin Resource Sharing) is required to allow the React
# frontend running on a different origin (http://localhost:3000 or http://localhost:3001) to
# communicate with this FastAPI backend (http://localhost:8000).
#
# Browsers enforce same-origin policy by default, blocking requests
# from different ports, protocols, or domains. CORS headers tell
# the browser to permit these cross-origin requests.
#
# CONFIGURATION USED:
# - allow_origins: ["http://localhost:3000", "http://localhost:3001"] - Restricted to React dev servers
# - allow_credentials: True - Allows cookies/auth headers in requests
# - allow_methods: ["*"] - Permits all HTTP methods (GET, POST, PATCH, etc.)
# - allow_headers: ["*"] - Permits all request headers
#
# NOTE: This configuration is for DEVELOPMENT ENVIRONMENT ONLY.
# Production deployments should specify exact origins and limit
# methods/headers to only those required for security.
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

# Create tables automatically
Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# Serve uploaded files from Inbound directory
# -------------------------------------------------
app.mount("/rpa-data/Inbound", StaticFiles(directory=INBOUND_DIR), name="inbound-files")

# Include claim routes
app.include_router(claim_router.router)

# Include policy routes
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

    for idx, file in enumerate(files):
        # Reset file pointer to ensure full content is read
        file.file.seek(0)
        if len(files) == 1:
            file_name = f"ClaimID_{claim_id}_{safe_type}.pdf"
        else:
            file_name = f"ClaimID_{claim_id}_{safe_type}_{idx + 1}.pdf"
        file_path = os.path.join(INBOUND_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        saved_files.append({"file_name": file_name, "file_path": file_path})

        # Register document in the database instantly
        try:
            doc_enum = DocumentType(document_type.upper())
        except ValueError:
            doc_enum = DocumentType.INVOICE
        
        db_doc = ExtractedDocument(claim_id=claim_id, document_type=doc_enum)
        db.add(db_doc)
        db.commit()

    # Cooldown: ensure Windows completes the write before
    # any downstream RPA bot picks up the file
    time.sleep(2)

    return {
        "message": f"{len(saved_files)} file(s) uploaded successfully",
        "files": saved_files
    }
