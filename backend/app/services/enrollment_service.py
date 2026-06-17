from sqlalchemy.orm import Session, joinedload

from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.timetable import Timetable
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentPut
)
from app.models.course import Course
from app.utils.course_instructors import get_course_instructors
from app.utils.datetime_format import format_time
from app.utils.student_schedule import check_student_schedule_conflict


def _enrollment_query(db: Session):
    return (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.student).joinedload(Student.user),
            joinedload(Enrollment.course),
            joinedload(Enrollment.timetable)
        )
    )


def format_enrollment_read(enrollment: Enrollment) -> dict:
    student_name = "Unknown"
    student_code = "—"
    semester = 0
    course_name = "Unknown"
    course_code = "—"
    credits = 0
    is_elective = False
    timetable_id = enrollment.timetable_id
    instructor_name = None
    day_of_week = None
    start_time = None
    end_time = None
    room_number = None

    if enrollment.student:
        semester = enrollment.student.semester
        student_code = enrollment.student.student_code

        if enrollment.student.user:
            student_name = enrollment.student.user.full_name

    if enrollment.course:
        course_name = enrollment.course.title
        course_code = enrollment.course.course_code
        credits = enrollment.course.credits
        is_elective = enrollment.course.is_elective

    if enrollment.timetable:
        instructor_name = enrollment.timetable.instructor_name
        day_of_week = enrollment.timetable.day_of_week
        start_time = format_time(
            enrollment.timetable.start_time
        )
        end_time = format_time(
            enrollment.timetable.end_time
        )
        room_number = enrollment.timetable.room_number

    return {
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "course_id": enrollment.course_id,
        "timetable_id": timetable_id,
        "student_name": student_name,
        "student_code": student_code,
        "semester": semester,
        "course_name": course_name,
        "course_code": course_code,
        "credits": credits,
        "is_elective": is_elective,
        "instructor_name": instructor_name,
        "day_of_week": day_of_week,
        "start_time": start_time,
        "end_time": end_time,
        "room_number": room_number,
    }


def get_enrollment_with_relations(
    db: Session,
    enrollment_id: int
):
    return (
        _enrollment_query(db)
        .filter(Enrollment.id == enrollment_id)
        .first()
    )


def _section_capacity(course: Course, section_count: int) -> int:
    if section_count <= 0:
        return course.max_capacity

    return max(
        1,
        course.max_capacity // section_count
    )


def _validate_timetable_section(
    db: Session,
    course: Course,
    timetable_id: int
) -> Timetable:
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        raise ValueError(
            "Selected class section not found"
        )

    if timetable.course_id != course.id:
        raise ValueError(
            "Class section does not belong to this course"
        )

    allowed_instructors = get_course_instructors(course)

    if timetable.instructor_name not in allowed_instructors:
        raise ValueError(
            "Professor is not assigned to this course"
        )

    section_count = db.query(Timetable).filter(
        Timetable.course_id == course.id
    ).count()

    section_limit = _section_capacity(
        course,
        section_count
    )

    section_enrollment_count = db.query(Enrollment).filter(
        Enrollment.timetable_id == timetable_id
    ).count()

    if section_enrollment_count >= section_limit:
        raise ValueError(
            "This class section is at maximum capacity"
        )

    return timetable


