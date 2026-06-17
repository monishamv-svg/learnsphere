from datetime import date, time


def parse_time_value(value) -> time:
    if isinstance(value, time):
        return value

    if isinstance(value, str):
        parts = value.strip().split(":")

        if len(parts) == 1 and parts[0].isdigit():
            return time(int(parts[0]), 0)

        if len(parts) == 2:
            hour, minute = parts
            return time(int(hour), int(minute))

        if len(parts) == 3:
            hour, minute, second = parts
            return time(
                int(hour),
                int(minute),
                int(second)
            )

    raise ValueError("Invalid time format")


def parse_date_value(value) -> date:
    if isinstance(value, date):
        return value

    if isinstance(value, str):
        return date.fromisoformat(value)

    raise ValueError("Invalid date format")


def format_time(value) -> str:
    if isinstance(value, time):
        return value.strftime("%H:%M")

    return parse_time_value(value).strftime("%H:%M")


def store_date(value: date) -> str:
    return value.isoformat()


def store_time(value: time) -> str:
    return value.strftime("%H:%M")
