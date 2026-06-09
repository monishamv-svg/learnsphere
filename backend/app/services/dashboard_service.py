from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.services.student_timetable_service import (
    get_student_timetable
)


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

    return {
        "students": total_students,
        "courses": total_courses,
        "attendance_records": total_attendance_records,
        "timetable_entries": total_timetable_entries,
        "enrollments": total_enrollments
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

    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).all()

    enrolled_course_ids = [
        enrollment.course_id
        for enrollment in enrollments
    ]

    courses = db.query(Course).filter(
        Course.id.in_(enrolled_course_ids)
    ).all()

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

    attendance_percentage = 0

    if total_classes > 0:
        attendance_percentage = round(
            (present_classes / total_classes) * 100,
            2
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
        "enrolled_courses": [
            {
                "id": course.id,
                "course_code": course.course_code,
                "title": course.title,
                "semester": course.semester,
                "department": course.department,
                "instructor_name": course.instructor_name,
                "max_capacity": course.max_capacity,
                "is_elective": course.is_elective
            }
            for course in courses
        ],
        "timetable": [
            {
                "course_id": entry["course_id"],
                "course_code": entry["course_code"],
                "day_of_week": entry["day_of_week"],
                "start_time": entry["start_time"],
                "end_time": entry["end_time"],
                "room_number": entry["room_number"],
                "instructor_name": entry["instructor_name"],
            }
            for entry in student_timetable["entries"]
        ]
    }
