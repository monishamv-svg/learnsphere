from typing import Optional

from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.timetable import Timetable
from app.utils.datetime_format import format_time, parse_time_value
from app.utils.timetable_conflicts import times_overlap


def get_student_enrolled_timetables(
    db: Session,
    student_id: int,
    exclude_enrollment_id: int = None
) -> list:
    query = (
        db.query(Timetable)
        .join(
            Enrollment,
            Enrollment.timetable_id == Timetable.id
        )
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.timetable_id.isnot(None)
        )
    )

    if exclude_enrollment_id is not None:
        query = query.filter(
            Enrollment.id != exclude_enrollment_id
        )

    return query.all()


def check_student_schedule_conflict(
    db: Session,
    student_id: int,
    timetable_id: int,
    exclude_enrollment_id: int = None
) -> Optional[str]:
    new_slot = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not new_slot:
        return "Selected class section not found"

    new_start = parse_time_value(new_slot.start_time)
    new_end = parse_time_value(new_slot.end_time)

    for existing in get_student_enrolled_timetables(
        db,
        student_id,
        exclude_enrollment_id
    ):
        if existing.day_of_week != new_slot.day_of_week:
            continue

        existing_start = parse_time_value(
            existing.start_time
        )
        existing_end = parse_time_value(
            existing.end_time
        )

        if times_overlap(
            new_start,
            new_end,
            existing_start,
            existing_end
        ):
            return (
                "Schedule conflict with "
                f"{existing.instructor_name}'s class on "
                f"{existing.day_of_week} "
                f"{format_time(existing.start_time)}–"
                f"{format_time(existing.end_time)}"
            )

    return None
