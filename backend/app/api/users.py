from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from sqlalchemy.orm import Session

from app.core.security import (
    require_admin,
    get_db
)
from app.schemas.user import (
    UserCreate,
    UserRead,
    UserUpdate,
    UserPut
)
from app.services.user_service import (
    create_user,
    get_all_users,
    get_user_by_id,
    update_user,
    replace_user,
    delete_user
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post(
    "/",
    response_model=UserRead
)
def create_user_api(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        return create_user(
            db,
            user
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=List[UserRead]
)
def get_users_api(
    skip: int = Query(
        default=0,
        ge=0
    ),

    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),

    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    return get_all_users(
        db,
        skip,
        limit
    )


@router.get(
    "/{user_id}",
    response_model=UserRead
)
def get_user_api(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    user = get_user_by_id(
        db,
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.patch(
    "/{user_id}",
    response_model=UserRead
)
def update_user_api(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_user = update_user(
        db,
        user_id,
        user_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated_user


@router.put(
    "/{user_id}",
    response_model=UserRead
)
def replace_user_api(
    user_id: int,
    user_data: UserPut,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    updated_user = replace_user(
        db,
        user_id,
        user_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated_user


@router.delete("/{user_id}")
def delete_user_api(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    deleted_user = delete_user(
        db,
        user_id
    )

    if not deleted_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return deleted_user