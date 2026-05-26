from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import (require_admin, get_db)
from app.models.user import User


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/")
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    users = db.query(User).all()

    return users