from datetime import time

from sqlalchemy.orm import Session

from app.models.timetable import Timetable
from app.utils.datetime_format import parse_time_value
from app.utils.timetable_schedule_policy import (
    validate_class_schedule
)


def times_overlap(
    start_a: time,
    end_a: time,
    start_b: time,
    end_b: time
) -> bool:
    return start_a < end_b and start_b < end_a


def validate_timetable_schedule(
    db: Session,
    day_of_week: str,
    start_time,
    end_time,
    room_number: str,
    instructor_name: str,
    course_id: int,
    exclude_timetable_id: int = None
):
    start = (
        start_time
        if isinstance(start_time, time)
        else parse_time_value(start_time)
    )
    end = (
        end_time
        if isinstance(end_time, time)
        else parse_time_value(end_time)
    )

    if end <= start:
        raise ValueError(
            "End time must be after start time"
        )

    policy_error = validate_class_schedule(
        day_of_week,
        start,
        end
    )

    if policy_error:
        raise ValueError(policy_error)

    query = db.query(Timetable).filter(
        Timetable.day_of_week == day_of_week
    )

    if exclude_timetable_id is not None:
        query = query.filter(
            Timetable.id != exclude_timetable_id
        )

    for existing in query.all():
        existing_start = parse_time_value(
            existing.start_time
        )
        existing_end = parse_time_value(
            existing.end_time
        )

        if not times_overlap(
            start,
            end,
            existing_start,
            existing_end
        ):
            continue

        if existing.room_number == room_number:
            raise ValueError(
                f"Room {room_number} is already booked "
                f"on {day_of_week} during this time"
            )

        if existing.instructor_name == instructor_name:
            raise ValueError(
                f"{instructor_name} is not available "
                f"on {day_of_week} during this time"
            )

        if existing.course_id == course_id:
            raise ValueError(
                "This course is already scheduled "
                "on this day during this time"
            )

    for existing in db.query(Timetable).filter(
        Timetable.course_id == course_id
    ).all():
        if (
            exclude_timetable_id is not None and
            existing.id == exclude_timetable_id
        ):
            continue

        if existing.instructor_name == instructor_name:
            raise ValueError(
                f"{instructor_name} already has a class section "
                "for this course"
            )
