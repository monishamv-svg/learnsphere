from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.services.student_timetable_service import (
    get_student_timetable
)
from app.services.attendance_service import (
    get_student_attendance_by_course
)

WEEKDAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]


def _get_students_by_department(db: Session) -> list:
    rows = (
        db.query(
            Student.department,
            func.count(Student.id),
        )
        .group_by(Student.department)
        .order_by(Student.department)
        .all()
    )

    return [
        {"name": department, "count": count}
        for department, count in rows
    ]


def _get_students_by_semester(db: Session) -> list:
    rows = (
        db.query(
            Student.semester,
            func.count(Student.id),
        )
        .group_by(Student.semester)
        .order_by(Student.semester)
        .all()
    )

    return [
        {"name": f"Sem {semester}", "count": count}
        for semester, count in rows
    ]


def _get_students_by_department_semester(db: Session) -> list:
    rows = (
        db.query(
            Student.department,
            Student.semester,
            func.count(Student.id),
        )
        .group_by(Student.department, Student.semester)
        .order_by(Student.semester, Student.department)
        .all()
    )

    return [
        {
            "department": department,
            "semester": semester,
            "count": count,
        }
        for department, semester, count in rows
    ]


def _get_classes_by_weekday(db: Session) -> list:
    rows = (
        db.query(
            Timetable.day_of_week,
            func.count(Timetable.id),
        )
        .group_by(Timetable.day_of_week)
        .all()
    )

    counts = {
        day: count
        for day, count in rows
    }

    return [
        {
            "name": day[:3],
            "full_name": day,
            "count": counts.get(day, 0),
        }
        for day in WEEKDAY_ORDER
    ]


def get_admin_dashboard_stats(
    db: Session
):
    total_students = db.query(
        Student
    ).count()

    total_courses = db.query(
        Course
    ).count()

    total_attendance_records = db.query(
        Attendance
    ).count()

    total_timetable_entries = db.query(
        Timetable
    ).count()

    total_enrollments = db.query(
        Enrollment
    ).count()

    core_courses = db.query(Course).filter(
        Course.is_elective.is_(False)
    ).count()

    elective_courses = db.query(Course).filter(
        Course.is_elective.is_(True)
    ).count()

    return {
        "students": total_students,
        "courses": total_courses,
        "attendance_records": total_attendance_records,
        "timetable_entries": total_timetable_entries,
        "enrollments": total_enrollments,
        "course_breakdown": {
            "core": core_courses,
            "elective": elective_courses,
        },
        "students_by_department": _get_students_by_department(db),
        "students_by_semester": _get_students_by_semester(db),
        "students_by_department_semester": (
            _get_students_by_department_semester(db)
        ),
        "classes_by_weekday": _get_classes_by_weekday(db),
    }


def get_student_dashboard(
    db: Session,
    student_id: int
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        return None

    student_timetable = get_student_timetable(
        db,
        student_id
    )

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()

    total_classes = len(attendance_records)

    present_classes = len(
        [
            attendance
            for attendance in attendance_records
            if attendance.status == "Present"
        ]
    )

    absent_classes = len(
        [
            attendance
            for attendance in attendance_records
            if attendance.status != "Present"
        ]
    )

    attendance_percentage = 0

    if total_classes > 0:
        attendance_percentage = round(
            (present_classes / total_classes) * 100,
            2
        )

    attendance_by_course = get_student_attendance_by_course(
        db,
        student_id
    )

    return {
        "student": {
            "id": student.id,
            "full_name": student.user.full_name if student.user else "",
            "student_code": student.student_code,
            "department": student.department,
            "semester": student.semester
        },
        "attendance_percentage": attendance_percentage,
        "attendance_summary": {
            "present": present_classes,
            "absent": absent_classes,
        },
        "attendance_by_course": [
            summary.model_dump()
            for summary in attendance_by_course
        ],
        "timetable": [
            {
                "day_of_week": entry["day_of_week"],
                "start_time": entry["start_time"],
                "end_time": entry["end_time"],
                "room_number": entry["room_number"],
            }
            for entry in student_timetable["entries"]
        ]
    }
