from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    student_code: str = Field(
        min_length=4,
        max_length=20
    )

    department: str = Field(
        min_length=2,
        max_length=100
    )

    semester: int = Field(
        ge=1,
        le=8
    )

    phone_number: Optional[str] = Field(
        default=None,
        min_length=10,
        max_length=15
    )


class StudentUpdate(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    department: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    semester: Optional[int] = Field(
        default=None,
        ge=1,
        le=8
    )

    phone_number: Optional[str] = Field(
        default=None,
        min_length=10,
        max_length=15
    )


class StudentRead(BaseModel):
    id: int
    full_name: str
    email: str
    student_code: str
    department: str
    semester: int
    phone_number: Optional[str]

    class Config:
        from_attributes = True