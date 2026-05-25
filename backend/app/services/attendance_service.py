from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate


def mark_attendance(
    db: Session,
    attendance: AttendanceCreate
):
    existing_record = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.timetable_id == attendance.timetable_id,
        Attendance.attendance_date == attendance.attendance_date
    ).first()

    if existing_record:
        raise ValueError(
            "Attendance already marked"
        )

    db_attendance = Attendance(
        **attendance.model_dump()
    )

    db.add(db_attendance)

    db.commit()

    db.refresh(db_attendance)

    return db_attendance


def get_all_attendance(
    db: Session
):
    return db.query(Attendance).all()


def calculate_attendance_percentage(
    db: Session,
    student_id: int
):
    total_classes = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).count()

    present_classes = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.status == "Present"
    ).count()

    if total_classes == 0:
        return 0

    percentage = (
        present_classes / total_classes
    ) * 100

    return round(percentage, 2)