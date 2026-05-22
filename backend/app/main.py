from fastapi import FastAPI
from app.core.config import settings
from app.db.database import Base, engine

import app.models

Base.metadata.create_all(bind=engine)  ##Create all tables in the database/ models

app = FastAPI(                                    ##FastAPI instance/ object
    title=settings.APP_NAME,
    description="Student Management System API",
    version="1.0.0"
)


@app.get("/")     ##This is a route/endpoint. declares the URL path for the endpoint.
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}"
    }