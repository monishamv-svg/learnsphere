from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.schemas.course import CourseCreate, CourseRead
from app.services.course_service import (
    create_course,
    get_all_courses,
    get_course_by_id
)

router = APIRouter()


@router.post("/", response_model=CourseRead)
def create_course_api(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    return create_course(db, course)


@router.get("/", response_model=List[CourseRead])
def get_courses_api(db: Session = Depends(get_db)):
    return get_all_courses(db)


@router.get("/{course_id}", response_model=CourseRead)
def get_course_api(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = get_course_by_id(db, course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course