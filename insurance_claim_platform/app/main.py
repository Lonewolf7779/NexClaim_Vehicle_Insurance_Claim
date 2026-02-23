from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import claim_router
from app.routers import policy_router
from app.db.base import Base
from app.db.session import engine

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
# frontend running on a different origin (http://localhost:3000) to
# communicate with this FastAPI backend (http://localhost:8000).
#
# Browsers enforce same-origin policy by default, blocking requests
# from different ports, protocols, or domains. CORS headers tell
# the browser to permit these cross-origin requests.
#
# CONFIGURATION USED:
# - allow_origins: ["http://localhost:3000"] - Restricted to React dev server
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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables automatically
Base.metadata.create_all(bind=engine)

# Include claim routes
app.include_router(claim_router.router)

# Include policy routes
app.include_router(policy_router.router)



@app.get("/health")
def health_check():
    return {"status": "ok"}
