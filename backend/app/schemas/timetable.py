from datetime import time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.utils.datetime_format import parse_time_value


class TimetableCreate(BaseModel):
    course_id: int

    day_of_week: str = Field(
        min_length=3,
        max_length=20
    )

    start_time: time

    end_time: time

    room_number: str = Field(
        min_length=1,
        max_length=20
    )

    instructor_name: str = Field(
        min_length=3,
        max_length=100
    )

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def validate_time(cls, value):
        return parse_time_value(value)


class TimetableUpdate(BaseModel):
    day_of_week: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=20
    )

    start_time: Optional[time] = None

    end_time: Optional[time] = None

    room_number: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20
    )

    instructor_name: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=100
    )

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def validate_time(cls, value):
        if value is None:
            return value

        return parse_time_value(value)


class TimetablePut(BaseModel):
    course_id: int

    day_of_week: str = Field(
        min_length=3,
        max_length=20
    )

    start_time: time

    end_time: time

    room_number: str = Field(
        min_length=1,
        max_length=20
    )

    instructor_name: str = Field(
        min_length=3,
        max_length=100
    )

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def validate_time(cls, value):
        return parse_time_value(value)


class TimetableRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    day_of_week: str
    start_time: time
    end_time: time
    room_number: str
    instructor_name: str
    enrollment_count: int = 0
    section_capacity: int = 0

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def parse_stored_time(cls, value):
        return parse_time_value(value)

    @field_serializer("start_time", "end_time")
    def serialize_time(self, value: time) -> str:
        return value.strftime("%H:%M")
