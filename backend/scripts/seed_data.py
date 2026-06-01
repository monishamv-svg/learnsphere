from app.db.session import SessionLocal

from app.models.user import User
from app.models.student import Student
from app.models.course import Course
from app.models.timetable import Timetable

from app.utils.security import hash_password


db = SessionLocal()

SEED_CREDENTIALS = {
    "admin@learnsphere.com": "Admin123",
    "rahul@example.com": "student123",
    "priya@example.com": "student123",
}

# CREATE ADMIN
existing_admin = db.query(User).filter(
    User.email == "admin@learnsphere.com"
).first()

if not existing_admin:
    admin_user = User(
        full_name="LearnSphere Admin",
        email="admin@learnsphere.com",
        password_hash=hash_password("Admin123"),
        role="admin"
    )

    db.add(admin_user)

    print("Admin user created")


# CREATE COURSES
courses_data = [
    {
        "course_code": "CS101",
        "title": "Python Programming",
        "description": "Introduction to Python",
        "credits": 4
    },
    {
        "course_code": "CS102",
        "title": "Database Systems",
        "description": "SQL and database fundamentals",
        "credits": 3
    },
    {
        "course_code": "CS103",
        "title": "Web Development",
        "description": "Frontend and backend basics",
        "credits": 4
    }
]

for course_data in courses_data:

    existing_course = db.query(Course).filter(
        Course.course_code == course_data["course_code"]
    ).first()

    if not existing_course:

        course = Course(**course_data)

        db.add(course)

        print(f"Course created: {course.title}")


# CREATE STUDENTS
students_data = [
    {
        "full_name": "Rahul Sharma",
        "email": "rahul@example.com",
        "student_code": "LS1001",
        "department": "Computer Science",
        "semester": 5,
        "phone_number": "9876543210"
    },
    {
        "full_name": "Priya Nair",
        "email": "priya@example.com",
        "student_code": "LS1002",
        "department": "Information Science",
        "semester": 3,
        "phone_number": "9123456780"
    }
]

for student_data in students_data:

    existing_user = db.query(User).filter(
        User.email == student_data["email"]
    ).first()

    if existing_user:
        continue

    user = User(
        full_name=student_data["full_name"],
        email=student_data["email"],
        password_hash=hash_password("student123"),
        role="student"
    )

    db.add(user)

    db.flush()

    student = Student(
        user_id=user.id,
        student_code=student_data["student_code"],
        department=student_data["department"],
        semester=student_data["semester"],
        phone_number=student_data["phone_number"]
    )

    db.add(student)

    print(f"Student created: {student_data['full_name']}")


# Keep seeded account passwords in sync when re-running the script
for email, password in SEED_CREDENTIALS.items():
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.password_hash = hash_password(password)
        print(f"Password synced for: {email}")

# SAVE CHANGES
db.commit()

print("Seed data inserted successfully")

db.close()