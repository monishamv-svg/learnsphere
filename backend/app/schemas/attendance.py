from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    student_id: int
    timetable_id: int
    attendance_date: str
    status: str


class AttendanceRead(BaseModel):
    id: int
    student_id: int
    timetable_id: int
    attendance_date: str
    status: str

    class Config:
        from_attributes = True