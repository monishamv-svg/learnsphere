from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.schemas.attendance import (AttendanceCreate, AttendanceRead)
from app.services.attendance_service import (mark_attendance, get_all_attendance, calculate_attendance_percentage)

router = APIRouter()


@router.post(
    "/",
    response_model=AttendanceRead
)
def mark_attendance_api(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        return mark_attendance(
            db,
            attendance
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=List[AttendanceRead]
)
def get_attendance_api(
    db: Session = Depends(get_db)
):
    return get_all_attendance(db)


@router.get(
    "/percentage/{student_id}"
)
def get_attendance_percentage(
    student_id: int,
    db: Session = Depends(get_db)
):
    percentage = calculate_attendance_percentage(
        db,
        student_id
    )

    return {
        "student_id": student_id,
        "attendance_percentage": percentage
    }