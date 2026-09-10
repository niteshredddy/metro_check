from typing import List, Dict, Optional
from app.models import RuleClause, ExtractedField, ComplianceCheck, ComplianceStatus
from app.rules import validators

def evaluate(
    extracted_fields: Dict[str, ExtractedField],
    rule_clauses: List[RuleClause],
    scan_id,
    package_area_cm2: Optional[float] = None
) -> List[ComplianceCheck]:
    checks = []
    
    for rule in rule_clauses:
        field_type = rule.field_type
        val_type = rule.validation_type
        params = rule.validation_params_json or {}
        
        status = ComplianceStatus.insufficient_data
        reason = "Required field not extracted from label."
        
        field = extracted_fields.get(field_type)

        if field_type == "manufacturer":
            status, reason = validators.check_manufacturer_address(field, params)
        elif field_type == "net_qty":
            status, reason = validators.check_net_qty(field, params)
        elif field_type == "mfg_date":
            status, reason = validators.check_mfg_date(field, params)
        elif field_type == "mrp":
            status, reason = validators.check_mrp(field, params)
        elif field_type == "consumer_care":
            status, reason = validators.check_consumer_care(field, params)
        elif val_type == "font_size_advisory":
            status, reason = validators.font_size_advisory_check(extracted_fields, package_area_cm2, params)
            
        checks.append(ComplianceCheck(
            scan_id=scan_id,
            rule_clause_id=rule.id,
            rule_clause_text=rule.clause_text,
            field_type=field_type,
            status=status,
            violation_reason=reason
        ))
        
    return checks

def compute_compliance_score(checks: List[ComplianceCheck]) -> float:
    if not checks: return 0.0
    # Exclude advisory checks from score if we want, or count passed/failed.
    scored_checks = [c for c in checks if c.status in [ComplianceStatus.passed, ComplianceStatus.failed, ComplianceStatus.not_found]]
    if not scored_checks: return 0.0
    
    passed_count = sum(1 for c in scored_checks if c.status == ComplianceStatus.passed)
    return (passed_count / len(scored_checks)) * 100.0
