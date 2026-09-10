"""
Seed script — creates demo users, rule clauses, and historical scan data.
Run this on first startup to populate the database for demo readiness.
"""
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    User, UserRole, Scan, ExtractedField, ComplianceCheck,
    FieldType, ComplianceStatus, OverallStatus,
)
from app.auth import hash_password
from app.rules.seed_rules import seed_rules


# ─── Demo users ────────────────────────────────────────────────────────────────

DEMO_USERS = [
    {
        "name": "Rajesh Kumar",
        "email": "officer@metrocheck.gov.in",
        "password": "demo123",
        "role": UserRole.enforcement_officer,
        "district": "Mumbai",
    },
    {
        "name": "Priya Sharma",
        "email": "admin@metrocheck.gov.in",
        "password": "demo123",
        "role": UserRole.admin,
        "district": "Delhi",
    },
]


# ─── Demo scan scenarios ───────────────────────────────────────────────────────

DISTRICTS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"]

DEMO_SCANS = [
    {
        "product_name": "Parle-G Gold Biscuits 200g",
        "district": "Mumbai",
        "overall_status": OverallStatus.compliant,
        "compliance_score": 100.0,
        "fields": {
            "mrp": {"raw_text": "MRP Rs. 30/- (Incl. of all taxes)", "parsed_value": "30"},
            "net_qty": {"raw_text": "Net Weight: 200g", "parsed_value": "200g"},
            "mfg_date": {"raw_text": "Mfg Date: Jan 2024", "parsed_value": "Jan 2024"},
            "manufacturer": {"raw_text": "Mfg by: Parle Products Pvt Ltd, Vile Parle East, Mumbai 400057", "parsed_value": "Parle Products Pvt Ltd, Vile Parle East, Mumbai 400057"},
            "consumer_care": {"raw_text": "Consumer Care: 1800-123-4567, care@parle.com", "parsed_value": "1800-123-4567, care@parle.com"},
        },
    },
    {
        "product_name": "Amul Butter 500g",
        "district": "Delhi",
        "overall_status": OverallStatus.compliant,
        "compliance_score": 93.3,
        "fields": {
            "mrp": {"raw_text": "MRP ₹280 (Inclusive of all taxes)", "parsed_value": "280"},
            "net_qty": {"raw_text": "Net Wt. 500g", "parsed_value": "500g"},
            "mfg_date": {"raw_text": "Packed on: 12/2023", "parsed_value": "12/2023"},
            "manufacturer": {"raw_text": "Gujarat Co-operative Milk Marketing Federation Ltd, Amul Dairy Road, Anand 388001", "parsed_value": "Gujarat Co-operative Milk Marketing Federation Ltd, Anand 388001"},
            "consumer_care": {"raw_text": "Customer care: 1800-258-3333", "parsed_value": "1800-258-3333"},
        },
    },
    {
        "product_name": "Tata Salt 1kg",
        "district": "Bangalore",
        "overall_status": OverallStatus.compliant,
        "compliance_score": 100.0,
        "fields": {
            "mrp": {"raw_text": "M.R.P. Rs. 28/- (Incl. of all taxes)", "parsed_value": "28"},
            "net_qty": {"raw_text": "Net Weight: 1kg", "parsed_value": "1kg"},
            "mfg_date": {"raw_text": "Date of Mfg: Feb 2024", "parsed_value": "Feb 2024"},
            "manufacturer": {"raw_text": "Tata Chemicals Ltd, Mithapur 361345, Gujarat", "parsed_value": "Tata Chemicals Ltd, Mithapur 361345"},
            "consumer_care": {"raw_text": "Consumer Helpline: 1800-209-8787, tatasalt@tata.com", "parsed_value": "1800-209-8787, tatasalt@tata.com"},
        },
    },
    {
        "product_name": "Local Spice Mix 100g",
        "district": "Mumbai",
        "overall_status": OverallStatus.non_compliant,
        "compliance_score": 33.3,
        "fields": {
            "net_qty": {"raw_text": "100 grams", "parsed_value": "100g"},
            "manufacturer": {"raw_text": "XYZ Traders, Mumbai", "parsed_value": "XYZ Traders, Mumbai"},
        },
    },
    {
        "product_name": "Organic Honey 250ml",
        "district": "Chennai",
        "overall_status": OverallStatus.partial,
        "compliance_score": 60.0,
        "fields": {
            "mrp": {"raw_text": "Price 450", "parsed_value": "450"},
            "net_qty": {"raw_text": "250ml", "parsed_value": "250ml"},
            "mfg_date": {"raw_text": "2024", "parsed_value": "2024"},
            "manufacturer": {"raw_text": "Honey Farm Pvt Ltd, Nilgiris, Tamil Nadu 643001", "parsed_value": "Honey Farm Pvt Ltd, Nilgiris 643001"},
        },
    },
    {
        "product_name": "Premium Basmati Rice 5kg",
        "district": "Delhi",
        "overall_status": OverallStatus.partial,
        "compliance_score": 53.3,
        "fields": {
            "mrp": {"raw_text": "MRP Rs.650", "parsed_value": "650"},
            "net_qty": {"raw_text": "5 KG", "parsed_value": "5kg"},
            "manufacturer": {"raw_text": "Daawat Foods Ltd", "parsed_value": "Daawat Foods Ltd"},
        },
    },
    {
        "product_name": "Hand Sanitizer 200ml",
        "district": "Kolkata",
        "overall_status": OverallStatus.non_compliant,
        "compliance_score": 26.7,
        "fields": {
            "mrp": {"raw_text": "₹99", "parsed_value": "99"},
            "net_qty": {"raw_text": "200 ml", "parsed_value": "200ml"},
        },
    },
    {
        "product_name": "Britannia Good Day 150g",
        "district": "Hyderabad",
        "overall_status": OverallStatus.compliant,
        "compliance_score": 93.3,
        "fields": {
            "mrp": {"raw_text": "MRP ₹40 (Incl. of all taxes)", "parsed_value": "40"},
            "net_qty": {"raw_text": "Net Wt: 150g", "parsed_value": "150g"},
            "mfg_date": {"raw_text": "Mfg: Mar 2024", "parsed_value": "Mar 2024"},
            "manufacturer": {"raw_text": "Britannia Industries Ltd, 5/1 Hungerford Street, Kolkata 700017", "parsed_value": "Britannia Industries Ltd, Kolkata 700017"},
            "consumer_care": {"raw_text": "Consumer Care: 1800-425-7788", "parsed_value": "1800-425-7788"},
        },
    },
    {
        "product_name": "Unbranded Turmeric Powder 50g",
        "district": "Pune",
        "overall_status": OverallStatus.non_compliant,
        "compliance_score": 13.3,
        "fields": {
            "net_qty": {"raw_text": "50 gm", "parsed_value": "50g"},
        },
    },
    {
        "product_name": "Haldiram's Namkeen Mixture 400g",
        "district": "Delhi",
        "overall_status": OverallStatus.partial,
        "compliance_score": 66.7,
        "fields": {
            "mrp": {"raw_text": "MRP Rs.120/- (Incl. all taxes)", "parsed_value": "120"},
            "net_qty": {"raw_text": "Net Qty: 400g", "parsed_value": "400g"},
            "mfg_date": {"raw_text": "Best Before: 6 months from Mfg. Mfg Date: Nov 2023", "parsed_value": "Nov 2023"},
            "manufacturer": {"raw_text": "Haldiram's, Nagpur", "parsed_value": "Haldiram's, Nagpur"},
        },
    },
    {
        "product_name": "Dettol Liquid Soap 900ml",
        "district": "Bangalore",
        "overall_status": OverallStatus.partial,
        "compliance_score": 73.3,
        "fields": {
            "mrp": {"raw_text": "M.R.P. ₹249 (Inclusive of all taxes)", "parsed_value": "249"},
            "net_qty": {"raw_text": "900 ml", "parsed_value": "900ml"},
            "mfg_date": {"raw_text": "Mfg: 04/2024", "parsed_value": "04/2024"},
            "manufacturer": {"raw_text": "Reckitt Benckiser India Pvt Ltd, Sector 32, Gurgaon 122001, Haryana", "parsed_value": "Reckitt Benckiser India Pvt Ltd, Gurgaon 122001"},
        },
    },
    {
        "product_name": "Nestle Maggi Noodles 70g",
        "district": "Chennai",
        "overall_status": OverallStatus.compliant,
        "compliance_score": 100.0,
        "fields": {
            "mrp": {"raw_text": "MRP ₹14/- (Incl. of all taxes)", "parsed_value": "14"},
            "net_qty": {"raw_text": "Net Weight: 70g", "parsed_value": "70g"},
            "mfg_date": {"raw_text": "Mfg Date: May 2024", "parsed_value": "May 2024"},
            "manufacturer": {"raw_text": "Nestle India Ltd, M-5A, Connaught Circus, New Delhi 110001", "parsed_value": "Nestle India Ltd, New Delhi 110001"},
            "consumer_care": {"raw_text": "Consumer Services: 1800-103-1947, consumer.services@in.nestle.com", "parsed_value": "1800-103-1947, consumer.services@in.nestle.com"},
        },
    },
]


