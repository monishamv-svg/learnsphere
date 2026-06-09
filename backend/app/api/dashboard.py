from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.core.security import (
    require_admin,
    require_student
)

from app.models.student import Student

from app.services.dashboard_service import (
    get_admin_dashboard_stats,
    get_student_dashboard
)

router = APIRouter()

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    return get_admin_dashboard_stats(db)


@router.get("/me")
def get_my_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    return get_student_dashboard(
        db,
        student.id
    )