from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.student import Student
from app.models.user import User
from app.schemas.student import (
    StudentCreate,
    StudentRead,
    StudentUpdate,
    StudentPut
)
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
    search: str = None,
    department: str = None,
    semester: int = None
):
    query = db.query(Student).options(joinedload(Student.user))

    if search:
        term = f"%{search.strip()}%"

        query = query.join(Student.user).filter(
            or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
                Student.student_code.ilike(term),
                Student.phone_number.ilike(term),
            )
        )

    if department:
        query = query.filter(
            Student.department == department
        )

    if semester is not None:
        query = query.filter(
            Student.semester == semester
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

def update_student(
    db: Session,
    student_id: int,
    student_data: StudentUpdate
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        return None

    update_data = student_data.model_dump(
        exclude_unset=True
    )

    if "full_name" in update_data:
        student.user.full_name = update_data.pop("full_name")

    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)

    return StudentRead.from_student(student)


def replace_student(
    db: Session,
    student_id: int,
    student_data: StudentPut
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        return None

    student.user.full_name = student_data.full_name
    student.department = student_data.department
    student.semester = student_data.semester
    student.phone_number = student_data.phone_number

    db.commit()
    db.refresh(student)

    return StudentRead.from_student(student)


def delete_student(
    db: Session,
    student_id: int
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        return None

    user = student.user

    db.delete(student)

    if user:
        db.delete(user)

    db.commit()

    return {
        "message": "Student deleted successfully"
    }