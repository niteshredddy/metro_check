import sys
import os
import traceback
sys.path.insert(0, os.path.abspath('.'))

from app.database import SessionLocal
from app.models import Scan, User
from app.pipeline import process_scan
from datetime import datetime

def run():
    db = SessionLocal()
    user = db.query(User).first()
    scan = Scan(
        user_id=user.id,
        image_path='../test_labels/compliant_snack.jpg',
        uploaded_at=datetime.utcnow()
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    print('Scan inserted!')
    try:
        process_scan(scan, '../test_labels/compliant_snack.jpg', db)
        print('Process scan successful!')
    except Exception:
        traceback.print_exc()

if __name__ == '__main__':
    run()
