from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)

    course_code = Column(String, unique=True, nullable=False)

    title = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    credits = Column(Integer, nullable=False)

    enrollments = relationship("Enrollment", back_populates="course")

    timetable_entries = relationship("Timetable", back_populates="course")
