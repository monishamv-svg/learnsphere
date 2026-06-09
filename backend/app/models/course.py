from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)

    course_code = Column(String, unique=True, nullable=False)

    title = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    credits = Column(Integer, nullable=False)

    semester = Column(Integer, nullable=False, default=1)

    department = Column(String, nullable=False)

    instructor_name = Column(String, nullable=True)

    additional_instructors = Column(Text, nullable=True)

    max_capacity = Column(Integer, nullable=False, default=40)

    is_elective = Column(Boolean, nullable=False, default=False)

    enrollments = relationship("Enrollment", back_populates="course")

    timetable_entries = relationship("Timetable", back_populates="course")
