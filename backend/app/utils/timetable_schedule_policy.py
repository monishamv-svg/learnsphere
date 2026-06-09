from datetime import time
from typing import Optional

from app.utils.datetime_format import parse_time_value

TIMETABLE_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]

MORNING_BREAK = (time(10, 30), time(11, 0))
LUNCH_BREAK = (time(13, 0), time(14, 0))
EARLIEST_START = time(8, 0)
WEEKDAY_LATEST_END = time(17, 0)
SATURDAY_LATEST_END = time(13, 0)

WEEKDAY_CLASS_SLOTS = [
    ("08:00", "09:00"),
    ("09:00", "10:00"),
    ("11:00", "12:00"),
    ("12:00", "13:00"),
    ("14:00", "15:00"),
    ("15:00", "16:00"),
    ("16:00", "17:00"),
]

SATURDAY_CLASS_SLOTS = [
    ("08:00", "09:00"),
    ("09:00", "10:00"),
    ("11:00", "12:00"),
    ("12:00", "13:00"),
]


def _parse_time(value) -> time:
    if isinstance(value, time):
        return value

    return parse_time_value(value)


def _times_overlap(
    start_a: time,
    end_a: time,
    start_b: time,
    end_b: time
) -> bool:
    return start_a < end_b and start_b < end_a


def get_class_slots_for_day(day_of_week: str) -> list:
    if day_of_week == "Saturday":
        return SATURDAY_CLASS_SLOTS

    if day_of_week in TIMETABLE_DAYS:
        return WEEKDAY_CLASS_SLOTS

    return []


def validate_class_schedule(
    day_of_week: str,
    start_time,
    end_time
) -> Optional[str]:
    if not day_of_week or not start_time or not end_time:
        return None

    if day_of_week == "Sunday":
        return "Classes cannot be scheduled on Sunday"

    if day_of_week not in TIMETABLE_DAYS:
        return (
            f"{day_of_week} is not a valid teaching day"
        )

    start = _parse_time(start_time)
    end = _parse_time(end_time)

    if end <= start:
        return "End time must be after start time"

    if start < EARLIEST_START:
        return "Classes cannot start before 8:00 AM"

    if day_of_week == "Saturday":
        if end > SATURDAY_LATEST_END:
            return (
                "Classes cannot run after 1:00 PM on Saturday"
            )
    elif end > WEEKDAY_LATEST_END:
        return (
            "Classes cannot run after 5:00 PM on weekdays"
        )

    if _times_overlap(
        start,
        end,
        MORNING_BREAK[0],
        MORNING_BREAK[1]
    ):
        return (
            "Classes cannot be scheduled during the morning "
            "break (10:30 AM – 11:00 AM)"
        )

    if _times_overlap(
        start,
        end,
        LUNCH_BREAK[0],
        LUNCH_BREAK[1]
    ):
        return (
            "Classes cannot be scheduled during the lunch "
            "break (1:00 PM – 2:00 PM)"
        )

    return None


def iter_valid_day_slots():
    for day in TIMETABLE_DAYS:
        for start_time, end_time in get_class_slots_for_day(day):
            yield day, start_time, end_time
