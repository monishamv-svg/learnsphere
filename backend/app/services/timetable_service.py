from sqlalchemy.orm import Session

from app.models.timetable import Timetable
from app.schemas.timetable import (
    TimetableCreate,
    TimetableUpdate,
    TimetablePut
)


def create_timetable_entry(
    db: Session,
    timetable: TimetableCreate
):
    existing_room_booking = db.query(Timetable).filter(
        Timetable.day_of_week == timetable.day_of_week,
        Timetable.start_time == timetable.start_time,
        Timetable.room_number == timetable.room_number
    ).first()  

    if existing_room_booking:
        raise ValueError(
            "Room already booked for this time slot"
        )

    db_timetable = Timetable(
        **timetable.model_dump()
    )

    db.add(db_timetable)

    db.commit()

    db.refresh(db_timetable)

    return db_timetable


def get_all_timetable_entries(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(Timetable)\
        .offset(skip)\
        .limit(limit)\
        .all()


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
        setattr(timetable, key, value)

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

    timetable.course_id = timetable_data.course_id
    timetable.day_of_week = timetable_data.day_of_week
    timetable.start_time = timetable_data.start_time
    timetable.end_time = timetable_data.end_time
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