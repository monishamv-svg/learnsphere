from collections import defaultdict
from typing import Optional

from sqlalchemy.orm import Session

from app.constants.departments import DEPARTMENTS
from app.models.course import Course
from app.models.timetable import Timetable
from app.utils.datetime_format import format_time

DAY_ORDER = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
}


def _serialize_entry(
    timetable: Timetable,
    course: Course
) -> dict:
    return {
        "id": timetable.id,
        "course_id": course.id,
        "course_code": course.course_code,
        "course_title": course.title,
        "department": course.department,
        "day_of_week": timetable.day_of_week,
        "start_time": format_time(
            timetable.start_time
        ),
        "end_time": format_time(
            timetable.end_time
        ),
        "room_number": timetable.room_number,
        "instructor_name": timetable.instructor_name,
    }


def _sort_entries(entries: list) -> list:
    return sorted(
        entries,
        key=lambda entry: (
            DAY_ORDER.get(entry["day_of_week"], 99),
            entry["department"],
            entry["start_time"],
            entry["course_code"],
        )
    )


def list_semester_schedules(
    db: Session,
    department: Optional[str] = None
) -> dict:
    query = (
        db.query(Timetable, Course)
        .join(Course, Timetable.course_id == Course.id)
    )

    if department:
        query = query.filter(
            Course.department == department
        )

    semester_stats = {
        semester: {
            "entry_count": 0,
            "course_ids": set(),
            "departments": defaultdict(
                lambda: {
                    "entry_count": 0,
                    "course_ids": set(),
                }
            ),
        }
        for semester in range(1, 9)
    }

    for timetable, course in query.all():
        semester = course.semester
        stats = semester_stats[semester]
        stats["entry_count"] += 1
        stats["course_ids"].add(course.id)

        dept_stats = stats["departments"][course.department]
        dept_stats["entry_count"] += 1
        dept_stats["course_ids"].add(course.id)

    schedules = []

    for semester in range(1, 9):
        stats = semester_stats[semester]
        department_summaries = []

        for dept_name in DEPARTMENTS:
            dept_stats = stats["departments"].get(dept_name)

            if not dept_stats or dept_stats["entry_count"] == 0:
                continue

            department_summaries.append({
                "department": dept_name,
                "entry_count": dept_stats["entry_count"],
                "course_count": len(
                    dept_stats["course_ids"]
                ),
            })

        schedules.append({
            "semester": semester,
            "entry_count": stats["entry_count"],
            "course_count": len(stats["course_ids"]),
            "departments": department_summaries,
        })

    return {"schedules": schedules}


def get_semester_schedule(
    db: Session,
    semester: int,
    department: Optional[str] = None
) -> dict:
    query = (
        db.query(Timetable, Course)
        .join(Course, Timetable.course_id == Course.id)
        .filter(Course.semester == semester)
    )

    if department:
        query = query.filter(
            Course.department == department
        )

    grouped = defaultdict(list)
    course_ids = set()

    for timetable, course in query.all():
        entry = _serialize_entry(timetable, course)
        grouped[course.department].append(entry)
        course_ids.add(course.id)

    department_groups = []

    for dept_name in DEPARTMENTS:
        entries = grouped.get(dept_name, [])

        if not entries:
            continue

        department_groups.append({
            "department": dept_name,
            "entry_count": len(entries),
            "entries": _sort_entries(entries),
        })

    total_entries = sum(
        group["entry_count"]
        for group in department_groups
    )

    return {
        "semester": semester,
        "total_entries": total_entries,
        "total_courses": len(course_ids),
        "department_groups": department_groups,
    }