# ─── Compliance check scenarios for demo scans ────────────────────────────────

def _generate_checks_for_scan(scan_fields: dict, rule_clauses: list) -> list:
    """Generate realistic compliance check results based on which fields are present."""
    checks = []
    for clause in rule_clauses:
        field_type = clause.field_type
        has_field = field_type in scan_fields

        if not has_field:
            status = ComplianceStatus.not_found
            reason = f"Mandatory field '{field_type}' not detected on the label."
        elif clause.validation_type == "field_present":
            status = ComplianceStatus.passed
            reason = None
        elif clause.validation_type == "mrp_format_check":
            raw = scan_fields.get(field_type, {}).get("raw_text", "")
            if "MRP" in raw.upper() or "M.R.P" in raw.upper():
                if "incl" in raw.lower():
                    status = ComplianceStatus.passed
                    reason = None
                else:
                    status = ComplianceStatus.passed
                    reason = "MRP found but 'inclusive of all taxes' note not clearly detected."
            else:
                status = ComplianceStatus.failed
                reason = "MRP keyword not found in expected format."
        elif clause.validation_type == "net_qty_format":
            status = ComplianceStatus.passed
            reason = None
        elif clause.validation_type == "date_format_valid":
            raw = scan_fields.get(field_type, {}).get("parsed_value", "")
            if any(m in raw for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]) or "/" in raw:
                status = ComplianceStatus.passed
                reason = None
            else:
                status = ComplianceStatus.failed
                reason = f"Date '{raw}' does not contain valid month+year format."
        elif clause.validation_type == "consumer_care_check":
            raw = scan_fields.get(field_type, {}).get("raw_text", "")
            if "1800" in raw or "@" in raw:
                status = ComplianceStatus.passed
                reason = None
            else:
                status = ComplianceStatus.failed
                reason = "No valid phone number or email found in consumer care text."
        elif clause.validation_type == "address_completeness":
            raw = scan_fields.get(field_type, {}).get("raw_text", "")
            import re
            if len(raw) >= 15 and re.search(r"\b[1-9]\d{5}\b", raw):
                status = ComplianceStatus.passed
                reason = None
            else:
                status = ComplianceStatus.failed
                reason = "Address is incomplete or missing pincode."
        elif clause.validation_type == "font_size_minimum":
            status = ComplianceStatus.insufficient_data
            reason = "Package area not provided — font size check skipped."
        elif clause.validation_type == "regex_match":
            raw = scan_fields.get(field_type, {}).get("raw_text", "")
            if raw and any(c.isalpha() for c in raw):
                status = ComplianceStatus.passed
                reason = None
            else:
                status = ComplianceStatus.failed
                reason = "Required pattern not found."
        else:
            status = ComplianceStatus.passed
            reason = None

        checks.append({
            "rule_clause_id": clause.id,
            "rule_clause_text": clause.clause_text,
            "field_type": field_type,
            "status": status,
            "violation_reason": reason,
        })

    return checks


