from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.schemas.enrollment import EnrollmentCreate


def create_enrollment(db: Session, enrollment: EnrollmentCreate):
    db_enrollment = Enrollment(**enrollment.model_dump())

    db.add(db_enrollment)

    db.commit()

    db.refresh(db_enrollment)

    return db_enrollment


def get_all_enrollments(db: Session):
    return db.query(Enrollment).all()