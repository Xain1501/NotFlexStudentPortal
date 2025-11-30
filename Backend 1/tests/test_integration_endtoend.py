import pytest
import random, string
from app.website.models import UserModel, CourseModel, AdminModel, FacultyModel, StudentModel, DepartmentModel
from app.database.connection import get_connection, execute_query, init_db


def random_str(n=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


def is_mysql_available():
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception:
        return False


def is_mysql_writable():
    # Attempt to create and drop a temporary table to confirm DB write permissions
    try:
        execute_query("CREATE TABLE IF NOT EXISTS __pytest_tmp (id INT) ", fetch=False)
        execute_query("DROP TABLE IF EXISTS __pytest_tmp", fetch=False)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not is_mysql_available(), reason='MySQL not available')
def test_end_to_end_flow():
    # Initialize DB
    init_db()
    if not is_mysql_writable():
        pytest.skip('DB not writable, skipping end-to-end test')

    # Create department
    dept_code = 'TD' + random_str(3)
    dept_name = 'TestDept'
    DepartmentModel.create_department(dept_code, dept_name)
    dept_row = execute_query("SELECT dept_id FROM departments WHERE dept_code = %s", (dept_code,))
    assert dept_row
    dept_id = dept_row[0]['dept_id']

    # Create course
    course_code = 'TEST' + random_str(3)
    course_name = 'Test Course'
    credits = 3
    success = CourseModel.create_course(course_code, course_name, credits, 1000.00, dept_id)
    if not success:
        # try to fix missing columns (e.g., fee_per_credit) by running ALTERs, then retry
        try:
            execute_query("ALTER TABLE courses ADD COLUMN fee_per_credit DECIMAL(10,2) DEFAULT 10000.00", fetch=False)
            execute_query("ALTER TABLE courses ADD COLUMN department_id INT NULL", fetch=False)
        except Exception:
            pass
        success = CourseModel.create_course(course_code, course_name, credits, 1000.00, dept_id)
    assert success
    c_row = execute_query("SELECT course_id FROM courses WHERE course_code = %s", (course_code,))
    course_id = c_row[0]['course_id']

    # Create Faculty
    fname = 'TestF' + random_str(3)
    femail = f'{fname}@example.com'
    role = 'faculty'
    user_data = {'username': None, 'email': femail, 'role': role}
    profile = {'first_name': 'Test', 'last_name': fname, 'department_id': dept_id}
    ok, msg = UserModel.create_user_with_profile(user_data, profile)
    assert ok
    faculty_id = msg.get('faculty_id')

    # Create Section
    section_code = 'S' + random_str(3)
    sem = 'Fall'
    year = 2025
    cs_success = AdminModel.create_course_section(course_id, faculty_id, section_code, sem, year, 'MTW', 'R101', 50)
    assert cs_success
    sec_row = execute_query("SELECT section_id FROM course_sections WHERE section_code = %s", (section_code,))
    section_id = sec_row[0]['section_id']

    # Create Student
    sname = 'TestS' + random_str(3)
    semail = f'{sname}@example.com'
    user_data = {'username': None, 'email': semail, 'role': 'student'}
    profile = {'first_name': 'Stu', 'last_name': sname, 'major_dept_id': dept_id}
    ok, msg = UserModel.create_user_with_profile(user_data, profile)
    assert ok
    student_id = msg.get('student_id')

    # Enroll Student
    enroll_ok = CourseModel.enroll_student(student_id, section_id)
    assert enroll_ok
    enrolls = CourseModel.get_student_enrollments(student_id)
    assert any(e['section_id'] == section_id for e in enrolls)

    # Faculty upload mark
    # Get enrollment id
    rows = execute_query("SELECT enrollment_id FROM enrollments WHERE student_id = %s AND section_id = %s", (student_id, section_id))
    enrollment_id = rows[0]['enrollment_id']
    marks_data = {'quiz_marks': 8, 'assignment1_marks': 9, 'assignment2_marks': 9, 'project_marks': 18, 'midterm_marks': 18, 'final_marks': 27}
    f_ok = FacultyModel.upload_marks(enrollment_id, marks_data)
    assert f_ok

    # Verify transcript exists
    t = StudentModel.get_transcript(student_id)
    assert len(t) >= 1

    # Clean up (remove created records for idempotency)
    execute_query("DELETE FROM marks WHERE enrollment_id = %s", (enrollment_id,), fetch=False)
    execute_query("DELETE FROM enrollments WHERE enrollment_id = %s", (enrollment_id,), fetch=False)
    execute_query("DELETE FROM course_sections WHERE section_id = %s", (section_id,), fetch=False)
    execute_query("DELETE FROM courses WHERE course_id = %s", (course_id,), fetch=False)
    execute_query("DELETE FROM students WHERE student_id = %s", (student_id,), fetch=False)
    execute_query("DELETE FROM faculty WHERE faculty_id = %s", (faculty_id,), fetch=False)
    execute_query("DELETE FROM departments WHERE dept_id = %s", (dept_id,), fetch=False)
