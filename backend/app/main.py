from fastapi import FastAPI
from app.core.config import settings
from app.db.database import Base, engine
import app.models

from app.api import auth
from app.api import students
from app.api import courses
from app.api import enrollments
from app.api import timetables
from app.api import attendance
from app.api import dashboard
from app.api import users

Base.metadata.create_all(bind=engine)  ##Create all tables in the database/ models

app = FastAPI(                                    ##FastAPI instance/ object
    title=settings.APP_NAME,
    description="Student Management System API",
    version="1.0.0"
)

app.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"]
)

app.include_router(
    students.router, 
    prefix="/students", 
    tags=["Students"] 
)

app.include_router(
    courses.router,
    prefix="/courses",
    tags=["Courses"]
)

app.include_router(
    enrollments.router,
    prefix="/enrollments",
    tags=["Enrollments"]
)

app.include_router(
    timetables.router,
    prefix="/timetables",
    tags=["Timetables"]
)

app.include_router(
    attendance.router,
    prefix="/attendance",
    tags=["Attendance"]
)

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

app.include_router(users.router)

@app.get("/")     ##This is a route/endpoint. declares the URL path for the endpoint.
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}"
    }
