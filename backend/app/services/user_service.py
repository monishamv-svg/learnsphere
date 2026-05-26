from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserPut
)
from app.utils.security import hash_password


def create_user(
    db: Session,
    user: UserCreate
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise ValueError(
            "Email already registered"
        )

    hashed_pw = hash_password(user.password)

    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_pw,
        role=user.role.value
    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(User)\
        .offset(skip)\
        .limit(limit)\
        .all()


def get_user_by_id(
    db: Session,
    user_id: int
):
    return db.query(User).filter(
        User.id == user_id
    ).first()


def update_user(
    db: Session,
    user_id: int,
    user_data: UserUpdate
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return None

    update_data = user_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        if key == "role":
            value = value.value

        setattr(user, key, value)

    db.commit()

    db.refresh(user)

    return user


def replace_user(
    db: Session,
    user_id: int,
    user_data: UserPut
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return None

    user.full_name = user_data.full_name
    user.role = user_data.role.value
    user.is_active = user_data.is_active

    db.commit()

    db.refresh(user)

    return user


def delete_user(
    db: Session,
    user_id: int
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return None

    db.delete(user)

    db.commit()

    return {
        "message": "User deleted successfully"
    }