from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.dashboard_service import (
    get_student_dashboard
)

router = APIRouter()


@router.get("/{student_id}")
def get_dashboard_api(
    student_id: int,
    db: Session = Depends(get_db)
):
    dashboard = get_student_dashboard(
        db,
        student_id
    )

    if not dashboard:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return dashboard