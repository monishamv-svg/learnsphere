from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


engine = create_engine(                         ##This creates database connection. FastAPI ↔ Database bridge
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}   ##SQLite has thread restrictions. FastAPI uses async/threaded behavior. This setting prevents threading errors.
)

SessionLocal = sessionmaker(      ##Database sessions manage: queries, transactions, commits, rollbacks
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()      ##SQLAlchemy base class for ORM models