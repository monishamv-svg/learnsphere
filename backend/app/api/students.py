from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.student import StudentCreate, StudentRead
from app.services.student_service import (
    create_student,
    get_all_students,
    get_student_by_id
)
from app.core.security import require_admin
from typing import List

router = APIRouter()


@router.post("/", response_model=StudentRead)
def create_student_api(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)  ##Check if the user is an admin
):
    return create_student(db, student)


@router.get("/", response_model=List[StudentRead])
def get_students_api(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin) 
):
    return get_all_students(db)


@router.get("/{student_id}", response_model=StudentRead)
def get_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    student = get_student_by_id(db, student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student