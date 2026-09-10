import re
from typing import List, Dict, Optional
from app.models import FieldType, ExtractedField
from app.ocr.ocr_engine import TextBlock
import json

def _calculate_distance(box1, box2):
    c1_x = sum([p[0] for p in box1]) / 4
    c1_y = sum([p[1] for p in box1]) / 4
    c2_x = sum([p[0] for p in box2]) / 4
    c2_y = sum([p[1] for p in box2]) / 4
    return ((c1_x - c2_x)**2 + (c1_y - c2_y)**2)**0.5

def _find_closest_block(anchor_block: TextBlock, candidates: List[TextBlock], max_distance: float = 300.0) -> Optional[TextBlock]:
    closest = None
    min_dist = float('inf')
    for candidate in candidates:
        if candidate == anchor_block:
            continue
        dist = _calculate_distance(anchor_block.bbox, candidate.bbox)
        if dist < min_dist and dist < max_distance:
            a_center_y = sum([p[1] for p in anchor_block.bbox]) / 4
            c_center_y = sum([p[1] for p in candidate.bbox]) / 4
            if c_center_y >= a_center_y - 40: # Allow vertical variation
                min_dist = dist
                closest = candidate
    return closest

def classify_mrp(text_blocks: List[TextBlock]) -> Optional[ExtractedField]:
    mrp_regex = re.compile(r'(?:M\.?R\.?P\.?|MAX\w*\s*RETAIL\s*PRICE|PRICE)(?:\s*(?:RS|Rs\.?|₹|INR))?\s*[:=]?\s*(?:RS|Rs\.?|₹|INR)?\s*([0-9.,]+)', re.IGNORECASE)
    mrp_anchor_regex = re.compile(r'(?:M\.?R\.?P|RETAIL\s*PRICE|PRICE)', re.IGNORECASE)
    
    for block in text_blocks:
        match = mrp_regex.search(block.text)
        if match:
            return ExtractedField(
                field_type=FieldType.mrp, raw_text=block.text, parsed_value=match.group(1),
                bounding_box_json=block.bbox, confidence_score=block.confidence
            )
            
    for block in text_blocks:
        if mrp_anchor_regex.search(block.text):
            closest = _find_closest_block(block, text_blocks)
            if closest:
                val_match = re.search(r'([0-9.,]+)', closest.text)
                if val_match:
                    return ExtractedField(
                        field_type=FieldType.mrp, raw_text=f"{block.text} {closest.text}",
                        parsed_value=val_match.group(1), bounding_box_json=closest.bbox,
                        confidence_score=min(block.confidence, closest.confidence)
                    )
    return None

def classify_net_quantity(text_blocks: List[TextBlock]) -> Optional[ExtractedField]:
    qty_regex = re.compile(r'(?:NET\s*(?:QTY|QUANTITY|WT\.?|WEIGHT|VOL\.?|VOLUME)?)?\s*[:=]?\s*([0-9.]+\s*(?:g|kg|ml|l|mg|pcs|units))', re.IGNORECASE)
    qty_anchor_regex = re.compile(r'(?:NET\s*(?:QTY|QUANTITY|WT|WEIGHT)|WEIGHT|VOLUME)', re.IGNORECASE)
    
    for block in text_blocks:
        match = qty_regex.search(block.text)
        if match:
            return ExtractedField(
                field_type=FieldType.net_qty, raw_text=block.text, parsed_value=match.group(1),
                bounding_box_json=block.bbox, confidence_score=block.confidence
            )
            
    for block in text_blocks:
        if qty_anchor_regex.search(block.text):
            closest = _find_closest_block(block, text_blocks)
            if closest:
                val_match = re.search(r'([0-9.]+\s*(?:g|kg|ml|l|mg|pcs|units))', closest.text, re.IGNORECASE)
                if val_match:
                    return ExtractedField(
                        field_type=FieldType.net_qty, raw_text=f"{block.text} {closest.text}",
                        parsed_value=val_match.group(1), bounding_box_json=closest.bbox,
                        confidence_score=min(block.confidence, closest.confidence)
                    )
    return None

def classify_mfg_date(text_blocks: List[TextBlock]) -> Optional[ExtractedField]:
    date_regex = re.compile(r'(?:MFG|PKD|PACKED|MANUFACTURED|DATE\s*OF\s*MANUFACTURE)[.\s]*?(?:DATE)?\s*[:=]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Z]{3,4}\s*[0-9]{2,4}|[0-9]{1,2}[./-][0-9]{2,4})', re.IGNORECASE)
    date_anchor_regex = re.compile(r'(?:MFG|PKD|PACKED|DATE\s*OF\s*MANUFACTURE)', re.IGNORECASE)
    
    for block in text_blocks:
        match = date_regex.search(block.text)
        if match:
            return ExtractedField(
                field_type=FieldType.mfg_date, raw_text=block.text, parsed_value=match.group(1),
                bounding_box_json=block.bbox, confidence_score=block.confidence
            )
            
    for block in text_blocks:
        if date_anchor_regex.search(block.text):
            closest = _find_closest_block(block, text_blocks)
            if closest:
                val_match = re.search(r'([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Z]{3,4}\s*[0-9]{2,4}|[0-9]{1,2}[./-][0-9]{2,4})', closest.text, re.IGNORECASE)
                if val_match:
                    return ExtractedField(
                        field_type=FieldType.mfg_date, raw_text=f"{block.text} {closest.text}",
                        parsed_value=val_match.group(1), bounding_box_json=closest.bbox,
                        confidence_score=min(block.confidence, closest.confidence)
                    )
    return None

