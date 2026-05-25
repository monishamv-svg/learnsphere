from typing import Optional

from pydantic import BaseModel, EmailStr, Field


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