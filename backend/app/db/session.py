from app.db.database import SessionLocal


def get_db():
    db = SessionLocal()  ##Open DB session

    try:
        yield db   ##Use DB session
    finally:
        db.close()  ##Automatically close session