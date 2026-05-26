from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_current_user)
from app.db.session import get_db
from app.schemas.timetable import (
    TimetableCreate,
    TimetableRead,
    TimetableUpdate,
    TimetablePut
)
from app.services.timetable_service import (
    create_timetable_entry,
    get_all_timetable_entries,
    update_timetable_entry,
    replace_timetable_entry,
    delete_timetable_entry
)

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
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return get_all_timetable_entries(
        db,
        skip,
        limit
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