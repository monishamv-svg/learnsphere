from typing import Optional

from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.utils.course_instructors import get_course_instructors


def _course_to_read(
    db: Session,
    course: Course
) -> CourseRead:
    enrollment_count = db.query(Enrollment).filter(
        Enrollment.course_id == course.id
    ).count()

    return CourseRead(
        id=course.id,
        course_code=course.course_code,
        title=course.title,
        description=course.description,
        credits=course.credits,
        semester=course.semester,
        department=course.department,
        instructor_name=course.instructor_name,
        additional_instructors=course.additional_instructors,
        instructors=get_course_instructors(course),
        max_capacity=course.max_capacity,
        is_elective=course.is_elective,
        enrollment_count=enrollment_count
    )


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

    return _course_to_read(db, db_course)


def get_all_courses(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    credits: Optional[int] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    is_elective: Optional[bool] = None
):
    query = db.query(Course)

    if credits is not None:
        query = query.filter(Course.credits == credits)

    if department:
        query = query.filter(Course.department == department)

    if semester is not None:
        query = query.filter(Course.semester == semester)

    if is_elective is not None:
        query = query.filter(Course.is_elective == is_elective)

    total_count = query.count()

    courses = query.offset(skip).limit(limit).all()

    return {
        "total_count": total_count,
        "items": [
            _course_to_read(db, course)
            for course in courses
        ],
    }


def get_course_by_id(db: Session, course_id: int):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return None

    return _course_to_read(db, course)


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

    if "max_capacity" in update_data:
        enrollment_count = db.query(Enrollment).filter(
            Enrollment.course_id == course_id
        ).count()

        if update_data["max_capacity"] < enrollment_count:
            raise ValueError(
                "Max capacity cannot be less than current enrollments"
            )

    for key, value in update_data.items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    return _course_to_read(db, course)


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

    enrollment_count = db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).count()

    if course_data.max_capacity < enrollment_count:
        raise ValueError(
            "Max capacity cannot be less than current enrollments"
        )

    course.course_code = course_data.course_code
    course.title = course_data.title
    course.description = course_data.description
    course.credits = course_data.credits
    course.semester = course_data.semester
    course.department = course_data.department
    course.instructor_name = course_data.instructor_name
    course.additional_instructors = course_data.additional_instructors
    course.max_capacity = course_data.max_capacity
    course.is_elective = course_data.is_elective

    db.commit()
    db.refresh(course)

    return _course_to_read(db, course)


def delete_course(
    db: Session,
    course_id: int
):
    from app.models.timetable import Timetable

    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return None

    db.query(Timetable).filter(
        Timetable.course_id == course_id
    ).delete(synchronize_session=False)

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }
