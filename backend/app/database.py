"""
database.py
-----------
Sets up the SQLAlchemy engine, a session factory, and the declarative Base
that all ORM models inherit from.

`get_db` is a FastAPI dependency: it hands a database session to a route and
guarantees the session is closed afterwards (even if the route raises).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

# SQLite needs `check_same_thread=False` because FastAPI may use the
# connection across threads. This flag is SQLite-specific.
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

# Each request gets its own session from this factory.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for the ORM models in models.py
Base = declarative_base()


def get_db():
    """Yield a DB session and always close it when the request is done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
