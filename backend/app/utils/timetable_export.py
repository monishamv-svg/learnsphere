from datetime import date, datetime, time, timedelta
from io import BytesIO

from app.utils.datetime_format import parse_time_value

DAY_TO_WEEKDAY = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
}

DAY_TO_ICS = {
    "Monday": "MO",
    "Tuesday": "TU",
    "Wednesday": "WE",
    "Thursday": "TH",
    "Friday": "FR",
    "Saturday": "SA",
}


def _ics_escape(value: str) -> str:
    return (
        value
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _ics_format_datetime(
    event_date: date,
    clock: time
) -> str:
    return datetime.combine(
        event_date,
        clock
    ).strftime("%Y%m%dT%H%M%S")


def _first_occurrence(
    day_of_week: str,
    start_time: str
) -> date:
    today = date.today()
    target_weekday = DAY_TO_WEEKDAY[day_of_week]
    days_ahead = (
        target_weekday - today.weekday()
    ) % 7

    event_date = today + timedelta(days=days_ahead)

    if days_ahead == 0:
        now = datetime.now().time()
        slot_start = parse_time_value(start_time)

        if now >= slot_start:
            event_date = today + timedelta(days=7)

    return event_date


def build_student_timetable_ics(timetable: dict) -> str:
    student = timetable["student"]
    entries = timetable["entries"]
    timestamp = datetime.utcnow().strftime(
        "%Y%m%dT%H%M%SZ"
    )

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LearnSphere//Student Timetable//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:LearnSphere - {student['full_name']}",
    ]

    for entry in entries:
        event_date = _first_occurrence(
            entry["day_of_week"],
            entry["start_time"]
        )
        start_clock = parse_time_value(
            entry["start_time"]
        )
        end_clock = parse_time_value(
            entry["end_time"]
        )
        summary = (
            f"{entry['course_code']} - "
            f"{entry['course_title']}"
        )
        description = (
            f"Instructor: {entry['instructor_name']}"
        )
        location = f"Room {entry['room_number']}"
        byday = DAY_TO_ICS[entry["day_of_week"]]

        lines.extend([
            "BEGIN:VEVENT",
            (
                "UID:timetable-"
                f"{entry['timetable_id']}@learnsphere"
            ),
            f"DTSTAMP:{timestamp}",
            (
                "DTSTART:"
                f"{_ics_format_datetime(event_date, start_clock)}"
            ),
            (
                "DTEND:"
                f"{_ics_format_datetime(event_date, end_clock)}"
            ),
            f"RRULE:FREQ=WEEKLY;BYDAY={byday}",
            f"SUMMARY:{_ics_escape(summary)}",
            f"LOCATION:{_ics_escape(location)}",
            f"DESCRIPTION:{_ics_escape(description)}",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")

    return "\r\n".join(lines) + "\r\n"


def build_student_timetable_pdf(timetable: dict) -> bytes:
    try:
        from fpdf import FPDF
    except ImportError as exc:
        raise RuntimeError(
            "PDF export requires fpdf2. "
            "Run: pip install fpdf2"
        ) from exc

    student = timetable["student"]
    entries = timetable["entries"]

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "LearnSphere Timetable", ln=True)

    pdf.set_font("Helvetica", size=11)
    pdf.cell(
        0,
        8,
        f"Student: {student['full_name']}",
        ln=True
    )
    pdf.cell(
        0,
        8,
        f"Code: {student['student_code']}",
        ln=True
    )
    pdf.cell(
        0,
        8,
        f"Department: {student['department']}",
        ln=True
    )
    pdf.cell(
        0,
        8,
        (
            f"Semester: {student['semester']}  |  "
            f"Credits: {timetable['total_credits']}"
        ),
        ln=True
    )
    pdf.ln(4)

    column_widths = [24, 28, 22, 52, 22, 42]
    headers = [
        "Day",
        "Start",
        "End",
        "Course",
        "Room",
        "Instructor"
    ]

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(237, 233, 254)

    for index, header in enumerate(headers):
        pdf.cell(
            column_widths[index],
            8,
            header,
            border=1,
            align="C",
            fill=True
        )

    pdf.ln()
    pdf.set_font("Helvetica", size=9)

    for entry in entries:
        row = [
            entry["day_of_week"][:3],
            entry["start_time"],
            entry["end_time"],
            (
                f"{entry['course_code']}\n"
                f"{entry['course_title'][:28]}"
            ),
            entry["room_number"],
            entry["instructor_name"][:24],
        ]

        line_height = 7
        x_start = pdf.get_x()
        y_start = pdf.get_y()
        max_height = line_height

        for index, value in enumerate(row):
            pdf.set_xy(
                x_start + sum(column_widths[:index]),
                y_start
            )
            pdf.multi_cell(
                column_widths[index],
                line_height,
                value,
                border=0
            )
            max_height = max(
                max_height,
                pdf.get_y() - y_start
            )

        pdf.set_xy(x_start, y_start)

        for index, width in enumerate(column_widths):
            pdf.cell(
                width,
                max_height,
                "",
                border=1
            )

        pdf.ln(max_height)

    buffer = BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()
