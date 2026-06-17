from datetime import date

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.student import Student
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendancePut,
    AttendanceBulkCreate,
    AttendanceBulkEntry,
    AttendanceStatus,
    CourseAttendanceSummary,
    CourseAttendanceRecordSummary,
    ProfessorSessionRead,
    SessionRosterStudent,
)
from app.utils.datetime_format import format_time, store_date


def _normalize_attendance_status(status: str) -> str:
    if status == "Late":
        return "Absent"

    return status


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


def get_professor_sessions(
    db: Session,
    professor_name: str,
    attendance_date: date
) -> list[ProfessorSessionRead]:
    professor_name = professor_name.strip()

    if not professor_name:
        return []

    _validate_attendance_date_not_future(attendance_date)

    day_name = attendance_date.strftime("%A")

    timetables = (
        db.query(Timetable)
        .join(Course, Timetable.course_id == Course.id)
        .filter(
            Timetable.instructor_name.ilike(professor_name),
            Timetable.day_of_week == day_name,
        )
        .order_by(Timetable.start_time)
        .all()
    )

    sessions: list[ProfessorSessionRead] = []

    for timetable in timetables:
        enrolled_count = (
            db.query(Enrollment)
            .filter(Enrollment.timetable_id == timetable.id)
            .count()
        )

        sessions.append(
            ProfessorSessionRead(
                timetable_id=timetable.id,
                course_id=timetable.course_id,
                course_code=timetable.course.course_code,
                course_title=timetable.course.title,
                day_of_week=timetable.day_of_week,
                start_time=format_time(timetable.start_time),
                end_time=format_time(timetable.end_time),
                room_number=timetable.room_number,
                enrolled_count=enrolled_count,
            )
        )

    return sessions


def get_session_roster(
    db: Session,
    timetable_id: int,
    attendance_date: date
) -> list[SessionRosterStudent]:
    _validate_attendance_date_not_future(attendance_date)

    _validate_date_matches_timetable(
        db,
        timetable_id,
        attendance_date
    )

    enrollments = (
        db.query(Enrollment)
        .join(Student, Enrollment.student_id == Student.id)
        .filter(Enrollment.timetable_id == timetable_id)
        .order_by(Student.student_code)
        .all()
    )

    stored_date = store_date(attendance_date)
    roster: list[SessionRosterStudent] = []

    for enrollment in enrollments:
        student = enrollment.student
        existing = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.timetable_id == timetable_id,
            Attendance.attendance_date == stored_date,
        ).first()

        roster.append(
            SessionRosterStudent(
                student_id=student.id,
                student_code=student.student_code,
                student_name=(
                    student.user.full_name
                    if student.user
                    else student.student_code
                ),
                attendance_id=(
                    existing.id if existing else None
                ),
                status=(
                    AttendanceStatus(
                        _normalize_attendance_status(
                            existing.status
                        )
                    )
                    if existing
                    else None
                ),
            )
        )

    return roster


def _upsert_attendance_entry(
    db: Session,
    entry: AttendanceBulkEntry
) -> str:
    stored_date = store_date(entry.attendance_date)

    existing_record = db.query(Attendance).filter(
        Attendance.student_id == entry.student_id,
        Attendance.timetable_id == entry.timetable_id,
        Attendance.attendance_date == stored_date,
    ).first()

    if existing_record:
        existing_record.status = entry.status.value
        return "updated"

    _validate_attendance_date_not_future(
        entry.attendance_date
    )

    _validate_date_matches_timetable(
        db,
        entry.timetable_id,
        entry.attendance_date
    )

    _validate_student_enrolled_for_timetable(
        db,
        entry.student_id,
        entry.timetable_id
    )

    db_attendance = Attendance(
        student_id=entry.student_id,
        timetable_id=entry.timetable_id,
        attendance_date=stored_date,
        status=entry.status.value,
    )

    db.add(db_attendance)

    return "created"


def bulk_mark_attendance(
    db: Session,
    payload: AttendanceBulkCreate
) -> dict:
    created = 0
    updated = 0
    errors: list[str] = []

    for entry in payload.entries:
        try:
            result = _upsert_attendance_entry(db, entry)

            if result == "created":
                created += 1
            else:
                updated += 1
        except ValueError as error:
            errors.append(str(error))

    if created or updated:
        db.commit()

    return {
        "created": created,
        "updated": updated,
        "errors": errors,
    }


def get_student_attendance_by_course(
    db: Session,
    student_id: int
) -> list[CourseAttendanceSummary]:
    enrollments = (
        db.query(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.student_id == student_id)
        .all()
    )

    summaries: list[CourseAttendanceSummary] = []

    for enrollment in enrollments:
        course = enrollment.course

        records = (
            db.query(Attendance)
            .join(
                Timetable,
                Attendance.timetable_id == Timetable.id
            )
            .filter(
                Attendance.student_id == student_id,
                Timetable.course_id == course.id,
            )
            .all()
        )

        total_classes = len(records)
        present_count = sum(
            1 for record in records
            if record.status == "Present"
        )
        absent_count = sum(
            1 for record in records
            if record.status in ("Absent", "Late")
        )

        percentage = 0.0

        if total_classes > 0:
            percentage = round(
                (present_count / total_classes) * 100,
                2
            )

        professor_name = None

        if enrollment.timetable:
            professor_name = enrollment.timetable.instructor_name
        elif course.instructor_name:
            professor_name = course.instructor_name

        summaries.append(
            CourseAttendanceSummary(
                course_id=course.id,
                course_code=course.course_code,
                course_title=course.title,
                professor_name=professor_name,
                total_classes=total_classes,
                present_count=present_count,
                absent_count=absent_count,
                attendance_percentage=percentage,
                records=[
                    CourseAttendanceRecordSummary(
                        attendance_id=record.id,
                        attendance_date=date.fromisoformat(
                            record.attendance_date
                        ),
                        status=AttendanceStatus(
                            _normalize_attendance_status(
                                record.status
                            )
                        ),
                    )
                    for record in sorted(
                        records,
                        key=lambda item: item.attendance_date,
                        reverse=True,
                    )
                ],
            )
        )

    return sorted(
        summaries,
        key=lambda item: item.course_code
    )
