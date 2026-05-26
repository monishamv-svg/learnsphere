from typing import Optional

from pydantic import BaseModel, Field


class TimetableCreate(BaseModel):
    course_id: int

    day_of_week: str = Field(
        min_length=3,
        max_length=20
    )

    start_time: str

    end_time: str

    room_number: str = Field(
        min_length=1,
        max_length=20
    )

    instructor_name: str = Field(
        min_length=3,
        max_length=100
    )


class TimetableUpdate(BaseModel):
    day_of_week: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=20
    )

    start_time: Optional[str] = None

    end_time: Optional[str] = None

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


class TimetablePut(BaseModel):
    course_id: int

    day_of_week: str = Field(
        min_length=3,
        max_length=20
    )

    start_time: str

    end_time: str

    room_number: str = Field(
        min_length=1,
        max_length=20
    )

    instructor_name: str = Field(
        min_length=3,
        max_length=100
    )


class TimetableRead(BaseModel):
    id: int
    course_id: int
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str

    class Config:
        from_attributes = True