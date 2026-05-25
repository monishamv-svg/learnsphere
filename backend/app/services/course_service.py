from sqlalchemy.orm import Session

from app.models.course import Course
from app.schemas.course import CourseCreate


def create_course(db: Session, course: CourseCreate):
    db_course = Course(**course.model_dump())

    db.add(db_course)

    db.commit()

    db.refresh(db_course)

    return db_course


def get_all_courses(db: Session):
    return db.query(Course).all()


def get_course_by_id(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()