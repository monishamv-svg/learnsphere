from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.schemas.timetable import (TimetableCreate, TimetableRead)
from app.services.timetable_service import (create_timetable_entry, get_all_timetable_entries)

router = APIRouter()


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


@router.get("/", response_model=List[TimetableRead])
def get_timetable_api(
    db: Session = Depends(get_db)
):
    return get_all_timetable_entries(db)