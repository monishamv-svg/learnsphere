from typing import Literal, List, Optional

from pydantic import BaseModel, Field

ALLOWED_COURSE_CREDITS = Literal[1, 3, 4]


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

    credits: ALLOWED_COURSE_CREDITS

    semester: int = Field(
        ge=1,
        le=8
    )

    department: str = Field(
        min_length=2,
        max_length=100
    )

    instructor_name: Optional[str] = Field(
        default=None,
        max_length=100
    )

    additional_instructors: Optional[str] = Field(
        default=None,
        max_length=500
    )

    max_capacity: int = Field(
        ge=1,
        le=500
    )

    is_elective: bool = False


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

    credits: Optional[ALLOWED_COURSE_CREDITS] = None

    semester: Optional[int] = Field(
        default=None,
        ge=1,
        le=8
    )

    department: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    instructor_name: Optional[str] = Field(
        default=None,
        max_length=100
    )

    additional_instructors: Optional[str] = Field(
        default=None,
        max_length=500
    )

    max_capacity: Optional[int] = Field(
        default=None,
        ge=1,
        le=500
    )

    is_elective: Optional[bool] = None


class CoursePut(BaseModel):
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

    credits: ALLOWED_COURSE_CREDITS

    semester: int = Field(
        ge=1,
        le=8
    )

    department: str = Field(
        min_length=2,
        max_length=100
    )

    instructor_name: Optional[str] = Field(
        default=None,
        max_length=100
    )

    additional_instructors: Optional[str] = Field(
        default=None,
        max_length=500
    )

    max_capacity: int = Field(
        ge=1,
        le=500
    )

    is_elective: bool = False


class CourseRead(BaseModel):
    id: int
    course_code: str
    title: str
    description: Optional[str]
    credits: int
    semester: int
    department: str
    instructor_name: Optional[str]
    additional_instructors: Optional[str] = None
    instructors: List[str] = []
    max_capacity: int
    is_elective: bool
    enrollment_count: int = 0

    class Config:
        from_attributes = True
