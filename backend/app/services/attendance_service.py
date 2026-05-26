from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.attendance import Attendance
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendancePut
)


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
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(Attendance)\
        .offset(skip)\
        .limit(limit)\
        .all()


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


def update_attendance(
    db: Session,
    attendance_id: int,
    attendance_data: AttendanceUpdate
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        return None

    update_data = attendance_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(attendance, key, value)

    db.commit()
    db.refresh(attendance)

    return attendance


def replace_attendance(
    db: Session,
    attendance_id: int,
    attendance_data: AttendancePut
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        return None

    attendance.student_id = attendance_data.student_id
    attendance.timetable_id = attendance_data.timetable_id
    attendance.attendance_date = attendance_data.attendance_date
    attendance.status = attendance_data.status

    db.commit()
    db.refresh(attendance)

    return attendance


def delete_attendance(
    db: Session,
    attendance_id: int
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        return None

    db.delete(attendance)

    db.commit()

    return {
        "message": "Attendance deleted successfully"
    }