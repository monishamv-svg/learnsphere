from sqlalchemy.orm import Session

from app.models.student import Student
from app.schemas.student import StudentCreate


def create_student(db: Session, student: StudentCreate):
    db_student = Student(**student.model_dump())  ##Convert Pydantic schema -> SQLAlchemy model

    db.add(db_student)

    db.commit()

    db.refresh(db_student)

    return db_student


def get_all_students(db: Session):
    return db.query(Student).all()


def get_student_by_id(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()