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

# Normalise the DB URL. Managed Postgres providers (incl. Render) sometimes
# hand out a "postgres://" URL, but SQLAlchemy 2.0 needs "postgresql://".
DB_URL = settings.DATABASE_URL
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs `check_same_thread=False` because FastAPI may use the
# connection across threads. This flag is SQLite-specific.
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

# pool_pre_ping keeps Postgres connections healthy across the free-tier sleeps.
engine = create_engine(
    DB_URL,
    connect_args=connect_args,
    pool_pre_ping=not DB_URL.startswith("sqlite"),
)

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
