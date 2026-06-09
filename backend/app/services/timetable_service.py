from datetime import time

from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.timetable import Timetable
from app.models.course import Course
from app.schemas.timetable import (
    TimetableCreate,
    TimetableUpdate,
    TimetablePut
)
from app.utils.datetime_format import parse_time_value, store_time
from app.utils.timetable_conflicts import validate_timetable_schedule


def _validate_time_range(
    start_time,
    end_time
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


def create_timetable_entry(
    db: Session,
    timetable: TimetableCreate
):
    validate_timetable_schedule(
        db,
        timetable.day_of_week,
        timetable.start_time,
        timetable.end_time,
        timetable.room_number,
        timetable.instructor_name,
        timetable.course_id
    )

    db_timetable = Timetable(
        course_id=timetable.course_id,
        day_of_week=timetable.day_of_week,
        start_time=store_time(timetable.start_time),
        end_time=store_time(timetable.end_time),
        room_number=timetable.room_number,
        instructor_name=timetable.instructor_name
    )

    db.add(db_timetable)

    db.commit()

    db.refresh(db_timetable)

    return db_timetable


def get_all_timetable_entries(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    course_id: int = None
):
    query = db.query(Timetable).filter(
        Timetable.course_id.isnot(None)
    )

    if course_id is not None:
        query = query.filter(
            Timetable.course_id == course_id
        )

    total_count = query.count()

    entries = (
        query
        .order_by(Timetable.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    section_counts = {}

    if entries:
        course_ids = {
            entry.course_id for entry in entries
        }

        for course in db.query(Course).filter(
            Course.id.in_(course_ids)
        ).all():
            section_counts[course.id] = db.query(
                Timetable
            ).filter(
                Timetable.course_id == course.id
            ).count()

    items = []

    for entry in entries:
        course = db.query(Course).filter(
            Course.id == entry.course_id
        ).first()

        if not course:
            continue

        enrollment_count = db.query(Enrollment).filter(
            Enrollment.timetable_id == entry.id
        ).count()

        section_total = section_counts.get(
            entry.course_id,
            1
        )
        section_capacity = max(
            1,
            (course.max_capacity // section_total)
            if course else 1
        )

        items.append({
            "id": entry.id,
            "course_id": entry.course_id,
            "day_of_week": entry.day_of_week,
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "room_number": entry.room_number,
            "instructor_name": entry.instructor_name,
            "enrollment_count": enrollment_count,
            "section_capacity": section_capacity,
        })

    return {
        "total_count": total_count,
        "items": items
    }


def update_timetable_entry(
    db: Session,
    timetable_id: int,
    timetable_data: TimetableUpdate
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        return None

    update_data = timetable_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        if key in {"start_time", "end_time"} and value is not None:
            value = store_time(value)

        setattr(timetable, key, value)

    validate_timetable_schedule(
        db,
        timetable.day_of_week,
        timetable.start_time,
        timetable.end_time,
        timetable.room_number,
        timetable.instructor_name,
        timetable.course_id,
        exclude_timetable_id=timetable_id
    )

    db.commit()
    db.refresh(timetable)

    return timetable


def replace_timetable_entry(
    db: Session,
    timetable_id: int,
    timetable_data: TimetablePut
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        return None

    validate_timetable_schedule(
        db,
        timetable_data.day_of_week,
        timetable_data.start_time,
        timetable_data.end_time,
        timetable_data.room_number,
        timetable_data.instructor_name,
        timetable_data.course_id,
        exclude_timetable_id=timetable_id
    )

    timetable.course_id = timetable_data.course_id
    timetable.day_of_week = timetable_data.day_of_week
    timetable.start_time = store_time(
        timetable_data.start_time
    )
    timetable.end_time = store_time(
        timetable_data.end_time
    )
    timetable.room_number = timetable_data.room_number
    timetable.instructor_name = timetable_data.instructor_name

    db.commit()
    db.refresh(timetable)

    return timetable


def delete_timetable_entry(
    db: Session,
    timetable_id: int
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id
    ).first()

    if not timetable:
        return None

    db.delete(timetable)

    db.commit()

    return {
        "message": "Timetable entry deleted successfully"
    }
