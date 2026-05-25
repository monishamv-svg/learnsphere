from typing import Optional

from pydantic import BaseModel


class CourseCreate(BaseModel):
    course_code: str
    title: str
    description: Optional[str] = None
    credits: int


class CourseRead(BaseModel):
    id: int
    course_code: str
    title: str
    description: Optional[str]
    credits: int

    class Config:
        from_attributes = True