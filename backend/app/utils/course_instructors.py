from typing import Optional


def parse_instructor_names(
    instructor_name: Optional[str],
    additional_instructors: Optional[str] = None
) -> list:
    instructors: list = []

    if instructor_name and instructor_name.strip():
        instructors.append(instructor_name.strip())

    if additional_instructors:
        for name in additional_instructors.split(","):
            cleaned = name.strip()

            if cleaned and cleaned not in instructors:
                instructors.append(cleaned)

    return instructors or ["TBD"]


def get_course_instructors(course) -> list:
    return parse_instructor_names(
        course.instructor_name,
        course.additional_instructors
    )
