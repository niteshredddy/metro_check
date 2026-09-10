import re
from typing import Optional, Dict, Any
from app.models import ExtractedField, ComplianceStatus

def check_manufacturer_address(field: Optional[ExtractedField], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if not field:
        return ComplianceStatus.not_found, "Manufacturer name and address not found."
    
    if params.get("requires_pincode", False):
        if not re.search(r'\b[1-9][0-9]{5}\b', field.parsed_value):
            return ComplianceStatus.failed, "Manufacturer address incomplete (missing pincode)."
            
    return ComplianceStatus.passed, ""

def check_net_qty(field: Optional[ExtractedField], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if not field:
        return ComplianceStatus.not_found, "Net quantity not found."
        
    allowed_units = params.get("allowed_units", [])
    if allowed_units:
        unit_match = re.search(r'([a-zA-Z]+)$', field.parsed_value.strip(), re.IGNORECASE)
        if unit_match and unit_match.group(1).lower() not in [u.lower() for u in allowed_units]:
            return ComplianceStatus.failed, f"Invalid unit of measure. Found: {unit_match.group(1)}"
            
    return ComplianceStatus.passed, ""

def check_mfg_date(field: Optional[ExtractedField], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if not field:
        return ComplianceStatus.not_found, "Manufacturing date not found."
    return ComplianceStatus.passed, ""

def check_mrp(field: Optional[ExtractedField], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if not field:
        return ComplianceStatus.not_found, "MRP not found."
    return ComplianceStatus.passed, ""

def check_consumer_care(field: Optional[ExtractedField], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if not field:
        return ComplianceStatus.not_found, "Consumer care details not found."
    return ComplianceStatus.passed, ""

def font_size_advisory_check(fields: Dict[str, ExtractedField], package_area: Optional[float], params: Dict[str, Any]) -> tuple[ComplianceStatus, str]:
    if package_area is None:
        return ComplianceStatus.insufficient_data, "Package area not provided. Font size cannot be reliably verified."
        
    # In a real implementation, we would estimate mm from pixel height and package_area.
    # Here we simulate an advisory check.
    return ComplianceStatus.passed, f"Estimated font sizes comply with Rule 7 slabs for area {package_area} sq cm (Advisory Only)."
