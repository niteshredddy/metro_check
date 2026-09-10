import pytest
from app.ocr.ocr_engine import TextBlock
from app.classification.field_classifier import (
    classify_mrp, classify_net_quantity, classify_mfg_date,
    classify_consumer_care, classify_manufacturer_address, classify_fields
)
from app.models import FieldType

def create_block(text: str, bbox: list = None, confidence: float = 0.9) -> TextBlock:
    if bbox is None:
        bbox = [[0,0], [10,0], [10,10], [0,10]]
    return TextBlock(text=text, bbox=bbox, confidence=confidence)

def test_classify_mrp_inline():
    blocks = [create_block("Some text"), create_block("M.R.P. Rs. 150.00"), create_block("Other text")]
    field = classify_mrp(blocks)
    assert field is not None
    assert field.field_type == FieldType.mrp
    assert "150.00" in field.parsed_value

def test_classify_mrp_proximate():
    blocks = [
        create_block("M.R.P.", bbox=[[0,0], [10,0], [10,10], [0,10]]),
        create_block("150.00", bbox=[[12,0], [22,0], [22,10], [12,10]]),
    ]
    field = classify_mrp(blocks)
    assert field is not None
    assert "150.00" in field.parsed_value

def test_classify_net_qty():
    blocks = [create_block("NET QTY : 500 g")]
    field = classify_net_quantity(blocks)
    assert field is not None
    assert "500 g" in field.parsed_value

def test_classify_mfg_date():
    blocks = [create_block("MFG DATE 12/10/2023")]
    field = classify_mfg_date(blocks)
    assert field is not None
    assert "12/10/2023" in field.parsed_value

def test_classify_consumer_care():
    blocks = [create_block("For feedback contact 1800-123-4567")]
    field = classify_consumer_care(blocks)
    assert field is not None
    assert "1800-123-4567" in field.parsed_value

def test_classify_address():
    blocks = [
        create_block("Manufactured by ACME Corp", bbox=[[0,0],[100,0],[100,20],[0,20]]),
        create_block("123 Main St, New Delhi 110001", bbox=[[0,25],[100,25],[100,45],[0,45]])
    ]
    field = classify_manufacturer_address(blocks)
    assert field is not None
    assert "110001" in field.raw_text
