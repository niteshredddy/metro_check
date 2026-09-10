from typing import Optional
from sqlalchemy.orm import Session

from app.models import Scan, OverallStatus, RuleClause
from app.ocr.preprocess import preprocess_image
from app.ocr.ocr_engine import extract_text_blocks
from app.classification.field_classifier import classify_fields
from app.rules.rule_engine import evaluate, compute_compliance_score

def process_scan(
    scan: Scan,
    image_path: str,
    db: Session,
    package_area_cm2: Optional[float] = None,
) -> dict:
    """
    Full processing pipeline: OpenCV Preprocess → EasyOCR Extract → Field Classify → Rule Evaluate → Persist.
    Returns the complete scan result dict for the API response.
    """
    # Stage 1 & 2: Preprocess and OCR
    preprocessed_img = preprocess_image(image_path)
    text_blocks = extract_text_blocks(preprocessed_img)
    
    # Stage 3: Field Classification
    extracted = classify_fields(text_blocks)
    
    # Persist extracted fields
    db_fields = []
    for field_type_str, field in extracted.items():
        field.scan_id = scan.id
        db.add(field)
        db_fields.append(field)
        
    db.commit()

    # Stage 4: Rule Evaluation
    rules = db.query(RuleClause).all()
    checks = evaluate(
        extracted_fields=extracted,
        rule_clauses=rules,
        scan_id=scan.id,
        package_area_cm2=package_area_cm2
    )
    
    score = compute_compliance_score(checks)
    
    overall_status = OverallStatus.compliant if score == 100.0 else (OverallStatus.non_compliant if score == 0.0 else OverallStatus.partial)

    # Persist compliance checks
    db_checks = []
    for check in checks:
        db.add(check)
        db_checks.append(check)

    # Update scan record
    scan.overall_status = overall_status
    scan.compliance_score = score
    db.commit()

    # Build response
    return {
        "scan_id": str(scan.id),
        "product_name": scan.product_name,
        "uploaded_at": scan.uploaded_at.isoformat() if scan.uploaded_at else None,
        "overall_status": overall_status.value,
        "compliance_score": score,
        "ocr_full_text": "\n".join([b.text for b in text_blocks]),
        "image_dimensions": {
            "width": preprocessed_img.shape[1] if len(preprocessed_img.shape) >= 2 else 0,
            "height": preprocessed_img.shape[0] if len(preprocessed_img.shape) >= 2 else 0,
        },
        "extracted_fields": [
            {
                "id": str(ef.id),
                "field_type": ef.field_type.value,
                "raw_text": ef.raw_text,
                "parsed_value": ef.parsed_value,
                "bounding_box": ef.bounding_box_json,
                "confidence_score": ef.confidence_score,
            }
            for ef in db_fields
        ],
        "compliance_checks": [
            {
                "id": str(cc.id),
                "clause_number": cc.rule_clause.clause_number if cc.rule_clause else "Unknown",
                "rule_clause_text": cc.rule_clause_text,
                "field_type": cc.field_type,
                "status": cc.status.value,
                "violation_reason": cc.violation_reason,
            }
            for cc in db_checks
        ],
    }
