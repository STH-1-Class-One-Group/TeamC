# PostgreSQL connection settings
from contextlib import contextmanager

import psycopg2

from app.core.config import settings


@contextmanager
def get_db_connection():
    conn = psycopg2.connect(settings.database_url, connect_timeout=3)
    try:
        yield conn
    finally:
        conn.close()
