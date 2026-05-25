from typing import Optional

from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    course_code: str = Field(
        min_length=3,
        max_length=20
    )

    title: str = Field(
        min_length=3,
        max_length=200
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    credits: int = Field(
        ge=1,
        le=6
    )


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=200
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    credits: Optional[int] = Field(
        default=None,
        ge=1,
        le=6
    )


class CourseRead(BaseModel):
    id: int
    course_code: str
    title: str
    description: Optional[str]
    credits: int

    class Config:
        from_attributes = True