from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.schemas.course import CourseCreate, CourseRead
from app.schemas.course import (
    CourseCreate,
    CourseRead,
    CourseUpdate
)
from app.services.course_service import (
    create_course,
    get_all_courses,
    get_course_by_id,
    update_course,
    delete_course
)

router = APIRouter()


@router.post("/", response_model=CourseRead)
def create_course_api(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
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

@router.patch(
    "/{course_id}",
    response_model=CourseRead
)
def update_course_api(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_course = update_course(
        db,
        course_id,
        course_data
    )

    if not updated_course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return updated_course

@router.delete("/{course_id}")
def delete_course_api(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    deleted_course = delete_course(
        db,
        course_id
    )

    if not deleted_course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return deleted_course