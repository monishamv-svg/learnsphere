from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Query

from app.db.session import get_db
from app.schemas.student import StudentCreate, StudentRead
from app.schemas.pagination import StudentPagination
from app.schemas.student import (
    StudentCreate,
    StudentRead,
    StudentUpdate,
    StudentPut
)
from app.services.student_service import (
    create_student,
    get_all_students,
    get_student_by_id,
    update_student,
    replace_student,
    delete_student
)
from app.core.security import (require_admin, get_current_user)
from typing import List

router = APIRouter()


@router.post("/", response_model=StudentRead)
def create_student_api(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)  ##Check if the user is an admin
):
    return create_student(db, student)


@router.get("/", response_model=StudentPagination)
def get_students_api(
    skip: int = Query(
        default=0,
        ge=0
    ),

    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),

    search: str = None,

    db: Session = Depends(get_db)
):
    return get_all_students(
        db,
        skip,
        limit,
        search
    )


@router.get("/{student_id}", response_model=StudentRead)
def get_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    student = get_student_by_id(db, student_id)

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    if (
        current_user.role != "admin"
        and student.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    return StudentRead.from_student(student)

@router.patch(
    "/{student_id}",
    response_model=StudentRead
)
def update_student_api(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    student = get_student_by_id(
        db,
        student_id
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    if (
        current_user.role != "admin"
        and student.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    updated_student = update_student(
        db,
        student_id,
        student_data
    )

    return updated_student

@router.put(
    "/{student_id}",
    response_model=StudentRead
)
def replace_student_api(
    student_id: int,
    student_data: StudentPut,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_student = replace_student(
        db,
        student_id,
        student_data
    )

    if not updated_student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return updated_student

@router.delete("/{student_id}")
def delete_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    deleted_student = delete_student(
        db,
        student_id
    )

    if not deleted_student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return deleted_student