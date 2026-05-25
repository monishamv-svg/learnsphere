from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentRead
from app.services.user_service import get_user_by_email
from app.utils.security import hash_password


def create_student(db: Session, student: StudentCreate):
    if get_user_by_email(db, student.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        full_name=student.full_name,
        email=student.email,
        password_hash=hash_password(student.password),
        role="student",
    )
    db.add(db_user)
    db.flush()

    db_student = Student(
        user_id=db_user.id,
        student_code=student.student_code,
        department=student.department,
        semester=student.semester,
        phone_number=student.phone_number,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    db.refresh(db_user)

    db_student.user = db_user
    return StudentRead.from_student(db_student)


def get_all_students(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str = None
):
    query = db.query(Student).options(joinedload(Student.user))

    if search:
        query = query.join(Student.user).filter(
            User.full_name.ilike(f"%{search}%")
        )

    total_count = query.count()

    students = query.offset(skip).limit(limit).all()

    return {
        "total_count": total_count,
        "items": [StudentRead.from_student(student) for student in students],
    }


def get_student_by_id(db: Session, student_id: int):
    return (
        db.query(Student)
        .options(joinedload(Student.user))
        .filter(Student.id == student_id)
        .first()
    )