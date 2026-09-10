"""Rule clauses API route — list all rules for the rulebook screen."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RuleClause, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("")
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all rule clauses from the Legal Metrology (Packaged Commodities) Rules, 2011."""
    clauses = db.query(RuleClause).order_by(RuleClause.id).all()

    return {
        "total": len(clauses),
        "rules": [
            {
                "id": c.id,
                "clause_number": c.clause_number,
                "clause_text": c.clause_text,
                "field_type": c.field_type,
                "validation_type": c.validation_type,
                "validation_params": c.validation_params_json,
            }
            for c in clauses
        ],
    }
