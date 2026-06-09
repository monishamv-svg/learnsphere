from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("students.id"))

    course_id = Column(Integer, ForeignKey("courses.id"))

    timetable_id = Column(
        Integer,
        ForeignKey("timetables.id"),
        nullable=True
    )

    student = relationship("Student", back_populates="enrollments")

    course = relationship("Course", back_populates="enrollments")

    timetable = relationship("Timetable")