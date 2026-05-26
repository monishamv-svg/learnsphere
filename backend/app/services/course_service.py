from sqlalchemy.orm import Session

from app.models.course import Course
from app.schemas.course import CourseCreate
from app.schemas.course import CourseUpdate

def create_course(
    db: Session,
    course: CourseCreate
):
    existing_course = db.query(Course).filter(
        Course.course_code == course.course_code
    ).first()

    if existing_course:
        raise ValueError(
            "Course code already exists"
        )

    db_course = Course(**course.model_dump())

    db.add(db_course)

    db.commit()

    db.refresh(db_course)

    return db_course


def get_all_courses(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(Course)\
        .offset(skip)\
        .limit(limit)\
        .all()


def get_course_by_id(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()

def update_course(
    db: Session,
    course_id: int,
    course_data: CourseUpdate
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return None

    update_data = course_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    return course


def replace_course(
    db: Session,
    course_id: int,
    course_data
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return None

    course.course_code = course_data.course_code
    course.title = course_data.title
    course.description = course_data.description
    course.credits = course_data.credits

    db.commit()
    db.refresh(course)

    return course


def delete_course(
    db: Session,
    course_id: int
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return None

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }