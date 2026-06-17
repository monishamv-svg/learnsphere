from datetime import date, time, timedelta
from collections import Counter
from itertools import cycle

from app.constants.departments import DEPARTMENTS
from app.db.session import SessionLocal

from app.models.user import User
from app.models.student import Student
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.timetable import Timetable
from app.models.attendance import Attendance

from app.utils.security import hash_password
from app.utils.datetime_format import store_date, store_time
from app.utils.course_instructors import get_course_instructors
from app.utils.timetable_schedule_policy import (
    TIMETABLE_DAYS as SCHEDULE_DAYS,
    SATURDAY_CLASS_SLOTS,
    iter_valid_day_slots,
    get_class_slots_for_day,
)


ADMIN_EMAIL = "admin@learnsphere.com"
ADMIN_PASSWORD = "Admin123"
STUDENT_PASSWORD = "student123"

DEPARTMENT_PREFIX = {
    DEPARTMENTS[0]: "CSE",
    DEPARTMENTS[1]: "ISE",
    DEPARTMENTS[2]: "MEC",
    DEPARTMENTS[3]: "EEE",
    DEPARTMENTS[4]: "CIV",
    DEPARTMENTS[5]: "AER",
}

DEPARTMENT_SUBJECT = {
    DEPARTMENTS[0]: "Computer Science",
    DEPARTMENTS[1]: "Information Science",
    DEPARTMENTS[2]: "Mechanical Engineering",
    DEPARTMENTS[3]: "Electrical Engineering",
    DEPARTMENTS[4]: "Civil Engineering",
    DEPARTMENTS[5]: "Aeronautical Engineering",
}

CORE_COURSE_BLUEPRINT = [
    ("{subject} Fundamentals", 4),
    ("Engineering Mathematics {sem}", 4),
    ("Engineering Sciences {sem}", 4),
    ("Technical Communication", 3),
    ("Laboratory Practice {sem}", 3),
    ("Design and Modeling {sem}", 3),
    ("Professional Skills Development", 3),
    ("Department Seminar", 1),
]

ELECTIVE_TOPICS = [
    "Introduction to Robotics",
    "Environmental Studies",
    "Entrepreneurship and Innovation",
    "Indian Constitution and Ethics",
    "Foreign Language Studies",
    "Photography and Visual Design",
    "Sports and Wellness",
    "Cyber Security Awareness",
    "Creative Problem Solving",
    "Sustainable Development",
    "Public Speaking",
    "Artificial Intelligence Awareness",
    "Financial Literacy",
    "Human Rights and Duties",
    "Digital Marketing Basics",
    "Mindfulness and Stress Management",
    "Cloud Computing Overview",
    "Data Analytics for Everyone",
    "Renewable Energy Systems",
    "Aerospace History and Technology",
    "Structural Design Basics",
    "Embedded Systems Overview",
    "Machine Learning Applications",
    "Urban Planning Fundamentals",
]

INSTRUCTORS = [
    "Dr. Priya Sharma",
    "Prof. Rajesh Kumar",
    "Dr. Ananya Iyer",
    "Prof. Vikram Singh",
    "Dr. Meera Nambiar",
    "Prof. Arjun Desai",
    "Dr. Kavitha Menon",
    "Prof. Sanjay Patel",
    "Dr. Lakshmi Reddy",
    "Prof. Rohit Gupta",
    "Prof. Deepa Iyer",
    "Dr. Suresh Menon",
    "Prof. Neha Kapoor",
]

ROOM_NUMBERS = [f"R{number}" for number in range(101, 121)]

STUDENT_FIRST_NAMES = [
    "Rahul", "Priya", "Arjun", "Ananya", "Vikram", "Meera",
    "Sanjay", "Kavitha", "Rohan", "Neha", "Aditya", "Divya",
    "Karan", "Isha", "Nikhil", "Pooja", "Varun", "Sneha",
    "Amit", "Lakshmi", "Harish", "Deepa", "Manoj", "Swathi",
    "Gaurav", "Ritu", "Suresh", "Anjali", "Pranav", "Kavya",
    "Yash", "Shreya", "Akash", "Nandini", "Ravi", "Tanvi",
    "Kunal", "Aishwarya", "Dev", "Sonia", "Harsh", "Preeti",
    "Vivek", "Madhuri", "Siddharth", "Geeta", "Tarun", "Revathi",
]

STUDENT_LAST_NAMES = [
    "Sharma", "Nair", "Patel", "Iyer", "Singh", "Menon",
    "Desai", "Kumar", "Reddy", "Gupta", "Joshi", "Rao",
    "Pillai", "Verma", "Mehta", "Khan", "Chopra", "Bhat",
    "Malhotra", "Shetty", "Agarwal", "Nambiar", "Das", "Krishnan",
]

WEEKDAY_INDEX = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}

STUDENTS_PER_DEPARTMENT_SEMESTER = 20

ATTENDANCE_STUDENTS_PER_DEPARTMENT_SEMESTER = 3
ATTENDANCE_COURSES_PER_STUDENT = 2
ATTENDANCE_DATES_PER_CLASS = 2
ATTENDANCE_STATUSES = [
    "Present",
    "Present",
    "Present",
    "Absent",
]


def parse_hhmm(value):
    hour, minute = value.split(":")
    return time(int(hour), int(minute))


def clear_course_related_data(db):
    attendance_deleted = db.query(Attendance).delete()
    enrollment_deleted = db.query(Enrollment).delete()
    timetable_deleted = db.query(Timetable).delete()
    course_deleted = db.query(Course).delete()

    db.commit()

    print(
        "Cleared course-related data: "
        f"{attendance_deleted} attendance, "
        f"{timetable_deleted} timetables, "
        f"{enrollment_deleted} enrollments, "
        f"{course_deleted} courses"
    )


def clear_student_and_scheduling_data(db):
    attendance_deleted = db.query(Attendance).delete()
    enrollment_deleted = db.query(Enrollment).delete()
    timetable_deleted = db.query(Timetable).delete()

    student_user_ids = [
        student.user_id
        for student in db.query(Student).all()
    ]

    student_deleted = db.query(Student).delete()

    user_deleted = 0
    if student_user_ids:
        user_deleted = db.query(User).filter(
            User.id.in_(student_user_ids)
        ).delete(synchronize_session=False)

    db.commit()

    print(
        "Cleared student/scheduling data: "
        f"{attendance_deleted} attendance, "
        f"{timetable_deleted} timetables, "
        f"{enrollment_deleted} enrollments, "
        f"{student_deleted} students, "
        f"{user_deleted} student users"
    )


def build_core_courses():
    courses = []
    instructor_pool = cycle(INSTRUCTORS)

    for semester in range(1, 9):
        for department in DEPARTMENTS:
            prefix = DEPARTMENT_PREFIX[department]
            subject = DEPARTMENT_SUBJECT[department]

            for index, (title_template, credits) in enumerate(
                CORE_COURSE_BLUEPRINT,
                start=1
            ):
                title = title_template.format(
                    subject=subject,
                    sem=semester
                )
                course_code = f"{prefix}{semester}{index:02d}"

                primary_instructor = next(instructor_pool)
                additional_instructors = None

                if index % 4 == 0:
                    co_instructor = next(instructor_pool)

                    if co_instructor != primary_instructor:
                        additional_instructors = co_instructor

                courses.append({
                    "course_code": course_code,
                    "title": title,
                    "description": (
                        f"Core course for {department}, "
                        f"semester {semester}."
                    ),
                    "credits": credits,
                    "semester": semester,
                    "department": department,
                    "instructor_name": primary_instructor,
                    "additional_instructors": additional_instructors,
                    "max_capacity": 60,
                    "is_elective": False,
                })

    return courses


def build_elective_courses():
    courses = []
    instructor_pool = cycle(INSTRUCTORS)

    for semester in range(1, 9):
        for elective_index in range(3):
            department = DEPARTMENTS[
                (semester + elective_index * 2) % len(DEPARTMENTS)
            ]
            topic = ELECTIVE_TOPICS[
                ((semester - 1) * 3 + elective_index)
                % len(ELECTIVE_TOPICS)
            ]
            elective_label = chr(ord("A") + elective_index)
            course_code = f"ELC{semester}{elective_label}"

            primary_instructor = next(instructor_pool)
            additional_instructors = None

            if elective_index == 0:
                co_instructor = next(instructor_pool)

                if co_instructor != primary_instructor:
                    additional_instructors = co_instructor

            courses.append({
                "course_code": course_code,
                "title": topic,
                "description": (
                    f"Elective course for semester {semester}."
                ),
                "credits": 3,
                "semester": semester,
                "department": department,
                "instructor_name": primary_instructor,
                "additional_instructors": additional_instructors,
                "max_capacity": 45,
                "is_elective": True,
            })

    return courses


def seed_courses(db):
    core_courses = build_core_courses()
    elective_courses = build_elective_courses()
    courses_data = core_courses + elective_courses

    db.add_all(Course(**course_data) for course_data in courses_data)
    db.commit()

    print(
        f"Seeded {len(courses_data)} courses "
        f"({len(core_courses)} core + {len(elective_courses)} electives)"
    )


def backfill_additional_instructors(db):
    expected_by_code = {
        course_data["course_code"]: course_data
        for course_data in (
            build_core_courses() + build_elective_courses()
        )
    }

    instructor_load = Counter()

    for course in db.query(Course).all():
        instructor_load[course.instructor_name] += 1

    updated = 0

    for course in db.query(Course).order_by(Course.id).all():
        expected = expected_by_code.get(course.course_code)
        should_have_co = bool(
            expected and expected.get("additional_instructors")
        )

        if not should_have_co:
            if course.additional_instructors is not None:
                course.additional_instructors = None
                updated += 1
            continue

        candidates = [
            instructor
            for instructor in INSTRUCTORS
            if instructor != course.instructor_name
        ]
        co_instructor = min(
            candidates,
            key=lambda name: instructor_load[name]
        )

        if course.additional_instructors != co_instructor:
            course.additional_instructors = co_instructor
            updated += 1

        instructor_load[co_instructor] += 1

    db.commit()

    with_co = db.query(Course).filter(
        Course.additional_instructors.isnot(None),
        Course.additional_instructors != ""
    ).count()

    print(
        f"Backfilled additional instructors on {updated} courses "
        f"({with_co} courses now have a co-instructor)"
    )


def build_student_records():
    students = []
    name_index = 0

    for semester in range(1, 9):
        for department in DEPARTMENTS:
            prefix = DEPARTMENT_PREFIX[department].lower()
            dept_code = DEPARTMENT_PREFIX[department]

            for student_index in range(STUDENTS_PER_DEPARTMENT_SEMESTER):
                first_name = STUDENT_FIRST_NAMES[
                    name_index % len(STUDENT_FIRST_NAMES)
                ]
                last_name = STUDENT_LAST_NAMES[
                    name_index % len(STUDENT_LAST_NAMES)
                ]
                dept_index = DEPARTMENTS.index(department) + 1
                phone_suffix = (
                    f"{dept_index}{semester}{name_index:04d}"
                )
                phone_number = f"9{phone_suffix:0>9}"[:10]
                roster_number = student_index + 1

                student_data = {
                    "full_name": f"{first_name} {last_name}",
                    "email": (
                        f"{prefix}.s{semester}.n{roster_number:02d}"
                        f"@learnsphere.com"
                    ),
                    "student_code": (
                        f"{dept_code}{semester:02d}{roster_number:03d}"
                    ),
                    "department": department,
                    "semester": semester,
                    "phone_number": phone_number,
                }

                students.append(student_data)
                name_index += 1

    return students


def seed_students(db):
    students_data = build_student_records()
    password_hash = hash_password(STUDENT_PASSWORD)

    for student_data in students_data:
        user = User(
            full_name=student_data["full_name"],
            email=student_data["email"],
            password_hash=password_hash,
            role="student"
        )

        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            student_code=student_data["student_code"],
            department=student_data["department"],
            semester=student_data["semester"],
            phone_number=student_data["phone_number"]
        )

        db.add(student)

    db.commit()

    print(f"Seeded {len(students_data)} students")


def get_semester_electives(db, semester):
    return (
        db.query(Course)
        .filter(
            Course.semester == semester,
            Course.is_elective.is_(True)
        )
        .order_by(Course.course_code)
        .all()
    )


def get_elective_for_department(db, department, semester):
    electives = get_semester_electives(db, semester)

    if not electives:
        return None

    department_index = DEPARTMENTS.index(department)
    return electives[department_index % len(electives)]


def get_enrollment_plan_courses(db, department, semester):
    core_courses = (
        db.query(Course)
        .filter(
            Course.department == department,
            Course.semester == semester,
            Course.is_elective.is_(False)
        )
        .order_by(Course.course_code)
        .limit(6)
        .all()
    )

    elective = get_elective_for_department(db, department, semester)

    if len(core_courses) < 6 or not elective:
        raise ValueError(
            f"Missing enrollment plan courses for "
            f"{department}, semester {semester}"
        )

    return core_courses + [elective]


def get_student_enrollment_plan(db, student):
    selected_courses = get_enrollment_plan_courses(
        db,
        student.department,
        student.semester
    )
    total_credits = sum(
        course.credits for course in selected_courses
    )

    if total_credits != 24:
        raise ValueError(
            f"Enrollment plan for {student.student_code} "
            f"totals {total_credits} credits, expected 24"
        )

    return selected_courses


def seed_enrollments(db):
    students = db.query(Student).all()
    enrollments = []

    for student in students:
        for course in get_student_enrollment_plan(db, student):
            enrollments.append(Enrollment(
                student_id=student.id,
                course_id=course.id
            ))

    db.add_all(enrollments)
    db.commit()

    print(
        f"Seeded {len(enrollments)} enrollments "
        f"({len(enrollments) // len(students)} courses per student, "
        f"24 credits each)"
    )


def rebalance_primary_instructors(db):
    courses = (
        db.query(Course)
        .order_by(Course.id)
        .all()
    )
    instructor_cycle = cycle(INSTRUCTORS)

    for course in courses:
        course.instructor_name = next(instructor_cycle)

    db.commit()

    print(
        f"Rebalanced primary instructors on {len(courses)} courses "
        f"across {len(INSTRUCTORS)} faculty"
    )


def rebalance_course_instructors(db):
    courses = (
        db.query(Course)
        .order_by(Course.id)
        .all()
    )
    instructor_cycle = cycle(INSTRUCTORS)

    for course in courses:
        primary = next(instructor_cycle)
        co_instructor = next(instructor_cycle)

        if co_instructor == primary:
            co_instructor = next(instructor_cycle)

        course.instructor_name = primary
        course.additional_instructors = co_instructor

    db.commit()

    print(
        f"Rebalanced instructors on {len(courses)} courses "
        f"across {len(INSTRUCTORS)} faculty"
    )


def iter_timetable_slots():
    for day, start_time, end_time in iter_valid_day_slots():
        for room_number in ROOM_NUMBERS:
            yield day, start_time, end_time, room_number


def build_time_slots():
    return list(iter_valid_day_slots())


def build_plan_core_slot_catalog():
    return [
        (day, start_time, end_time)
        for day in SCHEDULE_DAYS
        if day != "Saturday"
        for start_time, end_time in get_class_slots_for_day(day)
    ]


def get_plan_core_slots_for_group(group_index):
    catalog = build_plan_core_slot_catalog()
    start_index = (group_index * 6) % len(catalog)

    return [
        catalog[(start_index + offset) % len(catalog)]
        for offset in range(6)
    ]


def build_plan_elective_slot_catalog():
    return [
        ("Saturday", start_time, end_time)
        for start_time, end_time in SATURDAY_CLASS_SLOTS
    ]


def _reserve_plan_course_slot(
    timetables,
    course,
    instructor_name,
    slot_catalog,
    catalog_index,
    occupied_rooms,
    occupied_instructors
):
    for attempt in range(len(slot_catalog)):
        day, start_time, end_time = slot_catalog[
            (catalog_index + attempt) % len(slot_catalog)
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

        _place_timetable_entry(
            timetables,
            course,
            instructor_name,
            day,
            start_time,
            end_time,
            room_number,
            occupied_rooms,
            occupied_instructors
        )

        return (catalog_index + attempt + 1) % len(slot_catalog)

    return None


def _find_room_for_slot(
    day,
    start_time,
    end_time,
    instructor_name,
    occupied_rooms,
    occupied_instructors
):
    instructor_key = (
        day,
        start_time,
        end_time,
        instructor_name
    )

    if instructor_key in occupied_instructors:
        return None

    for room_number in ROOM_NUMBERS:
        room_key = (
            day,
            start_time,
            end_time,
            room_number
        )

        if room_key not in occupied_rooms:
            return room_number

    return None


def _mark_slot_used(
    day,
    start_time,
    end_time,
    room_number,
    instructor_name,
    occupied_rooms,
    occupied_instructors
):
    occupied_rooms.add(
        (day, start_time, end_time, room_number)
    )
    occupied_instructors.add(
        (day, start_time, end_time, instructor_name)
    )


def _place_timetable_entry(
    timetables,
    course,
    instructor_name,
    day,
    start_time,
    end_time,
    room_number,
    occupied_rooms,
    occupied_instructors
):
    _mark_slot_used(
        day,
        start_time,
        end_time,
        room_number,
        instructor_name,
        occupied_rooms,
        occupied_instructors
    )

    timetables.append(Timetable(
        course_id=course.id,
        day_of_week=day,
        start_time=store_time(parse_hhmm(start_time)),
        end_time=store_time(parse_hhmm(end_time)),
        room_number=room_number,
        instructor_name=instructor_name,
    ))


def _try_place_instructor(
    timetables,
    course,
    instructor_name,
    occupied_rooms,
    occupied_instructors,
    instructor_slot_index,
    time_slots,
    preferred_slot=None
):
    attempts = []

    if preferred_slot is not None:
        attempts.append(preferred_slot)

    start_idx = instructor_slot_index.get(
        instructor_name,
        0
    )

    for offset in range(len(time_slots)):
        attempts.append(
            time_slots[
                (start_idx + offset) % len(time_slots)
            ]
        )

    seen = set()

    for day, start_time, end_time in attempts:
        slot_key = (day, start_time, end_time)

        if slot_key in seen:
            continue

        seen.add(slot_key)

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

        _place_timetable_entry(
            timetables,
            course,
            instructor_name,
            day,
            start_time,
            end_time,
            room_number,
            occupied_rooms,
            occupied_instructors
        )

        if preferred_slot is None:
            for index, slot in enumerate(time_slots):
                if slot == (day, start_time, end_time):
                    instructor_slot_index[instructor_name] = (
                        index + 1
                    ) % len(time_slots)
                    break

        return True

    return False


def verify_enrollment_plan_schedules(db):
    from itertools import product
    from app.utils.timetable_conflicts import times_overlap
    from app.utils.datetime_format import parse_time_value

    failures = []

    for semester in range(1, 9):
        for department in DEPARTMENTS:
            courses = get_enrollment_plan_courses(
                db,
                department,
                semester
            )
            sections_lists = []

            for course in courses:
                sections = (
                    db.query(Timetable)
                    .filter(Timetable.course_id == course.id)
                    .all()
                )

                if not sections:
                    failures.append(
                        f"{department} sem {semester}: "
                        f"{course.course_code} has no section"
                    )
                    sections_lists = None
                    break

                sections_lists.append(sections)

            if sections_lists is None:
                continue

            has_conflict_free = False

            for combo in product(*sections_lists):
                clash = False

                for index, left in enumerate(combo):
                    for right in combo[index + 1:]:
                        if left.day_of_week != right.day_of_week:
                            continue

                        if times_overlap(
                            parse_time_value(left.start_time),
                            parse_time_value(left.end_time),
                            parse_time_value(right.start_time),
                            parse_time_value(right.end_time)
                        ):
                            clash = True
                            break

                    if clash:
                        break

                if not clash:
                    has_conflict_free = True
                    break

            if not has_conflict_free:
                codes = ", ".join(
                    course.course_code for course in courses
                )
                failures.append(
                    f"{department} sem {semester}: "
                    f"no conflict-free schedule ({codes})"
                )

    if failures:
        raise ValueError(
            "Enrollment plan timetable verification failed:\n"
            + "\n".join(failures)
        )

    print(
        "Verified conflict-free 24-credit schedules for all "
        f"{8 * len(DEPARTMENTS)} department-semester plans"
    )


def seed_timetables(db):
    courses = (
        db.query(Course)
        .order_by(Course.id)
        .all()
    )

    occupied_rooms = set()
    occupied_instructors = set()
    instructor_slot_index = {}
    time_slots = build_time_slots()
    timetables = []
    plan_course_ids = set()
    plan_primary_scheduled = set()
    plan_courses_pinned = set()
    elective_slot_catalog = build_plan_elective_slot_catalog()
    elective_catalog_index = 0
    group_index = 0

    for semester in range(1, 9):
        for department in DEPARTMENTS:
            plan_courses = get_enrollment_plan_courses(
                db,
                department,
                semester
            )
            core_slots = get_plan_core_slots_for_group(
                group_index
            )

            for index, course in enumerate(plan_courses):
                plan_course_ids.add(course.id)

                if course.id in plan_courses_pinned:
                    continue

                primary_instructor = get_course_instructors(
                    course
                )[0]

                if index < 6:
                    day, start_time, end_time = core_slots[index]
                    room_number = _find_room_for_slot(
                        day,
                        start_time,
                        end_time,
                        primary_instructor,
                        occupied_rooms,
                        occupied_instructors
                    )

                    if not room_number:
                        next_index = _reserve_plan_course_slot(
                            timetables,
                            course,
                            primary_instructor,
                            build_plan_core_slot_catalog(),
                            group_index * 6 + index,
                            occupied_rooms,
                            occupied_instructors
                        )

                        if next_index is None:
                            raise ValueError(
                                "Could not reserve core plan slot "
                                f"for {course.course_code} "
                                f"({department}, sem {semester})"
                            )
                    else:
                        _place_timetable_entry(
                            timetables,
                            course,
                            primary_instructor,
                            day,
                            start_time,
                            end_time,
                            room_number,
                            occupied_rooms,
                            occupied_instructors
                        )

                    slot_label = "core"
                else:
                    next_index = _reserve_plan_course_slot(
                        timetables,
                        course,
                        primary_instructor,
                        elective_slot_catalog,
                        elective_catalog_index,
                        occupied_rooms,
                        occupied_instructors
                    )
                    slot_label = "elective"

                    if next_index is None:
                        raise ValueError(
                            f"Could not reserve {slot_label} plan slot "
                            f"for {course.course_code} "
                            f"({department}, sem {semester})"
                        )

                    elective_catalog_index = next_index

                plan_primary_scheduled.add(
                    (course.id, primary_instructor)
                )
                plan_courses_pinned.add(course.id)

            group_index += 1

    courses_to_schedule = sorted(
        courses,
        key=lambda course: (
            -len(get_course_instructors(course)),
            course.id
        )
    )

    for course in courses_to_schedule:
        instructors = get_course_instructors(course)

        for instructor_name in instructors:
            if instructor_name != instructors[0]:
                continue

            if (course.id, instructor_name) in plan_primary_scheduled:
                continue

            placed = _try_place_instructor(
                timetables,
                course,
                instructor_name,
                occupied_rooms,
                occupied_instructors,
                instructor_slot_index,
                time_slots
            )

            if not placed:
                raise ValueError(
                    f"Could not schedule {course.course_code} "
                    f"for {instructor_name} without conflicts"
                )

    db.add_all(timetables)
    db.commit()

    multi_section_courses = sum(
        1
        for course in courses
        if len(get_course_instructors(course)) > 1
    )

    print(
        f"Seeded {len(timetables)} conflict-free timetable entries "
        f"({multi_section_courses} courses with multiple sections, "
        f"{len(plan_course_ids)} plan courses pinned)"
    )

    verify_enrollment_plan_schedules(db)


def backfill_enrollment_timetables(db):
    updated = 0

    for enrollment in db.query(Enrollment).all():
        if enrollment.timetable_id is not None:
            continue

        timetable = db.query(Timetable).filter(
            Timetable.course_id == enrollment.course_id
        ).order_by(Timetable.id).first()

        if timetable:
            enrollment.timetable_id = timetable.id
            updated += 1

    if updated:
        db.commit()
        print(
            f"Backfilled timetable_id on {updated} enrollments"
        )


def reseed_timetables(db):
    deleted = db.query(Timetable).delete()
    db.commit()
    print(f"Cleared {deleted} timetable entries")

    db.query(Enrollment).update(
        {Enrollment.timetable_id: None},
        synchronize_session=False
    )
    db.commit()

    backfill_additional_instructors(db)
    rebalance_primary_instructors(db)
    seed_timetables(db)
    backfill_enrollment_timetables(db)


def recent_dates_for_weekday(day_name, count=2):
    target = WEEKDAY_INDEX[day_name]
    dates = []
    current = date.today()

    for _ in range(366):
        if current.weekday() == target:
            dates.append(current)

            if len(dates) >= count:
                break

        current -= timedelta(days=1)

    return dates


def seed_attendance(db):
    students = []
    seen_student_ids = set()

    for semester in range(1, 9):
        for department in DEPARTMENTS:
            cohort = (
                db.query(Student)
                .filter(
                    Student.department == department,
                    Student.semester == semester,
                )
                .order_by(Student.student_code)
                .limit(
                    ATTENDANCE_STUDENTS_PER_DEPARTMENT_SEMESTER
                )
                .all()
            )

            for student in cohort:
                if student.id in seen_student_ids:
                    continue

                seen_student_ids.add(student.id)
                students.append(student)

    if not students:
        print("Skipped attendance seed (no students found)")
        return

    student_ids = [student.id for student in students]

    timetables_by_id = {
        timetable.id: timetable
        for timetable in db.query(Timetable).all()
    }

    enrollments_by_student = {}

    for row in db.query(Enrollment).filter(
        Enrollment.student_id.in_(student_ids)
    ).all():
        enrollments_by_student.setdefault(
            row.student_id,
            []
        ).append(row)

    records = []
    seen = set()
    status_pool = cycle(ATTENDANCE_STATUSES)

    for student in students:
        student_timetables = []

        for enrollment in enrollments_by_student.get(
            student.id,
            []
        ):
            if enrollment.timetable_id:
                timetable = timetables_by_id.get(
                    enrollment.timetable_id
                )

                if timetable:
                    student_timetables.append(timetable)

            if (
                len(student_timetables) >=
                ATTENDANCE_COURSES_PER_STUDENT
            ):
                break

        student_timetables = student_timetables[
            :ATTENDANCE_COURSES_PER_STUDENT
        ]

        for timetable in student_timetables:
            class_dates = recent_dates_for_weekday(
                timetable.day_of_week,
                count=ATTENDANCE_DATES_PER_CLASS
            )

            for class_date in class_dates:
                record_key = (
                    student.id,
                    timetable.id,
                    store_date(class_date)
                )

                if record_key in seen:
                    continue

                seen.add(record_key)
                records.append(Attendance(
                    student_id=student.id,
                    timetable_id=timetable.id,
                    attendance_date=store_date(class_date),
                    status=next(status_pool),
                ))

    if not records:
        print("Skipped attendance seed (no valid records)")
        return

    db.add_all(records)
    db.commit()

    print(
        f"Seeded {len(records)} attendance records "
        f"for {len(students)} students"
    )


def reseed_attendance(db):
    deleted = db.query(Attendance).delete()
    db.commit()
    print(f"Cleared {deleted} attendance records")
    seed_attendance(db)


def seed_admin(db):
    existing_admin = db.query(User).filter(
        User.email == ADMIN_EMAIL
    ).first()

    if existing_admin:
        return

    admin_user = User(
        full_name="LearnSphere Admin",
        email=ADMIN_EMAIL,
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin"
    )

    db.add(admin_user)
    db.commit()

    print("Admin user created")


def sync_seed_passwords(db):
    admin = db.query(User).filter(
        User.email == ADMIN_EMAIL
    ).first()

    if admin:
        admin.password_hash = hash_password(ADMIN_PASSWORD)

    student_hash = hash_password(STUDENT_PASSWORD)

    for user in db.query(User).filter(User.role == "student").all():
        user.password_hash = student_hash

    db.commit()

    print("Passwords synced for admin and all students")


def main(
    reseed_courses=False,
    reseed_timetables_only=False,
    reseed_attendance_only=False
):
    db = SessionLocal()

    try:
        seed_admin(db)

        if reseed_attendance_only:
            reseed_attendance(db)
            sync_seed_passwords(db)
            print("Attendance reseeded successfully")
            return

        if reseed_timetables_only:
            reseed_timetables(db)
            sync_seed_passwords(db)
            print("Timetables reseeded successfully")
            return

        if reseed_courses:
            clear_course_related_data(db)
            seed_courses(db)
            clear_student_and_scheduling_data(db)
        else:
            clear_student_and_scheduling_data(db)
            if db.query(Course).count() == 0:
                seed_courses(db)
            else:
                backfill_additional_instructors(db)

        seed_students(db)
        seed_enrollments(db)
        try:
            seed_timetables(db)
        except ValueError as exc:
            print(f"Warning: {exc}")
            print("Continuing with enrollment backfill and attendance seed...")
        backfill_enrollment_timetables(db)
        seed_attendance(db)
        sync_seed_passwords(db)

        print("Seed data inserted successfully")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    reseed = "--reseed-courses" in sys.argv
    reseed_timetables_flag = "--reseed-timetables" in sys.argv
    reseed_attendance_flag = "--reseed-attendance" in sys.argv
    main(
        reseed_courses=reseed,
        reseed_timetables_only=reseed_timetables_flag,
        reseed_attendance_only=reseed_attendance_flag
    )
