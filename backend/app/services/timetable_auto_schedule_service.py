from typing import Optional

from sqlalchemy.orm import Session

from app.constants.rooms import ROOM_NUMBERS
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.timetable import Timetable
from app.utils.course_instructors import get_course_instructors
from app.utils.datetime_format import (
    format_time,
    parse_time_value,
    store_time,
)
from app.utils.timetable_schedule_policy import (
    iter_valid_day_slots,
)


def _build_time_slots() -> list:
    return [
        (day, start_time, end_time)
        for day, start_time, end_time in iter_valid_day_slots()
    ]


def _load_occupied_sets(db: Session) -> tuple:
    occupied_rooms = set()
    occupied_instructors = set()

    for entry in db.query(Timetable).all():
        occupied_rooms.add(
            (
                entry.day_of_week,
                format_time(entry.start_time),
                format_time(entry.end_time),
                entry.room_number,
            )
        )
        occupied_instructors.add(
            (
                entry.day_of_week,
                format_time(entry.start_time),
                format_time(entry.end_time),
                entry.instructor_name,
            )
        )

    return occupied_rooms, occupied_instructors


def _find_room_for_slot(
    day: str,
    start_time: str,
    end_time: str,
    instructor_name: str,
    occupied_rooms: set,
    occupied_instructors: set
) -> Optional[str]:
    instructor_key = (
        day,
        start_time,
        end_time,
        instructor_name,
    )

    if instructor_key in occupied_instructors:
        return None

    for room_number in ROOM_NUMBERS:
        room_key = (
            day,
            start_time,
            end_time,
            room_number,
        )

        if room_key not in occupied_rooms:
            return room_number

    return None


def _mark_slot_used(
    day: str,
    start_time: str,
    end_time: str,
    room_number: str,
    instructor_name: str,
    occupied_rooms: set,
    occupied_instructors: set
):
    occupied_rooms.add(
        (day, start_time, end_time, room_number)
    )
    occupied_instructors.add(
        (day, start_time, end_time, instructor_name)
    )


def _courses_query(
    db: Session,
    semester: int,
    department: Optional[str]
):
    query = db.query(Course).filter(
        Course.semester == semester
    )

    if department:
        query = query.filter(
            Course.department == department
        )

    return query.order_by(Course.id).all()


def _course_has_timetable(
    db: Session,
    course_id: int
) -> bool:
    return (
        db.query(Timetable)
        .filter(Timetable.course_id == course_id)
        .count()
        > 0
    )


def _delete_replaceable_entries(
    db: Session,
    courses: list
) -> list:
    course_ids = [course.id for course in courses]
    entries = db.query(Timetable).filter(
        Timetable.course_id.in_(course_ids)
    ).all()

    blocked = []

    for entry in entries:
        enrollment_count = db.query(Enrollment).filter(
            Enrollment.timetable_id == entry.id
        ).count()

        if enrollment_count > 0:
            course = next(
                (
                    item
                    for item in courses
                    if item.id == entry.course_id
                ),
                None
            )
            blocked.append({
                "course_code": (
                    course.course_code if course else "Unknown"
                ),
                "reason": (
                    "Cannot replace a class section "
                    "with enrolled students"
                ),
            })
            continue

        db.delete(entry)

    if blocked:
        db.rollback()
        return blocked

    db.flush()
    return []


def _try_schedule_course(
    db: Session,
    course: Course,
    time_slots: list,
    occupied_rooms: set,
    occupied_instructors: set
) -> Optional[Timetable]:
    instructor_name = get_course_instructors(course)[0]
    start_index = course.id % len(time_slots)

    for offset in range(len(time_slots)):
        day, start_time, end_time = time_slots[
            (start_index + offset) % len(time_slots)
        ]
        room_number = _find_room_for_slot(
            day,
            start_time,
            end_time,
            instructor_name,
            occupied_rooms,
            occupied_instructors
        )

        if not room_number:
            continue

        entry = Timetable(
            course_id=course.id,
            day_of_week=day,
            start_time=store_time(
                parse_time_value(start_time)
            ),
            end_time=store_time(
                parse_time_value(end_time)
            ),
            room_number=room_number,
            instructor_name=instructor_name,
        )

        db.add(entry)
        db.flush()

        _mark_slot_used(
            day,
            start_time,
            end_time,
            room_number,
            instructor_name,
            occupied_rooms,
            occupied_instructors,
        )

        return entry

    return None


def generate_semester_timetable(
    db: Session,
    semester: int,
    department: Optional[str] = None,
    mode: str = "missing_only"
) -> dict:
    courses = _courses_query(
        db,
        semester,
        department
    )

    if not courses:
        raise ValueError(
            "No courses found for the selected "
            "semester and department"
        )

    skipped_courses = []
    failed_courses = []

    if mode == "replace":
        blocked = _delete_replaceable_entries(
            db,
            courses
        )

        if blocked:
            raise ValueError(
                "Cannot replace timetable entries with "
                "active enrollments: "
                + ", ".join(
                    item["course_code"]
                    for item in blocked
                )
            )

    occupied_rooms, occupied_instructors = (
        _load_occupied_sets(db)
    )
    time_slots = _build_time_slots()

    if not time_slots:
        raise ValueError("No valid teaching slots configured")

    courses_to_schedule = []

    for course in courses:
        has_timetable = _course_has_timetable(
            db,
            course.id
        )

        if mode == "missing_only" and has_timetable:
            skipped_courses.append({
                "course_code": course.course_code,
                "reason": "Already has a timetable entry",
            })
            continue

        courses_to_schedule.append(course)

    created_entries = []

    for course in courses_to_schedule:
        entry = _try_schedule_course(
            db,
            course,
            time_slots,
            occupied_rooms,
            occupied_instructors,
        )

        if not entry:
            failed_courses.append({
                "course_code": course.course_code,
                "reason": "No conflict-free slot available",
            })
            continue

        created_entries.append({
            "id": entry.id,
            "course_id": course.id,
            "course_code": course.course_code,
            "day_of_week": entry.day_of_week,
            "start_time": format_time(entry.start_time),
            "end_time": format_time(entry.end_time),
            "room_number": entry.room_number,
            "instructor_name": entry.instructor_name,
        })

    if not created_entries and not skipped_courses:
        db.rollback()
        raise ValueError(
            "Could not auto-schedule any courses. "
            "Try a different semester or free up slots."
        )

    db.commit()

    scope = (
        f"Semester {semester}"
        + (
            f" ({department})"
            if department
            else ""
        )
    )

    if created_entries:
        message = (
            f"Auto-scheduled {len(created_entries)} weekly "
            f"class slots for {scope}."
        )
    else:
        message = (
            f"No new slots created for {scope}. "
            "All matching courses already had timetables."
        )

    return {
        "semester": semester,
        "department": department,
        "mode": mode,
        "created_count": len(created_entries),
        "skipped_count": len(skipped_courses),
        "failed_count": len(failed_courses),
        "skipped_courses": skipped_courses,
        "failed_courses": failed_courses,
        "created_entries": created_entries,
        "message": message,
    }
