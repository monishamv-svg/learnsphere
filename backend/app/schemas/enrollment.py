from typing import Optional

from pydantic import BaseModel


class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int
    timetable_id: int


class EnrollmentUpdate(BaseModel):
    course_id: Optional[int] = None
    timetable_id: Optional[int] = None


class EnrollmentPut(BaseModel):
    student_id: int
    course_id: int
    timetable_id: int


class EnrollmentRead(BaseModel):
    id: int

    student_id: int
    course_id: int
    timetable_id: Optional[int] = None

    student_name: str
    student_code: str
    semester: int

    course_name: str
    course_code: str
    credits: int
    is_elective: bool

    instructor_name: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_number: Optional[str] = None

    class Config:
        from_attributes = True
