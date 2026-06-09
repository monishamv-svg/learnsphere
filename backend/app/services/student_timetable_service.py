from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.student import Student
from app.utils.datetime_format import format_time
from app.utils.student_schedule import get_student_enrolled_timetables

DAY_ORDER = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
}


def get_student_timetable(
    db: Session,
    student_id: int
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        return None

    timetables = get_student_enrolled_timetables(
        db,
        student_id
    )

    course_ids = {
        timetable.course_id
        for timetable in timetables
    }

    courses = []

    if course_ids:
        courses = db.query(Course).filter(
            Course.id.in_(course_ids)
        ).all()

    course_by_id = {
        course.id: course
        for course in courses
    }

    entries = []

    for timetable in timetables:
        course = course_by_id.get(timetable.course_id)

        entries.append({
            "timetable_id": timetable.id,
            "course_id": timetable.course_id,
            "course_code": (
                course.course_code if course else ""
            ),
            "course_title": (
                course.title if course else ""
            ),
            "day_of_week": timetable.day_of_week,
            "start_time": format_time(
                timetable.start_time
            ),
            "end_time": format_time(
                timetable.end_time
            ),
            "room_number": timetable.room_number,
            "instructor_name": timetable.instructor_name,
        })

    entries.sort(
        key=lambda entry: (
            DAY_ORDER.get(entry["day_of_week"], 99),
            entry["start_time"]
        )
    )

    total_credits = sum(
        course.credits
        for course in courses
    )

    return {
        "student": {
            "id": student.id,
            "full_name": (
                student.user.full_name
                if student.user
                else ""
            ),
            "student_code": student.student_code,
            "department": student.department,
            "semester": student.semester,
        },
        "schedule_group": {
            "semester": student.semester,
            "department": student.department,
            "label": (
                f"Semester {student.semester} Schedule "
                f"({student.department})"
            ),
        },
        "entries": entries,
        "total_credits": total_credits,
    }
