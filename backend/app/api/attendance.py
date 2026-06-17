from typing import List

from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.services.attendance_service import (
    mark_attendance,
    get_all_attendance,
    calculate_attendance_percentage,
    update_attendance,
    replace_attendance,
    delete_attendance,
    get_professor_sessions,
    get_session_roster,
    bulk_mark_attendance,
    get_student_attendance_by_course,
)
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceRead,
    AttendanceUpdate,
    AttendancePut,
    AttendanceBulkCreate,
    AttendanceBulkResult,
    ProfessorSessionRead,
    SessionRosterStudent,
    CourseAttendanceSummary,
)

router = APIRouter()


@router.post(
    "/",
    response_model=AttendanceRead
)
def mark_attendance_api(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        return mark_attendance(
            db,
            attendance
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=List[AttendanceRead]
)
def get_attendance_api(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return get_all_attendance(
        db,
        skip,
        limit
    )


@router.get(
    "/percentage/{student_id}"
)
def get_attendance_percentage(
    student_id: int,
    db: Session = Depends(get_db)
):
    percentage = calculate_attendance_percentage(
        db,
        student_id
    )

    return {
        "student_id": student_id,
        "attendance_percentage": percentage
    }


@router.put(
    "/{attendance_id}",
    response_model=AttendanceRead
)
def replace_attendance_api(
    attendance_id: int,
    attendance_data: AttendancePut,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_attendance = replace_attendance(
        db,
        attendance_id,
        attendance_data
    )

    if not updated_attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return updated_attendance


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceRead
)
def update_attendance_api(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_attendance = update_attendance(
        db,
        attendance_id,
        attendance_data
    )

    if not updated_attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return updated_attendance


@router.delete("/{attendance_id}")
def delete_attendance_api(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    deleted_attendance = delete_attendance(
        db,
        attendance_id
    )

    if not deleted_attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return deleted_attendance


@router.get(
    "/professor-sessions",
    response_model=List[ProfessorSessionRead]
)
def get_professor_sessions_api(
    professor_name: str,
    attendance_date: date,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    return get_professor_sessions(
        db,
        professor_name,
        attendance_date
    )


@router.get(
    "/session-roster",
    response_model=List[SessionRosterStudent]
)
def get_session_roster_api(
    timetable_id: int,
    attendance_date: date,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        return get_session_roster(
            db,
            timetable_id,
            attendance_date
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.post(
    "/bulk",
    response_model=AttendanceBulkResult
)
def bulk_mark_attendance_api(
    payload: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    return bulk_mark_attendance(db, payload)


@router.get(
    "/me/by-course",
    response_model=List[CourseAttendanceSummary]
)
def get_my_attendance_by_course_api(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models.student import Student

    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    return get_student_attendance_by_course(
        db,
        student.id
    )