def _student_elective_enrollment_count(
    db: Session,
    student_id: int,
    exclude_enrollment_id: int = None
) -> int:
    query = (
        db.query(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(
            Enrollment.student_id == student_id,
            Course.is_elective.is_(True)
        )
    )

    if exclude_enrollment_id is not None:
        query = query.filter(
            Enrollment.id != exclude_enrollment_id
        )

    return query.count()


def _validate_enrollment_rules(
    db: Session,
    student: Student,
    course: Course,
    exclude_enrollment_id: int = None
):
    if course.semester != student.semester:
        raise ValueError(
            "Student can only enroll in courses for their semester"
        )

    if (
        not course.is_elective and
        course.department != student.department
    ):
        raise ValueError(
            "Student can only enroll in core courses "
            "from their department"
        )

    if course.is_elective:
        elective_count = _student_elective_enrollment_count(
            db,
            student.id,
            exclude_enrollment_id
        )

        if elective_count >= 1:
            raise ValueError(
                "Student can only enroll in one elective "
                "per semester"
            )


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

    student = db.query(Student).filter(
        Student.id == enrollment.student_id
    ).first()

    if not student:
        raise ValueError(
            "Student not found"
        )

    _validate_enrollment_rules(
        db,
        student,
        new_course
    )

    _validate_timetable_section(
        db,
        new_course,
        enrollment.timetable_id
    )

    schedule_conflict = check_student_schedule_conflict(
        db,
        enrollment.student_id,
        enrollment.timetable_id
    )

    if schedule_conflict:
        raise ValueError(schedule_conflict)

    enrollment_count = db.query(Enrollment).filter(
        Enrollment.course_id == enrollment.course_id
    ).count()

    if enrollment_count >= new_course.max_capacity:
        raise ValueError(
            "Course is at maximum capacity"
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

    enrollment = get_enrollment_with_relations(
        db,
        db_enrollment.id
    )

    return format_enrollment_read(enrollment)


def get_enrollments_for_student(
    db: Session,
    student_id: int,
    skip: int = 0,
    limit: int = 100
):
    enrollments = (
        _enrollment_query(db)
        .filter(Enrollment.student_id == student_id)
        .order_by(Enrollment.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        format_enrollment_read(enrollment)
        for enrollment in enrollments
    ]


def get_all_enrollments(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    enrollments = (
        _enrollment_query(db)
        .filter(
            Enrollment.student_id.isnot(None),
            Enrollment.course_id.isnot(None)
        )
        .order_by(
            Enrollment.student_id,
            Enrollment.id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        format_enrollment_read(enrollment)
        for enrollment in enrollments
    ]


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

    if "course_id" in update_data:
        student = db.query(Student).filter(
            Student.id == enrollment.student_id
        ).first()
        course = db.query(Course).filter(
            Course.id == update_data["course_id"]
        ).first()

        if not student or not course:
            raise ValueError("Student or course not found")

        _validate_enrollment_rules(
            db,
            student,
            course,
            exclude_enrollment_id=enrollment_id
        )

    if "timetable_id" in update_data:
        course_id = update_data.get(
            "course_id",
            enrollment.course_id
        )
        course = db.query(Course).filter(
            Course.id == course_id
        ).first()

        if not course:
            raise ValueError("Course not found")

        _validate_timetable_section(
            db,
            course,
            update_data["timetable_id"]
        )

        schedule_conflict = check_student_schedule_conflict(
            db,
            enrollment.student_id,
            update_data["timetable_id"],
            exclude_enrollment_id=enrollment_id
        )

        if schedule_conflict:
            raise ValueError(schedule_conflict)

    for key, value in update_data.items():
        setattr(enrollment, key, value)

    db.commit()

    enrollment = get_enrollment_with_relations(
        db,
        enrollment_id
    )

    return format_enrollment_read(enrollment)


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

    student = db.query(Student).filter(
        Student.id == enrollment_data.student_id
    ).first()
    course = db.query(Course).filter(
        Course.id == enrollment_data.course_id
    ).first()

    if not student or not course:
        raise ValueError("Student or course not found")

    _validate_enrollment_rules(
        db,
        student,
        course,
        exclude_enrollment_id=enrollment_id
    )

    _validate_timetable_section(
        db,
        course,
        enrollment_data.timetable_id
    )

    schedule_conflict = check_student_schedule_conflict(
        db,
        enrollment_data.student_id,
        enrollment_data.timetable_id,
        exclude_enrollment_id=enrollment_id
    )

    if schedule_conflict:
        raise ValueError(schedule_conflict)

    enrollment.student_id = enrollment_data.student_id
    enrollment.course_id = enrollment_data.course_id
    enrollment.timetable_id = enrollment_data.timetable_id

    db.commit()

    enrollment = get_enrollment_with_relations(
        db,
        enrollment_id
    )

    return format_enrollment_read(enrollment)


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