def seed_demo_data(db: Session):
    """Seed all demo data — users, rules, and scans."""
    # 1. Seed rule clauses
    seed_rules(db)

    # 2. Check if users already exist
    existing_users = db.query(User).count()
    if existing_users > 0:
        print("Demo data already exists, skipping seed")
        return

    # 3. Create demo users
    users = []
    for user_data in DEMO_USERS:
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            district=user_data["district"],
        )
        db.add(user)
        users.append(user)
    db.commit()
    for u in users:
        db.refresh(u)
    print(f"Created {len(users)} demo users")

    # 4. Load rule clauses for check generation
    from app.models import RuleClause
    rule_clauses = db.query(RuleClause).order_by(RuleClause.id).all()

    # 5. Create demo scans
    now = datetime.utcnow()
    for i, scan_data in enumerate(DEMO_SCANS):
        # Spread scans across last 30 days
        days_ago = random.randint(0, 29)
        hours_ago = random.randint(0, 23)
        scan_time = now - timedelta(days=days_ago, hours=hours_ago)

        # Alternate between users
        user = users[i % len(users)]

        scan = Scan(
            user_id=user.id,
            image_path=f"demo_scan_{i+1}.jpg",
            product_name=scan_data["product_name"],
            uploaded_at=scan_time,
            overall_status=scan_data["overall_status"],
            compliance_score=scan_data["compliance_score"],
            district=scan_data["district"],
            location_lat=round(random.uniform(12.9, 28.7), 4),
            location_lng=round(random.uniform(72.8, 88.4), 4),
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)

        # Add extracted fields
        field_type_map = {
            "mrp": FieldType.mrp,
            "net_qty": FieldType.net_qty,
            "mfg_date": FieldType.mfg_date,
            "manufacturer": FieldType.manufacturer,
            "consumer_care": FieldType.consumer_care,
        }

        for field_type_str, field_data in scan_data.get("fields", {}).items():
            ft_enum = field_type_map.get(field_type_str)
            if not ft_enum:
                continue

            ef = ExtractedField(
                scan_id=scan.id,
                field_type=ft_enum,
                raw_text=field_data["raw_text"],
                parsed_value=field_data["parsed_value"],
                bounding_box_json=[
                    [50, 50], [150, 50], [150, 90], [50, 90]
                ],
                confidence_score=round(random.uniform(75, 98), 1),
            )
            db.add(ef)

        # Generate and add compliance checks
        checks = _generate_checks_for_scan(scan_data.get("fields", {}), rule_clauses)
        for check_data in checks:
            cc = ComplianceCheck(
                scan_id=scan.id,
                **check_data,
            )
            db.add(cc)

        db.commit()

    print(f"Created {len(DEMO_SCANS)} demo scans with compliance checks")
