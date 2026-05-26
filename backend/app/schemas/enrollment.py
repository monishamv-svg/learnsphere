from typing import Optional

from pydantic import BaseModel


class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int


class EnrollmentUpdate(BaseModel):
    course_id: Optional[int] = None


class EnrollmentPut(BaseModel):
    student_id: int
    course_id: int


class EnrollmentRead(BaseModel):
    id: int
    student_id: int
    course_id: int

    class Config:
        from_attributes = True
