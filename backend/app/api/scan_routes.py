"""Scan API routes — upload, list, detail, and PDF report."""
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Scan, ExtractedField, ComplianceCheck, User, OverallStatus
from app.auth import get_current_user
from app.pipeline import process_scan
from app.pdf.report_generator import generate_report_pdf

router = APIRouter(prefix="/api/scans", tags=["scans"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("")
async def create_scan(
    image: UploadFile = File(...),
    product_name: Optional[str] = Form(None),
    package_area_cm2: Optional[float] = Form(None),
    district: Optional[str] = Form(None),
    location_lat: Optional[float] = Form(None),
    location_lng: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an image and run the full compliance scanning pipeline."""
    _ensure_upload_dir()

    # Save uploaded file
    file_ext = os.path.splitext(image.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await image.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create scan record
    scan = Scan(
        user_id=current_user.id,
        image_path=filename,
        product_name=product_name,
        district=district or current_user.district,
        location_lat=location_lat,
        location_lng=location_lng,
        package_area_cm2=package_area_cm2,
        uploaded_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Run the full pipeline
    try:
        result = process_scan(scan, file_path, db, package_area_cm2)
    except Exception as e:
        # Update scan with error status
        scan.overall_status = OverallStatus.non_compliant
        scan.compliance_score = 0
        db.commit()
        raise HTTPException(status_code=500, detail=f"Scan processing error: {str(e)}")

    return result


@router.get("")
def list_scans(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List scans with filtering and pagination."""
    query = db.query(Scan)

    # Apply filters
    if status:
        try:
            status_enum = OverallStatus(status)
            query = query.filter(Scan.overall_status == status_enum)
        except ValueError:
            pass

    if district:
        query = query.filter(Scan.district.ilike(f"%{district}%"))

    if product_name:
        query = query.filter(Scan.product_name.ilike(f"%{product_name}%"))

    if search:
        query = query.filter(
            (Scan.product_name.ilike(f"%{search}%")) |
            (Scan.district.ilike(f"%{search}%"))
        )

    if date_from:
        try:
            from_dt = datetime.fromisoformat(date_from)
            query = query.filter(Scan.uploaded_at >= from_dt)
        except ValueError:
            pass

    if date_to:
        try:
            to_dt = datetime.fromisoformat(date_to)
            query = query.filter(Scan.uploaded_at <= to_dt)
        except ValueError:
            pass

    # Count total before pagination
    total = query.count()

    # Paginate
    scans = query.order_by(desc(Scan.uploaded_at)).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "scans": [
            {
                "id": str(s.id),
                "product_name": s.product_name,
                "uploaded_at": s.uploaded_at.isoformat() if s.uploaded_at else None,
                "overall_status": s.overall_status.value if s.overall_status else None,
                "compliance_score": s.compliance_score,
                "district": s.district,
                "image_path": s.image_path,
            }
            for s in scans
        ],
    }


@router.get("/{scan_id}")
def get_scan_detail(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full scan detail including extracted fields and compliance checks."""
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scan ID format")

    scan = db.query(Scan).filter(Scan.id == scan_uuid).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    fields = db.query(ExtractedField).filter(ExtractedField.scan_id == scan.id).all()
    checks = db.query(ComplianceCheck).filter(ComplianceCheck.scan_id == scan.id).all()

    return {
        "id": str(scan.id),
        "user_id": str(scan.user_id),
        "product_name": scan.product_name,
        "uploaded_at": scan.uploaded_at.isoformat() if scan.uploaded_at else None,
        "overall_status": scan.overall_status.value if scan.overall_status else None,
        "compliance_score": scan.compliance_score,
        "district": scan.district,
        "location_lat": scan.location_lat,
        "location_lng": scan.location_lng,
        "package_area_cm2": scan.package_area_cm2,
        "image_path": scan.image_path,
        "extracted_fields": [
            {
                "id": str(f.id),
                "field_type": f.field_type.value,
                "raw_text": f.raw_text,
                "parsed_value": f.parsed_value,
                "bounding_box": f.bounding_box_json,
                "confidence_score": f.confidence_score,
            }
            for f in fields
        ],
        "compliance_checks": [
            {
                "id": str(c.id),
                "clause_number": c.rule_clause.clause_number if c.rule_clause else None,
                "rule_clause_text": c.rule_clause_text,
                "field_type": c.field_type,
                "status": c.status.value if c.status else None,
                "violation_reason": c.violation_reason,
            }
            for c in checks
        ],
    }


@router.get("/{scan_id}/report.pdf")
def get_scan_report_pdf(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and stream a PDF compliance report."""
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scan ID format")

    scan = db.query(Scan).filter(Scan.id == scan_uuid).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    fields = db.query(ExtractedField).filter(ExtractedField.scan_id == scan.id).all()
    checks = db.query(ComplianceCheck).filter(ComplianceCheck.scan_id == scan.id).all()

    # Generate PDF
    image_full_path = os.path.join(UPLOAD_DIR, scan.image_path) if scan.image_path else None
    pdf_buffer = generate_report_pdf(scan, fields, checks, image_full_path)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="metrocheck_report_{scan_id[:8]}.pdf"'
        },
    )
