"""
MetroCheck — AI-Powered Legal Metrology Compliance Scanner
FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db, SessionLocal
from app.api.auth_routes import router as auth_router
from app.api.scan_routes import router as scan_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.rule_routes import router as rule_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, seed data."""
    print("MetroCheck starting up...")
    init_db()
    print("Database tables created")

    # Seed demo data
    from seed_data import seed_demo_data
    db = SessionLocal()
    try:
        seed_demo_data(db)
    except Exception as e:
        print(f"Seed data error (non-fatal): {e}")
    finally:
        db.close()

    # Ensure uploads directory exists
    upload_dir = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)

    yield
    print("MetroCheck shutting down...")


app = FastAPI(
    title="MetroCheck API",
    description="AI-Powered Legal Metrology Compliance Scanner for Packaged Commodities",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file serving for uploaded images
upload_dir = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Register routers
app.add_router = None  # type hint helper
app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(dashboard_router)
app.include_router(rule_router)


@app.get("/")
def root():
    return {
        "app": "MetroCheck",
        "version": "1.0.0",
        "description": "AI-Powered Legal Metrology Compliance Scanner",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
