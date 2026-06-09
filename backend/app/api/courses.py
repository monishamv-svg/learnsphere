from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.schemas.course import (
    CourseCreate,
    CourseRead,
    CourseUpdate,
    CoursePut
)
from app.services.course_service import (
    create_course,
    get_all_courses,
    get_course_by_id,
    update_course,
    replace_course,
    delete_course
)
from app.schemas.common import StandardResponse
from app.schemas.pagination import CoursePagination

router = APIRouter()


@router.post("/", response_model=CourseRead)
def create_course_api(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        return create_course(db, course)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/", response_model=CoursePagination)
def get_courses_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    credits: Optional[int] = Query(
        default=None,
        ge=1,
        le=6
    ),
    department: Optional[str] = None,
    semester: Optional[int] = Query(
        default=None,
        ge=1,
        le=8
    ),
    is_elective: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return get_all_courses(
        db,
        skip,
        limit,
        credits,
        department,
        semester,
        is_elective
    )


@router.get(
    "/{course_id}",
    response_model=StandardResponse[CourseRead]
)
def get_course_api(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = get_course_by_id(
        db,
        course_id
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return StandardResponse[CourseRead](
        success=True,
        message="Course fetched successfully",
        data=course
    )


@router.put(
    "/{course_id}",
    response_model=CourseRead
)
def replace_course_api(
    course_id: int,
    course_data: CoursePut,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_course = replace_course(
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