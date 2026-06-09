from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.phone import (
    PHONE_VALIDATION_MESSAGE,
    is_valid_indian_mobile_phone,
)


class StudentCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=100
    )

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

    phone_number: str = Field(
        min_length=10,
        max_length=10
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str):
        cleaned = value.strip()

        if not is_valid_indian_mobile_phone(cleaned):
            raise ValueError(PHONE_VALIDATION_MESSAGE)

        return cleaned


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
        max_length=10
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: Optional[str]):
        if value is None:
            return value

        cleaned = value.strip()

        if not is_valid_indian_mobile_phone(cleaned):
            raise ValueError(PHONE_VALIDATION_MESSAGE)

        return cleaned


class StudentPut(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    department: str = Field(
        min_length=2,
        max_length=100
    )

    semester: int = Field(
        ge=1,
        le=8
    )

    phone_number: str = Field(
        min_length=10,
        max_length=10
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str):
        cleaned = value.strip()

        if not is_valid_indian_mobile_phone(cleaned):
            raise ValueError(PHONE_VALIDATION_MESSAGE)

        return cleaned


class StudentRead(BaseModel):
    id: int
    full_name: str
    email: str
    student_code: str
    department: str
    semester: int
    phone_number: Optional[str]

    @classmethod
    def from_student(cls, student):
        return cls(
            id=student.id,
            full_name=student.user.full_name,
            email=student.user.email,
            student_code=student.student_code,
            department=student.department,
            semester=student.semester,
            phone_number=student.phone_number,
        )

    class Config:
        from_attributes = True