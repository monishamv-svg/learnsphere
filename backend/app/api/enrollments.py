from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_admin, get_current_user
from app.db.session import get_db
from app.models.student import Student
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentRead,
    EnrollmentUpdate,
    EnrollmentPut
)
from app.services.enrollment_service import (
    create_enrollment,
    get_all_enrollments,
    get_enrollments_for_student,
    update_enrollment,
    replace_enrollment,
    delete_enrollment
)

router = APIRouter()


def _get_student_for_user(db: Session, user):
    student = db.query(Student).filter(
        Student.user_id == user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    return student


@router.post("/", response_model=EnrollmentRead)
def create_enrollment_api(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "student":
        student = _get_student_for_user(db, current_user)
        enrollment = EnrollmentCreate(
            student_id=student.id,
            course_id=enrollment.course_id,
            timetable_id=enrollment.timetable_id
        )
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create enrollments"
        )

    try:
        return create_enrollment(db, enrollment)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/", response_model=List[EnrollmentRead])
def get_enrollments_api(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "student":
        student = _get_student_for_user(db, current_user)
        return get_enrollments_for_student(
            db,
            student.id,
            skip,
            limit
        )

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view enrollments"
        )

    return get_all_enrollments(
        db,
        skip,
        limit
    )


@router.put("/{enrollment_id}")
def replace_enrollment_api(
    enrollment_id: int,
    enrollment_data: EnrollmentPut,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    updated_enrollment = replace_enrollment(
        db,
        enrollment_id,
        enrollment_data
    )

    if not updated_enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found"
        )

    return updated_enrollment


@router.patch("/{enrollment_id}")
def update_enrollment_api(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    updated_enrollment = update_enrollment(
        db,
        enrollment_id,
        enrollment_data
    )

    if not updated_enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found"
        )

    return updated_enrollment


@router.delete("/{enrollment_id}")
def delete_enrollment_api(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    deleted_enrollment = delete_enrollment(
        db,
        enrollment_id
    )

    if not deleted_enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found"
        )

    return deleted_enrollment
