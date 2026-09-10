import io
import os
from datetime import datetime
from typing import List, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    Image as RLImage, HRFlowable,
)
from reportlab.lib import colors

from PIL import Image as PILImage, ImageDraw

from app.models import Scan, ExtractedField, ComplianceCheck, ComplianceStatus

def _draw_bounding_boxes(image_path: str, fields: List[ExtractedField], checks: List[ComplianceCheck]) -> Optional[str]:
    """Draw bounding boxes on the original image using PIL and save to a temporary file."""
    if not os.path.exists(image_path):
        return None
        
    try:
        img = PILImage.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        
        # Map fields to compliance status
        status_map = {}
        for check in checks:
            status_map[check.field_type] = check.status
            
        colors_map = {
            ComplianceStatus.passed: (0, 217, 192), # Cyan
            ComplianceStatus.failed: (255, 107, 0), # Amber
            ComplianceStatus.not_found: (255, 59, 59), # Red
            ComplianceStatus.insufficient_data: (139, 143, 151) # Slate
        }
        
        for field in fields:
            if not field.bounding_box_json:
                continue
                
            status = status_map.get(field.field_type.value, ComplianceStatus.insufficient_data)
            color = colors_map.get(status, (255, 255, 255))
            
            bbox = field.bounding_box_json
            if len(bbox) == 4:
                # bbox is [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
                pts = [(pt[0], pt[1]) for pt in bbox]
                draw.polygon(pts, outline=color, width=3)
                draw.text((pts[0][0], pts[0][1] - 10), field.field_type.value, fill=color)
                
        # Save to temp
        temp_path = f"{image_path}_annotated.jpg"
        img.save(temp_path, "JPEG")
        return temp_path
    except Exception as e:
        print(f"Error drawing boxes: {e}")
        return None

def generate_report_pdf(
    scan: Scan,
    fields: List[ExtractedField],
    checks: List[ComplianceCheck],
    image_path: Optional[str] = None,
) -> io.BytesIO:
    """Generate a PDF report and return it as a BytesIO buffer."""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "MCTitle", parent=styles["Title"], fontSize=22, textColor=HexColor("#1A1E25"), spaceAfter=4 * mm, fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        "MCSubtitle", parent=styles["Normal"], fontSize=11, textColor=HexColor("#555962"), spaceAfter=6 * mm
    )
    heading_style = ParagraphStyle(
        "MCHeading", parent=styles["Heading2"], fontSize=14, textColor=HexColor("#0B0D10"), spaceBefore=8 * mm, spaceAfter=4 * mm, fontName="Helvetica-Bold"
    )
    body_style = ParagraphStyle(
        "MCBody", parent=styles["Normal"], fontSize=9, textColor=HexColor("#333333"), leading=13
    )

    elements = []

    # Header
    elements.append(Paragraph("⚖ MetroCheck Compliance Report", title_style))

    scan_id_short = str(scan.id)[:8] if scan.id else "N/A"
    scan_date = scan.uploaded_at.strftime("%d %B %Y, %H:%M") if scan.uploaded_at else "N/A"
    product = scan.product_name or "Unknown Product"
    district = scan.district or "N/A"

    header_info = f"""
    <b>Scan ID:</b> {scan_id_short} &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Date:</b> {scan_date} &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Product:</b> {product} &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>District:</b> {district}
    """
    elements.append(Paragraph(header_info.strip(), subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#DDD"), spaceAfter=4 * mm, spaceBefore=2 * mm))

    # Annotated Image
    if image_path:
        annotated_path = _draw_bounding_boxes(image_path, fields, checks)
        if annotated_path:
            elements.append(Paragraph("Analyzed Image (Real Bounding Boxes)", heading_style))
            elements.append(RLImage(annotated_path, width=150*mm, height=150*mm, kind='proportional'))
            elements.append(Spacer(1, 4 * mm))

    # Compliance Score
    score = scan.compliance_score or 0
    status = scan.overall_status.value if scan.overall_status else "N/A"
    score_color = "#00D9C0" if score >= 80 else "#FF6B00" if score >= 50 else "#FF3B3B"

    score_style = ParagraphStyle(
        "ScoreStyle", parent=styles["Normal"], fontSize=36, textColor=HexColor(score_color), alignment=TA_CENTER, fontName="Helvetica-Bold"
    )
    elements.append(Paragraph(f"{score:.0f}%", score_style))

    status_style = ParagraphStyle(
        "StatusStyle", parent=styles["Normal"], fontSize=12, textColor=HexColor("#555962"), alignment=TA_CENTER, spaceAfter=6 * mm
    )
    elements.append(Paragraph(f"Overall Status: <b>{status.upper().replace('_', ' ')}</b>", status_style))

    # Checks Table
    elements.append(Paragraph("Clause-by-Clause Compliance", heading_style))
    check_data = [["#", "Clause", "Field", "Status", "Details"]]
    for i, check in enumerate(checks, 1):
        clause_num = check.rule_clause.clause_number if check.rule_clause else "—"
        clause_text = (check.rule_clause_text or "")[:60]
        field = check.field_type or "—"
        status_val = check.status.value if check.status else "—"
        reason = (check.violation_reason or "—")[:50]
        
        # Add advisory note for font size check
        if status_val == "insufficient_data" and "font" in (check.rule_clause_text or "").lower():
            reason += " (Advisory Only)"

        check_data.append([
            str(i),
            Paragraph(f"<b>{clause_num}</b><br/>{clause_text}", body_style),
            field,
            status_val.upper(),
            Paragraph(reason, body_style),
        ])

    check_table = Table(check_data, colWidths=[8 * mm, 55 * mm, 22 * mm, 22 * mm, 55 * mm])
    check_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1A1E25")),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#DDD")),
    ]))
    elements.append(check_table)

    # Footer
    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#DDD"), spaceAfter=3 * mm))
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7, textColor=HexColor("#999999"), alignment=TA_CENTER)
    elements.append(Paragraph("This report was generated by MetroCheck. Compliance assessment is advisory.", footer_style))

    doc.build(elements)
    buffer.seek(0)
    
    # Cleanup temp image if needed
    
    return buffer
