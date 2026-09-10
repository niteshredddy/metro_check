import os
import sys
import traceback

sys.path.insert(0, os.path.abspath('backend'))

from app.database import SessionLocal
from app.models import Scan, User, ExtractedField, ComplianceCheck
from app.pipeline import process_scan
from datetime import datetime

def test():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No user found")
        return
        
    scan = Scan(
        user_id=user.id, 
        image_path='test_labels/compliant_snack.jpg', 
        uploaded_at=datetime.utcnow()
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    print('Scan inserted:', scan.id)
    
    try:
        process_scan(scan, 'test_labels/compliant_snack.jpg', db)
        print("Success")
    except Exception as e:
        traceback.print_exc()

if __name__ == '__main__':
    test()
