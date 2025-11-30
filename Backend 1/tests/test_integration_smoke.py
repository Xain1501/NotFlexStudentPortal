import os
import pytest
from app.database.connection import init_db, get_connection
from app.website import create_app
import requests


def is_mysql_available():
    # Basic test to see if the configured MySQL instance is reachable
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception:
        return False


@pytest.mark.skipif(not is_mysql_available(), reason='MySQL not available')
def test_run_init_db_and_server():
    # This integration test will initialize schema using init_db
    init_db()
    # create a test app context and ensure app builds
    app = create_app()
    assert app is not None
