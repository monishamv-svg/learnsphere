from pydantic import BaseModel
from typing import Optional

class StudentCreate(BaseModel):
    user_id: int
    student_code: str
    department: str
    semester: int
    phone_number: Optional[str] = None
    address: Optional[str] = None


class StudentRead(BaseModel):
    id: int
    user_id: int
    student_code: str
    department: str
    semester: int
    phone_number: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True