from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.utils.datetime_format import parse_date_value, parse_time_value


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"


class AttendanceCreate(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: date
    status: AttendanceStatus


class AttendanceUpdate(BaseModel):
    attendance_date: Optional[date] = None
    status: Optional[AttendanceStatus] = None


class AttendancePut(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: date
    status: AttendanceStatus


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    timetable_id: int
    attendance_date: date
    status: AttendanceStatus

    @field_validator("attendance_date", mode="before")
    @classmethod
    def parse_attendance_date(cls, value):
        return parse_date_value(value)

    @field_serializer("attendance_date")
    def serialize_attendance_date(
        self,
        value: date
    ) -> str:
        return value.isoformat()
