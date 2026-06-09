from typing import List

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.security import (
    require_admin,
    require_student,
    get_current_user
)
from app.db.session import get_db
from app.models.student import Student
from app.schemas.student_timetable import StudentTimetableResponse
from app.services.student_timetable_service import (
    get_student_timetable
)
from app.utils.timetable_export import (
    build_student_timetable_ics,
    build_student_timetable_pdf
)
from app.schemas.timetable import (
    TimetableCreate,
    TimetableRead,
    TimetableUpdate,
    TimetablePut
)
from app.schemas.pagination import TimetablePagination
from app.schemas.semester_schedule import (
    SemesterScheduleDetailResponse,
    SemesterScheduleListResponse,
)
from app.schemas.timetable_generate import (
    TimetableGenerateRequest,
    TimetableGenerateResponse,
)
from app.services.semester_schedule_service import (
    get_semester_schedule,
    list_semester_schedules,
)
from app.services.timetable_auto_schedule_service import (
    generate_semester_timetable,
)
from app.services.timetable_service import (
    create_timetable_entry,
    get_all_timetable_entries,
    update_timetable_entry,
    replace_timetable_entry,
    delete_timetable_entry
)

router = APIRouter()


def _get_current_student(
    db: Session,
    current_user
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    return student


def _get_student_timetable_or_404(
    db: Session,
    student
):
    timetable = get_student_timetable(
        db,
        student.id
    )

    if not timetable:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    if not timetable["entries"]:
        raise HTTPException(
            status_code=404,
            detail="No classes scheduled to export"
        )

    return timetable


@router.post("/", response_model=TimetableRead)
def create_timetable_api(
    timetable: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        return create_timetable_entry(
            db,
            timetable
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/me",
    response_model=StudentTimetableResponse
)
def get_my_timetable_api(
    db: Session = Depends(get_db),
    current_user=Depends(require_student)
):
    student = _get_current_student(
        db,
        current_user
    )

    timetable = get_student_timetable(
        db,
        student.id
    )

    if not timetable:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    return timetable


@router.get(
    "/schedules",
    response_model=SemesterScheduleListResponse
)
def list_semester_schedules_api(
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return list_semester_schedules(
        db,
        department
    )


@router.get(
    "/schedules/{semester}",
    response_model=SemesterScheduleDetailResponse
)
def get_semester_schedule_api(
    semester: int,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if semester < 1 or semester > 8:
        raise HTTPException(
            status_code=400,
            detail="Semester must be between 1 and 8"
        )

    schedule = get_semester_schedule(
        db,
        semester,
        department
    )

    if schedule["total_entries"] == 0:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No timetable entries found "
                f"for semester {semester}"
            )
        )

    return schedule


@router.post(
    "/schedules/{semester}/generate",
    response_model=TimetableGenerateResponse
)
def generate_semester_schedule_api(
    semester: int,
    payload: TimetableGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    if semester < 1 or semester > 8:
        raise HTTPException(
            status_code=400,
            detail="Semester must be between 1 and 8"
        )

    try:
        return generate_semester_timetable(
            db,
            semester,
            payload.department,
            payload.mode,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get("/me/export/ics")
def export_my_timetable_ics_api(
    db: Session = Depends(get_db),
    current_user=Depends(require_student)
):
    student = _get_current_student(
        db,
        current_user
    )
    timetable = _get_student_timetable_or_404(
        db,
        student
    )
    ics_content = build_student_timetable_ics(
        timetable
    )
    filename = (
        f"learnsphere-timetable-"
        f"{student.student_code}.ics"
    )

    return Response(
        content=ics_content,
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        }
    )


@router.get("/me/export/pdf")
def export_my_timetable_pdf_api(
    db: Session = Depends(get_db),
    current_user=Depends(require_student)
):
    student = _get_current_student(
        db,
        current_user
    )
    timetable = _get_student_timetable_or_404(
        db,
        student
    )
    pdf_bytes = build_student_timetable_pdf(
        timetable
    )
    filename = (
        f"learnsphere-timetable-"
        f"{student.student_code}.pdf"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        }
    )


@router.get("/", response_model=TimetablePagination)
def get_timetable_api(
    skip: int = 0,
    limit: int = 10,
    course_id: int = None,
    db: Session = Depends(get_db)
):
    return get_all_timetable_entries(
        db,
        skip,
        limit,
        course_id
    )


@router.put(
    "/{timetable_id}",
    response_model=TimetableRead
)
def replace_timetable_api(
    timetable_id: int,
    timetable_data: TimetablePut,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        updated_timetable = replace_timetable_entry(
            db,
            timetable_id,
            timetable_data
        )

        if not updated_timetable:
            raise HTTPException(
                status_code=404,
                detail="Timetable entry not found"
            )

        return updated_timetable

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.patch(
    "/{timetable_id}",
    response_model=TimetableRead
)
def update_timetable_api(
    timetable_id: int,
    timetable_data: TimetableUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        updated_timetable = update_timetable_entry(
            db,
            timetable_id,
            timetable_data
        )

        if not updated_timetable:
            raise HTTPException(
                status_code=404,
                detail="Timetable entry not found"
            )

        return updated_timetable

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete("/{timetable_id}")
def delete_timetable_api(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    deleted_timetable = delete_timetable_entry(
        db,
        timetable_id
    )

    if not deleted_timetable:
        raise HTTPException(
            status_code=404,
            detail="Timetable entry not found"
        )

    return deleted_timetable