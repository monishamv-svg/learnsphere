from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)

    course_id = Column(Integer, ForeignKey("courses.id"))

    day_of_week = Column(String, nullable=False)

    start_time = Column(String, nullable=False)

    end_time = Column(String, nullable=False)

    room_number = Column(String, nullable=False)

    instructor_name = Column(String, nullable=False)

    course = relationship("Course", back_populates="timetable_entries")

    attendance_records = relationship("Attendance", back_populates="timetable")
