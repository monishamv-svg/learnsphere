from typing import List

from pydantic import BaseModel


class DepartmentScheduleSummary(BaseModel):
    department: str
    entry_count: int
    course_count: int


class SemesterScheduleSummary(BaseModel):
    semester: int
    entry_count: int
    course_count: int
    departments: List[DepartmentScheduleSummary]


class SemesterScheduleListResponse(BaseModel):
    schedules: List[SemesterScheduleSummary]


class SemesterScheduleEntry(BaseModel):
    id: int
    course_id: int
    course_code: str
    course_title: str
    department: str
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str


class DepartmentScheduleGroup(BaseModel):
    department: str
    entry_count: int
    entries: List[SemesterScheduleEntry]


class SemesterScheduleDetailResponse(BaseModel):
    semester: int
    total_entries: int
    total_courses: int
    department_groups: List[DepartmentScheduleGroup]