def classify_consumer_care(text_blocks: List[TextBlock]) -> Optional[ExtractedField]:
    contact_regex = re.compile(r'(\+?[0-9\s-]{10,15}|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', re.IGNORECASE)
    care_anchor_regex = re.compile(r'(?:CARE|FEEDBACK|CONTACT|SUPPORT|TOLL\s*FREE|COMPLAINTS)', re.IGNORECASE)
    
    for block in text_blocks:
        if care_anchor_regex.search(block.text):
            match = contact_regex.search(block.text)
            if match:
                return ExtractedField(
                    field_type=FieldType.consumer_care, raw_text=block.text, parsed_value=match.group(1),
                    bounding_box_json=block.bbox, confidence_score=block.confidence
                )
            closest = _find_closest_block(block, text_blocks)
            if closest:
                val_match = contact_regex.search(closest.text)
                if val_match:
                    return ExtractedField(
                        field_type=FieldType.consumer_care, raw_text=f"{block.text} {closest.text}",
                        parsed_value=val_match.group(1), bounding_box_json=closest.bbox,
                        confidence_score=min(block.confidence, closest.confidence)
                    )
                    
    # Ultimate fallback: just look for phone/email anywhere
    for block in text_blocks:
        match = contact_regex.search(block.text)
        if match:
            # check if it looks like an email or a long enough phone number
            val = match.group(1).strip()
            if '@' in val or len(re.sub(r'\D', '', val)) >= 10:
                return ExtractedField(
                    field_type=FieldType.consumer_care, raw_text=block.text, parsed_value=val,
                    bounding_box_json=block.bbox, confidence_score=block.confidence
                )
    return None

def classify_manufacturer_address(text_blocks: List[TextBlock]) -> Optional[ExtractedField]:
    pincode_regex = re.compile(r'\b[1-9][0-9]{2}\s?[0-9]{3}\b')
    mfg_anchor = re.compile(r'(?:MFD\s*BY|MANUFACTURED\s*BY|MKTD\s*BY|MARKETED\s*BY|PACKED\s*BY)', re.IGNORECASE)
    
    address_blocks = []
    found_pin = False
    
    for block in text_blocks:
        if pincode_regex.search(block.text):
            address_blocks.append(block)
            found_pin = True
            break
            
    if found_pin:
        anchor_block = address_blocks[0]
        a_center_y = sum([p[1] for p in anchor_block.bbox]) / 4
        for block in text_blocks:
            if block == anchor_block: continue
            b_center_y = sum([p[1] for p in block.bbox]) / 4
            dist = _calculate_distance(anchor_block.bbox, block.bbox)
            if b_center_y <= a_center_y + 40 and dist < 400:
                address_blocks.append(block)
                
        address_blocks.sort(key=lambda b: sum([p[1] for p in b.bbox]) / 4)
        combined_text = " ".join([b.text for b in address_blocks])
        
        all_xs = [p[0] for b in address_blocks for p in b.bbox]
        all_ys = [p[1] for b in address_blocks for p in b.bbox]
        min_x, max_x = min(all_xs), max(all_xs)
        min_y, max_y = min(all_ys), max(all_ys)
        union_bbox = [[min_x, min_y], [max_x, min_y], [max_x, max_y], [min_x, max_y]]
        
        return ExtractedField(
            field_type=FieldType.manufacturer, raw_text=combined_text, parsed_value=combined_text,
            bounding_box_json=union_bbox, confidence_score=min([b.confidence for b in address_blocks])
        )
        
    # If no pin code, look for anchor
    for block in text_blocks:
        if mfg_anchor.search(block.text):
            return ExtractedField(
                field_type=FieldType.manufacturer, raw_text=block.text, parsed_value=block.text,
                bounding_box_json=block.bbox, confidence_score=block.confidence
            )
            
    return None

def classify_fields(text_blocks: List[TextBlock]) -> Dict[str, ExtractedField]:
    fields = {}
    mrp = classify_mrp(text_blocks)
    if mrp: fields[FieldType.mrp.value] = mrp
    net_qty = classify_net_quantity(text_blocks)
    if net_qty: fields[FieldType.net_qty.value] = net_qty
    mfg_date = classify_mfg_date(text_blocks)
    if mfg_date: fields[FieldType.mfg_date.value] = mfg_date
    consumer_care = classify_consumer_care(text_blocks)
    if consumer_care: fields[FieldType.consumer_care.value] = consumer_care
    manufacturer = classify_manufacturer_address(text_blocks)
    if manufacturer: fields[FieldType.manufacturer.value] = manufacturer
    return fields
