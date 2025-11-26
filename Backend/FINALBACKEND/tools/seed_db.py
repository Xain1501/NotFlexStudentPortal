"""
Seed script for local development - Creates admin, sample dept, course, faculty, student and section
Runs with: python tools/seed_db.py
"""
import os, sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
from Backend.database.connection import execute_query, init_db
from Backend.website.models import UserModel, DepartmentModel, CourseModel, FacultyModel, AdminModel, StudentModel
import datetime

# Initialize DB and migrations
ok = init_db()
if not ok:
    print('Aborting seed: Database initialization failed')
    import sys
    sys.exit(1)

# Create or get admin
admin_user = execute_query("SELECT * FROM users WHERE role='admin' LIMIT 1")
if admin_user:
    print('Admin exists:', admin_user[0]['username'])
else:
    print('Creating default admin...')
    user_data = {'username': 'admin', 'email': 'admin@example.com', 'role': 'admin'}
    profile = {'first_name': 'Admin', 'last_name': 'User'}
    ok, res = UserModel.create_user_with_profile(user_data, profile)
    if ok:
        print('Admin created:', res)
    else:
        print('Admin creation failed:', res)

# Create sample department
dept_code = 'DEP' + str(datetime.datetime.now().microsecond % 1000)
dept_name = 'SeedDept'
print('Creating department:', dept_code, dept_name)
DepartmentModel.create_department(dept_code, dept_name)
row = execute_query('SELECT dept_id FROM departments WHERE dept_code = %s', (dept_code,))
dept_id = row[0]['dept_id'] if row else None
print('Department id:', dept_id)

# Create a sample course
course_code = 'COURSE' + str(datetime.datetime.now().microsecond % 1000)
CourseModel.create_course(course_code, 'Seed Course', 3, 1000.00, dept_id)
row = execute_query('SELECT course_id FROM courses WHERE course_code = %s', (course_code,))
course_id = row[0]['course_id'] if row else None
print('Course id:', course_id)

# Create sample faculty
user_data = {'username': None, 'email': 'faculty+seed@example.com', 'role': 'faculty'}
profile = {'first_name': 'Seed', 'last_name': 'Faculty', 'department_id': dept_id}
ok, res = UserModel.create_user_with_profile(user_data, profile)
print('Faculty create:', ok, res)
faculty_id = res.get('faculty_id') if ok else None

# Create course section (admin)
if course_id and faculty_id:
    print('Creating course section...')
    from Backend.website.models import AdminModel
    AdminModel.create_course_section(course_id, faculty_id, 'S1', 'Fall', 2025, 'MTW', 'R101', 50)
    print('Section created')

# Create sample student via admin
user_data = {'username': None, 'email': 'student+seed@example.com', 'role': 'student'}
profile = {'first_name': 'Seed', 'last_name': 'Student', 'major_dept_id': dept_id}
ok, res = UserModel.create_user_with_profile(user_data, profile)
print('Student create:', ok, res)
student_id = res.get('student_id') if ok else None

# Find section id, enroll student
row = execute_query('SELECT section_id FROM course_sections WHERE course_id = %s LIMIT 1', (course_id,))
section_id = row[0]['section_id'] if row else None
if student_id and section_id:
    from Backend.website.models import CourseModel
    CourseModel.enroll_student(student_id, section_id)
    print('Student enrolled in section', section_id)

print('Seed complete.')
