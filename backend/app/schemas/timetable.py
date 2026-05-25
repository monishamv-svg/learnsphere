from pydantic import BaseModel


class TimetableCreate(BaseModel):
    course_id: int
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str


class TimetableRead(BaseModel):
    id: int
    course_id: int
    day_of_week: str
    start_time: str
    end_time: str
    room_number: str
    instructor_name: str

    class Config:
        from_attributes = True