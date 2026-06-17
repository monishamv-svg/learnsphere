from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.utils.datetime_format import parse_date_value, parse_time_value


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"


class AttendanceCreate(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: date
    status: AttendanceStatus


class AttendanceBulkEntry(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: date
    status: AttendanceStatus


class AttendanceBulkCreate(BaseModel):
    entries: List[AttendanceBulkEntry] = Field(min_length=1)


class AttendanceBulkResult(BaseModel):
    created: int
    updated: int
    errors: List[str] = []


class ProfessorSessionRead(BaseModel):
    timetable_id: int
    course_id: int
    course_code: str
    course_title: str
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    enrolled_count: int


class SessionRosterStudent(BaseModel):
    student_id: int
    student_code: str
    student_name: str
    attendance_id: Optional[int] = None
    status: Optional[AttendanceStatus] = None


class CourseAttendanceRecordSummary(BaseModel):
    attendance_id: int
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


class CourseAttendanceSummary(BaseModel):
    course_id: int
    course_code: str
    course_title: str
    professor_name: Optional[str] = None
    total_classes: int
    present_count: int
    absent_count: int
    attendance_percentage: float
    records: List[CourseAttendanceRecordSummary] = []


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

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value):
        if value == "Late":
            return "Absent"

        return value

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
