from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class TimetableGenerateRequest(BaseModel):
    department: Optional[str] = None
    mode: Literal["missing_only", "replace"] = "missing_only"


class TimetableGenerateCourseResult(BaseModel):
    course_code: str
    reason: str


class TimetableGenerateCreatedEntry(BaseModel):
    id: int
    course_id: int
    course_code: str
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str


class TimetableGenerateResponse(BaseModel):
    semester: int
    department: Optional[str]
    mode: str
    created_count: int
    skipped_count: int
    failed_count: int
    skipped_courses: List[TimetableGenerateCourseResult]
    failed_courses: List[TimetableGenerateCourseResult]
    created_entries: List[TimetableGenerateCreatedEntry]
    message: str
