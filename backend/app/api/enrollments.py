from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.schemas.enrollment import EnrollmentCreate, EnrollmentRead
from app.services.enrollment_service import (
    create_enrollment,
    get_all_enrollments,
)

router = APIRouter()


@router.post("/", response_model=EnrollmentRead)
def create_enrollment_api(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return create_enrollment(db, enrollment)


@router.get("/", response_model=List[EnrollmentRead])
def get_enrollments_api(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return get_all_enrollments(db)
