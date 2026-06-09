from datetime import date

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.models.enrollment import Enrollment
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendancePut
)
from app.utils.datetime_format import store_date


def _validate_attendance_date_not_future(
    attendance_date: date
):
    if attendance_date > date.today():
        raise ValueError(
            "Attendance cannot be marked for a future date"
        )


def _validate_date_matches_timetable(
    db: Session,
    timetable_id: int,
    attendance_date: date
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        raise ValueError("Timetable not found")

    day_name = attendance_date.strftime("%A")

    if day_name != timetable.day_of_week:
        raise ValueError(
            f"This class is scheduled on "
            f"{timetable.day_of_week}. "
            f"The selected date is {day_name}."
        )


def _validate_student_enrolled_for_timetable(
    db: Session,
    student_id: int,
    timetable_id: int
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        raise ValueError("Timetable not found")

    enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == timetable.course_id
    ).first()

    if not enrolled:
        raise ValueError(
            "Student is not enrolled in this course"
        )


def mark_attendance(
    db: Session,
    attendance: AttendanceCreate
):
    existing_record = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.timetable_id == attendance.timetable_id,
        Attendance.attendance_date == store_date(
            attendance.attendance_date
        )
    ).first()

    if existing_record:
        raise ValueError(
            "Attendance already marked"
        )

    _validate_attendance_date_not_future(
        attendance.attendance_date
    )

    _validate_date_matches_timetable(
        db,
        attendance.timetable_id,
        attendance.attendance_date
    )

    _validate_student_enrolled_for_timetable(
        db,
        attendance.student_id,
        attendance.timetable_id
    )

    db_attendance = Attendance(
        student_id=attendance.student_id,
        timetable_id=attendance.timetable_id,
        attendance_date=store_date(
            attendance.attendance_date
        ),
        status=attendance.status.value
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
    return (
        db.query(Attendance)
        .filter(
            Attendance.student_id.isnot(None),
            Attendance.timetable_id.isnot(None)
        )
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


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
        if key == "attendance_date" and value is not None:
            value = store_date(value)

        if key == "status" and value is not None:
            value = value.value

        setattr(attendance, key, value)

    _validate_attendance_date_not_future(
        date.fromisoformat(attendance.attendance_date)
    )

    _validate_date_matches_timetable(
        db,
        attendance.timetable_id,
        date.fromisoformat(attendance.attendance_date)
    )

    _validate_student_enrolled_for_timetable(
        db,
        attendance.student_id,
        attendance.timetable_id
    )

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
    attendance.attendance_date = store_date(
        attendance_data.attendance_date
    )
    attendance.status = attendance_data.status.value

    _validate_attendance_date_not_future(
        attendance_data.attendance_date
    )

    _validate_date_matches_timetable(
        db,
        attendance.timetable_id,
        attendance_data.attendance_date
    )

    _validate_student_enrolled_for_timetable(
        db,
        attendance.student_id,
        attendance.timetable_id
    )

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
