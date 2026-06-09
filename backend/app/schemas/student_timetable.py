from typing import List

from pydantic import BaseModel


class StudentTimetableEntry(BaseModel):
    timetable_id: int
    course_id: int
    course_code: str
    course_title: str
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str


class StudentTimetableStudent(BaseModel):
    id: int
    full_name: str
    student_code: str
    department: str
    semester: int


class StudentScheduleGroup(BaseModel):
    semester: int
    department: str
    label: str


class StudentTimetableResponse(BaseModel):
    student: StudentTimetableStudent
    schedule_group: StudentScheduleGroup
    entries: List[StudentTimetableEntry]
    total_credits: int
