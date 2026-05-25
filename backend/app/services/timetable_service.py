from sqlalchemy.orm import Session

from app.models.timetable import Timetable
from app.schemas.timetable import TimetableCreate


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


def get_all_timetable_entries(db: Session):
    return db.query(Timetable).all()