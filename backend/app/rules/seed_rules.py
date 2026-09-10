from sqlalchemy.orm import Session
from app.models import RuleClause

def seed_rules(db: Session):
    rules = [
        {
            "clause_number": "Rule 6(1)(a)",
            "clause_text": "Every package shall bear the name and address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer.",
            "field_type": "manufacturer",
            "validation_type": "presence_and_completeness",
            "validation_params_json": {"requires_pincode": True}
        },
        {
            "clause_number": "Rule 6(1)(c)",
            "clause_text": "Every package shall bear the net quantity, in terms of standard unit of weight or measure, of the commodity contained in the package.",
            "field_type": "net_qty",
            "validation_type": "presence_and_format",
            "validation_params_json": {"allowed_units": ["g", "kg", "ml", "l", "mg", "pcs", "units"]}
        },
        {
            "clause_number": "Rule 6(1)(d)",
            "clause_text": "Every package shall bear the month and year in which the commodity is manufactured or pre-packed or imported.",
            "field_type": "mfg_date",
            "validation_type": "presence_and_format",
            "validation_params_json": {}
        },
        {
            "clause_number": "Rule 6(1)(e)",
            "clause_text": "Every package shall bear the retail sale price of the package (MRP).",
            "field_type": "mrp",
            "validation_type": "presence_and_numeric",
            "validation_params_json": {}
        },
        {
            "clause_number": "Rule 6(2)",
            "clause_text": "Every package shall bear the name, address, telephone number, e-mail address of the person who can be or the office which can be contacted, in case of consumer complaints.",
            "field_type": "consumer_care",
            "validation_type": "presence_and_contact",
            "validation_params_json": {}
        },
        {
            "clause_number": "Rule 7",
            "clause_text": "Height of numerals and letters: Advisory check based on package area.",
            "field_type": "all",
            "validation_type": "font_size_advisory",
            "validation_params_json": {}
        }
    ]
    
    for r in rules:
        existing = db.query(RuleClause).filter_by(clause_number=r["clause_number"]).first()
        if not existing:
            rule = RuleClause(**r)
            db.add(rule)
            
    db.commit()
