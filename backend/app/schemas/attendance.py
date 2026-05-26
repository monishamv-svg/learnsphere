from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"


class AttendanceCreate(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: str
    status: AttendanceStatus

class AttendanceUpdate(BaseModel):
    attendance_date: Optional[str] = None
    status: Optional[AttendanceStatus] = None

class AttendancePut(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: str
    status: AttendanceStatus

class AttendanceRead(BaseModel):
    id: int
    student_id: int
    timetable_id: int
    attendance_date: str
    status: AttendanceStatus

    class Config:
        from_attributes = True