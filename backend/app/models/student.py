from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    student_code = Column(String, unique=True, nullable=False)

    department = Column(String, nullable=False)

    semester = Column(Integer, nullable=False)

    phone_number = Column(String, nullable=True)

    address = Column(String, nullable=True)

    user = relationship("User", back_populates="student_profile")  ##One-to-one relationship with User

    enrollments = relationship("Enrollment", back_populates="student")  ##Many-to-many relationship with Course  ##Back_populates is used to define the relationship in the other model

    attendance_records = relationship("Attendance", back_populates="student")  ##Many-to-one relationship with Attendance