from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"


class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=100
    )

    role: UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    role: Optional[UserRole] = None

    is_active: Optional[bool] = None


class UserPut(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    role: UserRole

    is_active: bool


class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True