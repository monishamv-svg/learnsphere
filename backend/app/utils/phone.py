import re

INDIAN_MOBILE_PHONE_REGEX = re.compile(r"^[6789]\d{9}$")

PHONE_VALIDATION_MESSAGE = (
    "Phone number must be exactly 10 digits "
    "and start with 6, 7, 8, or 9"
)


def is_valid_indian_mobile_phone(value: str) -> bool:
    return bool(
        INDIAN_MOBILE_PHONE_REGEX.fullmatch(value)
    )
