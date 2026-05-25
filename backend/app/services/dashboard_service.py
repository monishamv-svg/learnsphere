from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.timetable import Timetable
from app.models.attendance import Attendance


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

    timetable_entries = db.query(Timetable).filter(
        Timetable.course_id.in_(enrolled_course_ids)
    ).all()

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()

    total_classes = len(attendance_records)

    present_classes = len([
        attendance
        for attendance in attendance_records
        if attendance.status == "Present"
    ])

    attendance_percentage = 0

    if total_classes > 0:
        attendance_percentage = round(
            (present_classes / total_classes) * 100,
            2
        )

    return {
        "student": {
            "id": student.id,
            "student_code": student.student_code,
            "department": student.department,
            "semester": student.semester
        },

        "attendance_percentage": attendance_percentage,

        "enrolled_courses": [
            {
                "id": course.id,
                "course_code": course.course_code,
                "title": course.title
            }
            for course in courses
        ],

        "timetable": [
            {
                "course_id": timetable.course_id,
                "day_of_week": timetable.day_of_week,
                "start_time": timetable.start_time,
                "end_time": timetable.end_time,
                "room_number": timetable.room_number,
                "instructor_name": timetable.instructor_name
            }
            for timetable in timetable_entries
        ]
    }
