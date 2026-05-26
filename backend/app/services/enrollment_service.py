from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentPut
)
from app.models.course import Course


def create_enrollment(
    db: Session,
    enrollment: EnrollmentCreate
):
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == enrollment.student_id,
        Enrollment.course_id == enrollment.course_id
    ).first()

    if existing_enrollment:
        raise ValueError(
            "Student already enrolled in this course"
        )

    student_enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == enrollment.student_id
    ).all()

    total_credits = 0

    for item in student_enrollments:
        course = db.query(Course).filter(
            Course.id == item.course_id
        ).first()

        if course:
            total_credits += course.credits

    new_course = db.query(Course).filter(
        Course.id == enrollment.course_id
    ).first()

    if not new_course:
        raise ValueError(
            "Course not found"
        )

    if total_credits + new_course.credits > 24:
        raise ValueError(
            "Credit limit exceeded"
        )

    db_enrollment = Enrollment(
        **enrollment.model_dump()
    )

    db.add(db_enrollment)

    db.commit()

    db.refresh(db_enrollment)

    return db_enrollment


def get_all_enrollments(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(Enrollment)\
        .offset(skip)\
        .limit(limit)\
        .all()


def update_enrollment(
    db: Session,
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()

    if not enrollment:
        return None

    update_data = enrollment_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(enrollment, key, value)

    db.commit()
    db.refresh(enrollment)

    return enrollment


def replace_enrollment(
    db: Session,
    enrollment_id: int,
    enrollment_data: EnrollmentPut
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()

    if not enrollment:
        return None

    enrollment.student_id = enrollment_data.student_id
    enrollment.course_id = enrollment_data.course_id

    db.commit()
    db.refresh(enrollment)

    return enrollment


def delete_enrollment(
    db: Session,
    enrollment_id: int
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id
    ).first()

    if not enrollment:
        return None

    db.delete(enrollment)

    db.commit()

    return {
        "message": "Enrollment deleted successfully"
    }