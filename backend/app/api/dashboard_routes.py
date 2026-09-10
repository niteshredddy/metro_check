"""Dashboard API routes — aggregate statistics for the enforcement dashboard."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_

from app.database import get_db
from app.models import Scan, ComplianceCheck, ComplianceStatus, OverallStatus, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Aggregate stats for the enforcement dashboard:
    - Total scans, violation rate, average compliance score
    - Violations by field type
    - Scans by district
    - 30-day trend
    """
    # Total scans
    total_scans = db.query(func.count(Scan.id)).scalar() or 0

    # Violation rate (non-compliant scans / total)
    non_compliant = db.query(func.count(Scan.id)).filter(
        Scan.overall_status == OverallStatus.non_compliant
    ).scalar() or 0

    partial = db.query(func.count(Scan.id)).filter(
        Scan.overall_status == OverallStatus.partial
    ).scalar() or 0

    compliant = db.query(func.count(Scan.id)).filter(
        Scan.overall_status == OverallStatus.compliant
    ).scalar() or 0

    violation_rate = round(
        ((non_compliant + partial) / total_scans * 100) if total_scans > 0 else 0, 1
    )

    # Average compliance score
    avg_score = db.query(func.avg(Scan.compliance_score)).scalar()
    avg_score = round(avg_score, 1) if avg_score else 0

    # Violations by field type
    violations_by_field = (
        db.query(
            ComplianceCheck.field_type,
            func.count(ComplianceCheck.id).label("count"),
        )
        .filter(
            ComplianceCheck.status.in_([
                ComplianceStatus.failed,
                ComplianceStatus.not_found,
            ])
        )
        .group_by(ComplianceCheck.field_type)
        .all()
    )

    violations_by_field_dict = [
        {"field_type": v.field_type, "count": v.count}
        for v in violations_by_field
    ]

    # Scans by district
    scans_by_district = (
        db.query(
            Scan.district,
            func.count(Scan.id).label("count"),
        )
        .filter(Scan.district.isnot(None))
        .group_by(Scan.district)
        .order_by(func.count(Scan.id).desc())
        .limit(10)
        .all()
    )

    scans_by_district_list = [
        {"district": s.district, "count": s.count}
        for s in scans_by_district
    ]

    # 30-day trend (scans per day)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_trend = (
        db.query(
            func.date(Scan.uploaded_at).label("date"),
            func.count(Scan.id).label("total"),
            func.count(
                case(
                    (Scan.overall_status == OverallStatus.compliant, 1),
                )
            ).label("compliant"),
            func.count(
                case(
                    (Scan.overall_status == OverallStatus.non_compliant, 1),
                )
            ).label("non_compliant"),
        )
        .filter(Scan.uploaded_at >= thirty_days_ago)
        .group_by(func.date(Scan.uploaded_at))
        .order_by(func.date(Scan.uploaded_at))
        .all()
    )

    trend_list = [
        {
            "date": t.date if t.date else None,
            "total": t.total,
            "compliant": t.compliant,
            "non_compliant": t.non_compliant,
        }
        for t in daily_trend
    ]

    # Status distribution
    status_distribution = [
        {"status": "compliant", "count": compliant},
        {"status": "partial", "count": partial},
        {"status": "non_compliant", "count": non_compliant},
    ]

    return {
        "total_scans": total_scans,
        "violation_rate": violation_rate,
        "avg_compliance_score": avg_score,
        "compliant_count": compliant,
        "non_compliant_count": non_compliant,
        "partial_count": partial,
        "violations_by_field": violations_by_field_dict,
        "scans_by_district": scans_by_district_list,
        "daily_trend": trend_list,
        "status_distribution": status_distribution,
    }
