from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("students.id"))

    timetable_id = Column(Integer, ForeignKey("timetables.id"))

    attendance_date = Column(String, nullable=False)

    status = Column(String, nullable=False)

    student = relationship("Student", back_populates="attendance_records")  ##Many-to-one relationship with Student

    timetable = relationship("Timetable", back_populates="attendance_records")  ##Many-to-one relationship with Timetable