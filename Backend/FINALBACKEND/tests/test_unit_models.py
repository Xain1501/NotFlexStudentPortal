import pytest
from Backend.website.models import UserModel
from Backend.website.models import StudentModel


class DummyCursor:
    def __init__(self, exec_results=None):
        self.exec_results = exec_results or []
        self._lastrowid = 1
        self.queries = []
    def execute(self, query, params=None):
        self.queries.append((query, params))
    def fetchone(self):
        return None
    def fetchall(self):
        return []
    @property
    def lastrowid(self):
        return self._lastrowid


class DummyConnection:
    def __init__(self):
        self._committed = False
    def commit(self):
        self._committed = True
    def rollback(self):
        self._committed = False
    def cursor(self):
        return DummyCursor()


def test_create_user_with_profile_disallows_multiple_admins(monkeypatch):
    # Simulate an existing admin in the DB
    monkeypatch.setattr('Backend.website.models.execute_query', lambda q, *a, **kw: [{'cnt': 1}] if 'COUNT(*)' in q else [])
    success, res = UserModel.create_user_with_profile({'role': 'admin', 'username': None, 'email': 'a@b.com'}, {})
    assert not success
    assert 'Only one admin is allowed' in res.get('message')


def test_create_user_with_profile_allows_when_no_admin(monkeypatch):
    # Simulate no existing admin, and creation flows
    monkeypatch.setattr('Backend.website.models.execute_query', lambda q, *a, **kw: [{'cnt': 0}] if 'COUNT(*)' in q else [])
    # Patch transaction so it doesn't try to access a real DB cursor
    class DummyCtxMgr:
        def __enter__(self):
            class Cur:
                lastrowid = 1
                def execute(self, *args, **kwargs):
                    return None
                def fetchone(self):
                    return None
            return ('conn', Cur())
        def __exit__(self, exc_type, exc, tb):
            return False
    monkeypatch.setattr('Backend.website.models.transaction', lambda : DummyCtxMgr())
    success, res = UserModel.create_user_with_profile({'role': 'admin', 'username': None, 'email': 'a@b.com'}, {})
    assert success
    assert isinstance(res, dict)


def test_generate_student_code_for_year_basic():
    # create cursor-like dummy to pass into generator, verify format
    class FakeCursor(DummyCursor):
        def __init__(self):
            super().__init__()
            self.storage = {}
        def execute(self, query, params=None):
            # on selection for year_small, return None initially
            pass
        def fetchone(self):
            return None
        def lastrowid(self):
            return 1

    fake_cursor = FakeCursor()
    code = StudentModel.generate_student_code_for_year(fake_cursor, 2024)
    assert isinstance(code, str)
    assert code.endswith('-001')


def test_mark_fee_paid_recomputes(monkeypatch):
    called = {'recomputed': False}

    def fake_execute(query, *args, **kwargs):
        if 'SELECT student_id, semester FROM fee_details' in query:
            return [{'student_id': 99, 'semester': 'Fall'}]
        return []

    monkeypatch.setattr('Backend.website.models.execute_query', fake_execute)
    def fake_compute(student_id, semester):
        called['recomputed'] = True
        return True
    monkeypatch.setattr('Backend.website.models.StudentModel.compute_and_update_fee_for_semester', fake_compute)
    from Backend.website.models import DepartmentModel
    res = DepartmentModel.mark_fee_paid(1)
    assert res
    assert called['recomputed']
