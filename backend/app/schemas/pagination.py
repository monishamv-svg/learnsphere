from typing import List

from pydantic import BaseModel

from app.schemas.course import CourseRead
from app.schemas.student import StudentRead
from app.schemas.timetable import TimetableRead


class StudentPagination(BaseModel):
    total_count: int
    items: List[StudentRead]


class CoursePagination(BaseModel):
    total_count: int
    items: List[CourseRead]


class TimetablePagination(BaseModel):
    total_count: int
    items: List[TimetableRead]