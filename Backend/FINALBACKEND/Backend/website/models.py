"""
Database Models and CRUD Operations (PYMYSQL VERSION)
"""

from Backend.database.connection import execute_query,transaction
import datetime
import re
import secrets
class AdminModel:
    """
    Admin-specific operations
    """
    
    @staticmethod
    def get_all_faculty():
        """Get all faculty members"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username, u.is_active
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.first_name, f.last_name
        """
        return execute_query(query)
    
    @staticmethod
    def mark_faculty_attendance(faculty_id, date, session, status, marked_by_user_id):
        """Mark faculty attendance"""
        query = """
            INSERT INTO faculty_attendance (faculty_id, attendance_date, session, status, marked_by)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = %s, marked_at = CURRENT_TIMESTAMP
        """
        try:
            execute_query(query, (faculty_id, date, session, status, marked_by_user_id, status), fetch=False)
            return True
        except Exception as e:
            print(f"Faculty attendance mark error: {e}")
            return False
    
    @staticmethod
    def get_faculty_attendance_by_date(date):
        """Get all faculty attendance for a specific date"""
        query = """
            SELECT 
                fa.attendance_id,
                fa.faculty_id,
                f.faculty_code,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                f.department_id,
                d.dept_name,
                fa.attendance_date,
                fa.session,
                fa.status,
                fa.marked_at,
                CONCAT(u.username) as marked_by_username
            FROM faculty_attendance fa
            JOIN faculty f ON fa.faculty_id = f.faculty_id
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON fa.marked_by = u.user_id
            WHERE fa.attendance_date = %s
            ORDER BY f.first_name, f.last_name, fa.session
        """
        return execute_query(query, (date,))

    @staticmethod
    def get_faculty_attendance_summary():
        """Get faculty attendance summary"""
        query = """
            SELECT 
                f.faculty_id,
                f.faculty_code,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                d.dept_name,
                COUNT(fa.attendance_id) as total_days,
                SUM(CASE WHEN fa.status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN fa.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                ROUND((SUM(CASE WHEN fa.status = 'present' THEN 1 ELSE 0 END) / COUNT(fa.attendance_id)) * 100, 2) as attendance_percentage
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            LEFT JOIN faculty_attendance fa ON f.faculty_id = fa.faculty_id
            WHERE f.status = 'active'
            GROUP BY f.faculty_id, f.faculty_code, f.first_name, f.last_name, d.dept_name
            ORDER BY f.first_name, f.last_name
        """
        return execute_query(query)

    @staticmethod
    def mark_multiple_faculty_attendance(attendance_data, marked_by_user_id):
        """Mark attendance for multiple faculty at once"""
        try:
            for record in attendance_data:
                faculty_id = record['faculty_id']
                date = record['date']
                session = record['session']
                status = record['status']
                
                query = """
                    INSERT INTO faculty_attendance (faculty_id, attendance_date, session, status, marked_by)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE status = %s, marked_at = CURRENT_TIMESTAMP
                """
                execute_query(query, (faculty_id, date, session, status, marked_by_user_id, status), fetch=False)
            
            return True
        except Exception as e:
            print(f"Multiple faculty attendance error: {e}")
            return False
    
    @staticmethod
    def get_all_courses_with_details():
        """Get all courses with section and faculty details"""
        query = """
            SELECT 
                cs.section_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                cs.max_capacity,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                f.faculty_code,
                COUNT(e.enrollment_id) as enrolled_students
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            GROUP BY cs.section_id
            ORDER BY cs.year DESC, cs.semester, c.course_code
        """
        return execute_query(query)

    @staticmethod
    def get_admin_by_user_id(user_id):
        """Get admin personal info by user_id"""
        query = """
            SELECT a.*, u.username, u.email
            FROM admin_info a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.user_id = %s
        """
        result = execute_query(query, (user_id,))
        return result[0] if result else None
    
    @staticmethod
    def get_system_statistics():
        """Get comprehensive system statistics for admin dashboard"""
        query = """
            SELECT 
                (SELECT COUNT(*) FROM students WHERE status = 'active') as active_students,
                (SELECT COUNT(*) FROM faculty WHERE status = 'active') as active_faculty,
                (SELECT COUNT(*) FROM courses) as total_courses,  # Removed is_active check
                (SELECT COUNT(*) FROM course_sections WHERE semester = 'Fall' AND year = YEAR(CURDATE())) as current_sections,  # Removed is_active check
                (SELECT COUNT(*) FROM fee_details WHERE status = 'pending') as pending_fees,
                (SELECT COUNT(*) FROM faculty_leaves WHERE status = 'pending') as pending_leaves,
                (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users
        """
        result = execute_query(query)
        return result[0] if result else {}

    @staticmethod
    def create_admin_info(user_id, name, department, email, contact):
        query = "INSERT INTO admin_info (user_id, name, department, email, contact) VALUES (%s, %s, %s, %s, %s)"
        try:
            execute_query(query, (user_id, name, department, email, contact), fetch=False)
            return True
        except Exception as e:
            print(f"Create admin info error: {e}")
            return False

    @staticmethod
    def update_admin_info(user_id, update_data):
        if not update_data:
            return False
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(user_id)
        query = f"UPDATE admin_info SET {set_clause} WHERE user_id = %s"
        try:
            execute_query(query, values, fetch=False)
            return True
        except Exception as e:
            print(f"Update admin info error: {e}")
            return False

    @staticmethod
    def get_all_announcements():
        query = """
            SELECT a.*, u.username as created_by_name
            FROM admin_announcements a
            JOIN users u ON a.created_by = u.user_id
            WHERE a.is_active = TRUE
            ORDER BY a.created_at DESC
        """
        return execute_query(query)

    @staticmethod
    def create_announcement(title, message, announcement_type, created_by):
        query = "INSERT INTO admin_announcements (title, message, type, created_by) VALUES (%s, %s, %s, %s)"
        try:
            execute_query(query, (title, message, announcement_type, created_by), fetch=False)
            return True
        except Exception as e:
            print(f"Create announcement error: {e}")
            return False

    @staticmethod
    def create_course_section(course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity=30):
        """Create new course section WITH FACULTY TEACHING LIMIT"""
        try:
            with transaction() as (conn, cursor):
                # Check faculty teaching limit
                cursor.execute("SELECT COUNT(*) as cnt FROM course_sections WHERE faculty_id=%s AND is_active=TRUE FOR UPDATE", (faculty_id,))
                row = cursor.fetchone()
                cnt = row['cnt'] if row else 0
                if cnt >= 3:
                    raise ValueError("Faculty already teaching maximum allowed active sections (3)")
                
                query = """
                    INSERT INTO course_sections (course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                """
                cursor.execute(query, (course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity))
                # update faculty salary after creating a new section
                # do it outside transaction helper using our model method
                # we still call compute_and_update_salary to ensure consistency
            try:
                FacultyModel.compute_and_update_salary(faculty_id)
            except Exception:
                # ensure that even if salary update fails, section creation still completes
                pass
            return True
        except Exception as e:
            print(f"Create course section error: {e}")
            return False
    
    @staticmethod
    def update_course_section(section_id, **kwargs):
        """Update course section details"""
        if not kwargs:
            return False
        
        set_clause = ", ".join([f"{key} = %s" for key in kwargs.keys()])
        values = list(kwargs.values())
        values.append(section_id)
        
        query = f"UPDATE course_sections SET {set_clause} WHERE section_id = %s"
        
        try:
            # fetch previous state to detect changes
            old = execute_query("SELECT faculty_id, is_active FROM course_sections WHERE section_id = %s", (section_id,))
            old_fac = old[0]['faculty_id'] if old else None
            old_active = old[0]['is_active'] if old else None
            execute_query(query, values, fetch=False)

            # If faculty assignment changed or activation changed, recompute salaries
            new = execute_query("SELECT faculty_id, is_active FROM course_sections WHERE section_id = %s", (section_id,))
            new_fac = new[0]['faculty_id'] if new else None
            new_active = new[0]['is_active'] if new else None

            # Recompute for old and new faculty if applicable
            try:
                if old_fac and old_fac != new_fac:
                    FacultyModel.compute_and_update_salary(old_fac)
                if new_fac:
                    FacultyModel.compute_and_update_salary(new_fac)
                # If is_active changed, recompute for current faculty
                if old_active != new_active and new_fac:
                    FacultyModel.compute_and_update_salary(new_fac)
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"Update course section error: {e}")
            return False

# ========== DEPARTMENT MODEL ==========
class DepartmentModel:
    """Department operations"""
    
    @staticmethod
    def get_all_departments():
        """Get all departments"""
        query = "SELECT * FROM departments ORDER BY dept_name"
        return execute_query(query)
    
    @staticmethod
    def create_department(dept_code, dept_name):
        """Create new department"""
        query = "INSERT INTO departments (dept_code, dept_name) VALUES (%s, %s)"
        try:
            execute_query(query, (dept_code, dept_name), fetch=False)
            return True
        except Exception as e:
            print(f"Create department error: {e}")
            return False
    @staticmethod
    def get_all_users():
        """Get all users for admin"""
        query = """
            SELECT u.*, 
                s.student_code, s.first_name as student_first_name, s.last_name as student_last_name,
                f.faculty_code, f.first_name as faculty_first_name, f.last_name as faculty_last_name
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            LEFT JOIN faculty f ON u.user_id = f.user_id
            ORDER BY u.created_at DESC
        """
        return execute_query(query)

    @staticmethod
    def add_course_to_department(course_id, department_id):
        """Assign a course to a department"""
        try:
            query = "UPDATE courses SET department_id = %s WHERE course_id = %s"
            execute_query(query, (department_id, course_id), fetch=False)
            return True
        except Exception as e:
            print(f"Add course to department error: {e}")
            return False

    @staticmethod
    def drop_course_from_department(course_id):
        """Unassign a course from its department"""
        try:
            query = "UPDATE courses SET department_id = NULL WHERE course_id = %s"
            execute_query(query, (course_id,), fetch=False)
            return True
        except Exception as e:
            print(f"Drop course from department error: {e}")
            return False
    
    @staticmethod
    def get_all_fee_details():
        """Get all fee details for admin with component breakdown"""
        query = """
            SELECT f.*, s.student_code, s.first_name, s.last_name,
                (f.tuition_fee + f.lab_fee + f.miscellaneous_fee) as total_due
            FROM fee_details f
            JOIN students s ON f.student_id = s.student_id
            ORDER BY f.due_date DESC
        """
        return execute_query(query)

    @staticmethod
    def add_fee_record(student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date):
        """Add new fee record with component breakdown"""
        query = """
            INSERT INTO fee_details (student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
        """
        try:
            execute_query(query, (student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date), fetch=False)
            return True
        except Exception as e:
            print(f"Add fee record error: {e}")
            return False
    
    @staticmethod
    def mark_fee_paid(fee_id):
        """Mark fee as paid"""
        query = """
            UPDATE fee_details 
            SET status = 'paid', payment_date = CURDATE()
            WHERE fee_id = %s
        """
        try:
            # figure out the student_id and semester to recompute balance
            row = execute_query("SELECT student_id, semester FROM fee_details WHERE fee_id = %s", (fee_id,))
            if not row:
                return False
            student_id = row[0]['student_id']
            semester = row[0]['semester']
            # also set amount_paid to amount_due when marking paid
            execute_query("UPDATE fee_details SET status = 'paid', payment_date = CURDATE(), amount_paid = amount_due WHERE fee_id = %s", (fee_id,), fetch=False)
            # recompute balance for the student (all semesters) - call compute for the specific semester and then compute total balance
            StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        except Exception as e:
            print(f"Mark fee paid error: {e}")
            return False
    
    @staticmethod
    def get_all_students_for_admin():
        """Get all students for admin management"""
        query = """
            SELECT s.*, d.dept_name, u.email, u.username, u.is_active,
                   (SELECT COUNT(*) FROM enrollments WHERE student_id = s.student_id AND status = 'enrolled') as enrolled_courses
            FROM students s
            JOIN departments d ON s.major_dept_id = d.dept_id
            JOIN users u ON s.user_id = u.user_id
            ORDER BY s.first_name, s.last_name
        """
        return execute_query(query)
    
    @staticmethod
    def update_student(student_id, update_data):
        """Update student information"""
        if not update_data:
            return False
        
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(student_id)
        
        query = f"UPDATE students SET {set_clause} WHERE student_id = %s"
        
        try:
            execute_query(query, values, fetch=False)
            return True
        except Exception as e:
            print(f"Update student error: {e}")
            return False

    @staticmethod
    def get_student_by_id(student_id):
        """Get student by ID with all details"""
        query = """
            SELECT s.*, d.dept_name, u.email, u.username, u.is_active
            FROM students s
            JOIN departments d ON s.major_dept_id = d.dept_id
            JOIN users u ON s.user_id = u.user_id
            WHERE s.student_id = %s
        """
        result = execute_query(query, (student_id,))
        return result[0] if result else None

#================= TO DO LIST FOR ADMIN MODEL =================
        
#get_course_section() from section table we fetch student id ,faculty id course name
#add_course_to_department() admin add/drop courses from department
    #will have to add foriegn key of dept into course 
#get_faculty_info for admin page fetch faculty id , name and dept 
#and course section they are teaching 

#when creating users admin should have fucntion to store the personal info mannually
#new_Student_info_add
#new_faculty_info_Add
#both functions will directly add into table of students and faculty 
#then link to user id
#which creates the login credentials
#where should student code and faculty code be generated?

#generate_faculty_code similar to student code generator on basis of
#year of joining

#approve leave for faculty


# ========== USER MODEL ==========
class UserModel:
    """User operations"""
    @staticmethod
    def create_user(username, password_hash, email, role='student'):
        """Create a new user and return user_id"""
        query = "INSERT INTO users (username, password_hash, email, role) VALUES (%s, %s, %s, %s)"
        try:
            if role == 'admin':
                existing_admins = execute_query("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'")
                cnt = existing_admins[0]['cnt'] if existing_admins else 0
                if cnt > 0:
                    print('Create user error: only one admin allowed')
                    return None
            execute_query(query, (username, password_hash, email, role), fetch=False)
            # return last inserted id
            res = execute_query("SELECT LAST_INSERT_ID() as id")
            return res[0]['id'] if res else None
        except Exception as e:
            print(f"Create user error: {e}")
            return None

    @staticmethod
    def get_user_by_id(user_id):
        query = "SELECT * FROM users WHERE user_id = %s"
        res = execute_query(query, (user_id,))
        return res[0] if res else None

    @staticmethod
    def get_user_by_username(username):
        query = "SELECT * FROM users WHERE username = %s"
        res = execute_query(query, (username,))
        return res[0] if res else None

    @staticmethod
    def authenticate_user(username, password):
        """Simple authentication (in production, use hashed passwords)"""
        user = UserModel.get_user_by_username(username)
        if not user:
            return None
        # In production compare hashed password; here password stored in password_hash
        if user['password_hash'] == password:
            return user
        return None

    @staticmethod
    def create_user_with_profile(user_data, profile_data):
        """Create user and attach profile (student or faculty) in a single transaction.
        Returns tuple (success: bool, result: dict/message)
        """
        role = user_data.get('role', 'student')
        password = user_data.get('password_hash') or secrets.token_urlsafe(8)
        username = user_data.get('username')
        email = user_data.get('email')
        try:
            # Enforce single-admin restriction: only one admin allowed
            role = user_data.get('role', 'student')
            if role == 'admin':
                existing_admins = execute_query("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'")
                cnt = existing_admins[0]['cnt'] if existing_admins else 0
                if cnt > 0:
                    return False, {'message': 'Only one admin is allowed in the system'}
            with transaction() as (conn, cursor):
                # if username not provided, generate one based on student/faculty code
                if not username:
                    if role == 'student':
                        enrollment_date = profile_data.get('enrollment_date') or datetime.date.today()
                        year_full = enrollment_date.year if isinstance(enrollment_date, datetime.date) else datetime.date.today().year
                        username = StudentModel.generate_student_code_for_year(cursor, year_full)
                    elif role == 'faculty':
                        hire_date = profile_data.get('hire_date') or datetime.date.today()
                        year_full = hire_date.year if isinstance(hire_date, datetime.date) else datetime.date.today().year
                        username = FacultyModel.generate_faculty_code_for_year(cursor, year_full)
                    else:
                        # fallback to email/local part
                        username = (email.split('@')[0] if email else secrets.token_urlsafe(6))
                # create users
                cursor.execute("INSERT INTO users (username, password_hash, email, role) VALUES (%s, %s, %s, %s)", (username, password, email, role))
                user_id = cursor.lastrowid

                if role == 'student':
                    # create student profile
                    # if student_code provided use it; else generate
                    enrollment_date = profile_data.get('enrollment_date') or datetime.date.today()
                    year_full = enrollment_date.year if isinstance(enrollment_date, datetime.date) else datetime.date.today().year
                    student_code = profile_data.get('student_code') or StudentModel.generate_student_code_for_year(cursor, year_full)
                    cursor.execute(
                        "INSERT INTO students (user_id, student_code, first_name, last_name, date_of_birth, phone, cnic, enrollment_date, major_dept_id, current_semester, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        (user_id, student_code, profile_data.get('first_name'), profile_data.get('last_name'), profile_data.get('date_of_birth'), profile_data.get('phone'), profile_data.get('cnic'), enrollment_date, profile_data.get('major_dept_id'), profile_data.get('current_semester', 1), profile_data.get('status', 'active'))
                    )
                    profile_id = cursor.lastrowid
                    # return generated username and student_code for front-end display
                    result = {'user_id': user_id, 'student_id': profile_id, 'username': username, 'student_code': student_code, 'password': password}
                elif role == 'faculty':
                    hire_date = profile_data.get('hire_date') or datetime.date.today()
                    year_full = hire_date.year if isinstance(hire_date, datetime.date) else datetime.date.today().year
                    faculty_code = profile_data.get('faculty_code') or FacultyModel.generate_faculty_code_for_year(cursor, year_full)
                    cursor.execute(
                        "INSERT INTO faculty (user_id, faculty_code, first_name, last_name, department_id, phone, hire_date, status, salary, email) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        (user_id, faculty_code, profile_data.get('first_name'), profile_data.get('last_name'), profile_data.get('department_id'), profile_data.get('phone'), hire_date, profile_data.get('status', 'active'), profile_data.get('salary', 0.0), profile_data.get('email'))
                    )
                    profile_id = cursor.lastrowid
                    result = {'user_id': user_id, 'faculty_id': profile_id, 'username': username, 'faculty_code': faculty_code, 'password': password}
                else:
                    result = {'user_id': user_id}
            return True, result
        except Exception as e:
            print(f"Create user/profile error: {e}")
            return False, {'message': str(e)}


# ========== COURSE MODEL ==========
class CourseModel:
    """Course helper operations"""
    @staticmethod
    def get_course_id_by_section(section_id):
        query = "SELECT course_id FROM course_sections WHERE section_id = %s"
        res = execute_query(query, (section_id,))
        return res[0]['course_id'] if res else None

    @staticmethod
    def get_student_enrollments(student_id):
        query = """
            SELECT e.enrollment_id, e.section_id, cs.section_code, cs.semester, cs.year, c.course_code, c.course_name, c.credits, cs.room, cs.schedule, e.status
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE e.student_id = %s
        """
        return execute_query(query, (student_id,))

    @staticmethod
    def check_seats_available(section_id):
        # Return available seats and total enrolled
        query = "SELECT max_capacity, (SELECT COUNT(*) FROM enrollments WHERE section_id = %s AND status = 'enrolled') as enrolled FROM course_sections WHERE section_id = %s"
        res = execute_query(query, (section_id, section_id))
        if not res:
            return None
        row = res[0]
        seats_available = row['max_capacity'] - (row.get('enrolled') or 0)
        return {'max_capacity': row['max_capacity'], 'enrolled': row.get('enrolled') or 0, 'seats_available': seats_available}

    @staticmethod
    def enroll_student(student_id, section_id):
        # Concurrency-safe enrollment using transactions and row locking
        try:
            with transaction() as (conn, cursor):
                # Lock the section row to ensure seats are consistent
                cursor.execute("SELECT max_capacity FROM course_sections WHERE section_id = %s FOR UPDATE", (section_id,))
                row = cursor.fetchone()
                if not row:
                    raise ValueError("Section not found")
                max_capacity = row['max_capacity']
                # Count existing enrolled (lock enrollments rows)
                cursor.execute("SELECT COUNT(*) as enrolled FROM enrollments WHERE section_id = %s AND status = 'enrolled' FOR UPDATE", (section_id,))
                enrolled_row = cursor.fetchone()
                enrolled_cnt = enrolled_row['enrolled'] if enrolled_row else 0
                if enrolled_cnt >= max_capacity:
                    raise ValueError("Course section is full")
                # check if student already enrolled
                cursor.execute("SELECT * FROM enrollments WHERE student_id = %s AND section_id = %s AND status = 'enrolled'", (student_id, section_id))
                if cursor.fetchone():
                    raise ValueError("Student already enrolled in this section")
                # insert enrollment
                cursor.execute("INSERT INTO enrollments (student_id, section_id, enrollment_date, status) VALUES (%s, %s, CURDATE(), 'enrolled')", (student_id, section_id))
                # Capture semester to recompute fees after commit
                cursor.execute("SELECT semester FROM course_sections WHERE section_id = %s", (section_id,))
                sec = cursor.fetchone()
                semester = sec['semester'] if sec else None
            # After transaction commit, recompute fees
            if semester:
                StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        except Exception as e:
            print(f"Enroll student error: {e}")
            return False

    @staticmethod
    def drop_course(student_id, section_id):
        try:
            with transaction() as (conn, cursor):
                cursor.execute("SELECT enrollment_id FROM enrollments WHERE student_id = %s AND section_id = %s AND status = 'enrolled' FOR UPDATE", (student_id, section_id))
                row = cursor.fetchone()
                if not row:
                    raise ValueError("Enrollment not found")
                enrollment_id = row['enrollment_id']
                cursor.execute("UPDATE enrollments SET status = 'dropped' WHERE enrollment_id = %s", (enrollment_id,))
                # Recompute student's fee for semester
                cursor.execute("SELECT semester FROM course_sections WHERE section_id = %s", (section_id,))
                sec = cursor.fetchone()
                semester = sec['semester'] if sec else None
                if semester:
                    StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        except Exception as e:
            print(f"Drop course error: {e}")
            return False

    @staticmethod
    def get_available_courses(semester, year):
        query = """
            SELECT cs.section_id, cs.section_code, cs.semester, cs.year, c.course_code, c.course_name, c.credits, cs.max_capacity, (SELECT COUNT(*) FROM enrollments e WHERE e.section_id = cs.section_id AND e.status = 'enrolled') as enrolled
            FROM course_sections cs
            JOIN courses c ON c.course_id = cs.course_id
            WHERE cs.semester = %s AND cs.year = %s AND cs.is_active = TRUE
        """
        return execute_query(query, (semester, year))

    @staticmethod
    def create_course(course_code, course_name, credits, fee_per_credit=10000.00, department_id=None):
        query = "INSERT INTO courses (course_code, course_name, credits, fee_per_credit, department_id) VALUES (%s, %s, %s, %s, %s)"
        try:
            execute_query(query, (course_code, course_name, credits, fee_per_credit, department_id), fetch=False)
            return True
        except Exception as e:
            print(f"Create course error: {e}")
            return False

    @staticmethod
    def update_course(course_id, update_data):
        if not update_data:
            return False
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(course_id)
        query = f"UPDATE courses SET {set_clause} WHERE course_id = %s"
        try:
            execute_query(query, values, fetch=False)
            return True
        except Exception as e:
            print(f"Update course error: {e}")
            return False

    @staticmethod
    def delete_course(course_id):
        try:
            execute_query("DELETE FROM courses WHERE course_id = %s", (course_id,), fetch=False)
            return True
        except Exception as e:
            print(f"Delete course error: {e}")
            return False


# ========== STUDENT MODEL ==========
class StudentModel:
    """Student operations including creation and fee calculations"""

    @staticmethod
    def generate_student_code_for_year(cursor, year_full):
        """
        Transactional generator: expects to be called inside a transaction with cursor.
        Uses table student_code_seq(year_small PK, last_seq)
        Produces 'YYk-XXX'
        """
        # Use an atomic upsert pattern to avoid race conditions on initial row creation
        yy = year_full % 100
        cursor.execute(
            "INSERT INTO student_code_seq (year_small, last_seq) VALUES (%s, 1) "
            "ON DUPLICATE KEY UPDATE last_seq = last_seq + 1", (year_full,)
        )
        # read back the current number
        cursor.execute("SELECT last_seq FROM student_code_seq WHERE year_small = %s", (year_full,))
        row = cursor.fetchone()
        last_seq = row['last_seq'] if row else 1
        student_code = f"{yy:02d}k-{last_seq:03d}"
        if not re.match(r'^\d{2}k-\d{3}$', student_code):
            raise ValueError("Generated student_code invalid")
        return student_code

    @staticmethod
    def create_student(username, password_hash, email, first_name, last_name, date_of_birth, phone, cnic, enrollment_date, major_dept_id, current_semester=1, status='active'):
        """Create new user and student record and return student_id"""
        try:
            with transaction() as (conn, cursor):
                # create user
                cursor.execute("INSERT INTO users (username, password_hash, email, role) VALUES (%s, %s, %s, 'student')", (username, password_hash, email))
                user_id = cursor.lastrowid

                # generate student_code
                year_full = enrollment_date.year if isinstance(enrollment_date, datetime.date) else datetime.date.today().year
                student_code = StudentModel.generate_student_code_for_year(cursor, year_full)

                # insert student
                cursor.execute(
                    "INSERT INTO students (user_id, student_code, first_name, last_name, date_of_birth, phone, cnic, enrollment_date, major_dept_id, current_semester, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (user_id, student_code, first_name, last_name, date_of_birth, phone, cnic, enrollment_date, major_dept_id, current_semester, status)
                )
                student_id = cursor.lastrowid
                return student_id
        except Exception as e:
            print(f"Create student error: {e}")
            return None

    @staticmethod
    def get_student_by_user_id(user_id):
        """Get student details by user_id"""
        query = """
            SELECT s.*, d.dept_name, u.email, u.username
            FROM students s
            JOIN departments d ON s.major_dept_id = d.dept_id
            JOIN users u ON s.user_id = u.user_id
            WHERE s.user_id = %s
        """
        result = execute_query(query, (user_id,))
        return result[0] if result else None

    @staticmethod
    def get_student_by_student_code(student_code):
        """Get student by roll number"""
        query = """
            SELECT s.*, d.dept_name
            FROM students s
            JOIN departments d ON s.major_dept_id = d.dept_id
            WHERE s.student_code = %s
        """
        result = execute_query(query, (student_code,))
        return result[0] if result else None

    @staticmethod
    def get_enrolled_courses(student_id):
        """Get all courses a student is enrolled in (enrolled only)"""
        # Use CourseModel helper or run the SQL directly
        return CourseModel.get_student_enrollments(student_id)

    @staticmethod
    def get_attendance_summary(student_id):
        """Get attendance summary for all enrolled courses"""
        query = """
            SELECT 
                c.course_code,
                c.course_name,
                COUNT(a.attendance_id) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.attendance_id)) * 100, 2) as attendance_percentage
            FROM attendance a
            JOIN course_sections cs ON a.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE a.student_id = %s
            GROUP BY c.course_id, c.course_code, c.course_name
        """
        return execute_query(query, (student_id,))

    @staticmethod
    def get_all_marks(student_id):
        """Get marks for all enrolled courses (summary)"""
        query = """
            SELECT 
                c.course_code,
                c.course_name,
                m.*,
                sg.total_obtained,
                sg.percentage,
                sg.final_grade,
                sg.grade_points
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            LEFT JOIN marks m ON e.enrollment_id = m.enrollment_id
            LEFT JOIN student_grades sg ON m.mark_id = sg.mark_id
            WHERE e.student_id = %s
              AND e.status = 'enrolled'
        """
        return execute_query(query, (student_id,))

    @staticmethod
    def get_transcript(student_id):
        """Get complete transcript for student"""
        query = """
            SELECT 
                t.transcript_id,
                t.course_code,
                t.course_name,
                t.credits,
                t.semester,
                t.final_grade,
                t.grade_points
            FROM transcript t
            WHERE t.student_id = %s
            ORDER BY t.semester DESC
        """
        return execute_query(query, (student_id,))

    @staticmethod
    def calculate_gpa(student_id, semester=None):
        """Calculate CGPA (if semester None) or SGPA (if semester provided)"""
        if semester:
            query = """
                SELECT ROUND(SUM(grade_points * credits) / SUM(credits), 2) as gpa
                FROM transcript
                WHERE student_id = %s AND semester = %s
            """
            result = execute_query(query, (student_id, semester))
        else:
            query = """
                SELECT ROUND(SUM(grade_points * credits) / SUM(credits), 2) as gpa
                FROM transcript
                WHERE student_id = %s
            """
            result = execute_query(query, (student_id,))
        return result[0]['gpa'] if result and result[0] and result[0].get('gpa') else 0.0

    @staticmethod
    def get_fee_details(student_id):
        """Get fee details for a student"""
        query = "SELECT * FROM fee_details WHERE student_id = %s ORDER BY semester DESC"
        return execute_query(query, (student_id,))

    @staticmethod
    def get_student_announcements(student_id):
        """Return announcements relevant to a student: admin announcements + faculty announcements for sections the student is enrolled in."""
        try:
            # Admin announcements
            admin_announcements = AdminModel.get_all_announcements()

            # Faculty announcements for student's enrolled sections
            query = """
                SELECT a.*, f.faculty_code, CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                       cs.section_code, c.course_code, c.course_name
                FROM announcements a
                JOIN course_sections cs ON a.section_id = cs.section_id
                JOIN courses c ON cs.course_id = c.course_id
                JOIN faculty f ON a.faculty_id = f.faculty_id
                WHERE a.section_id IN (
                    SELECT section_id FROM enrollments WHERE student_id = %s AND status = 'enrolled'
                )
                ORDER BY a.created_at DESC
            """
            faculty_announcements = execute_query(query, (student_id,))
            # Merge and return
            return {
                'admin': admin_announcements,
                'faculty': faculty_announcements
            }
        except Exception as e:
            print(f"Get student announcements error: {e}")
            return {'admin': [], 'faculty': []}

    @staticmethod
    def compute_current_gpa(student_id):
        """Compute GPA: prefer transcript data; if none, compute from student_grades (latest marks)."""
        # Check transcript entries
        t_query = "SELECT COUNT(*) as cnt FROM transcript WHERE student_id = %s"
        t_res = execute_query(t_query, (student_id,))
        cnt = t_res[0]['cnt'] if t_res else 0
        if cnt > 0:
            gpa = StudentModel.calculate_gpa(student_id)
            return gpa
        # Fallback: aggregate from student_grades view
        sg_query = "SELECT ROUND(SUM(grade_points * c.credits) / SUM(c.credits),2) as gpa FROM student_grades sg JOIN enrollments e ON sg.enrollment_id = e.enrollment_id JOIN course_sections cs ON e.section_id = cs.section_id JOIN courses c ON cs.course_id = c.course_id WHERE e.student_id = %s"
        res = execute_query(sg_query, (student_id,))
        if res and res[0] and res[0].get('gpa'):
            return res[0]['gpa']
        return 0.0

    @staticmethod
    def add_fee_record(student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date):
        """Add a fee record and update student's fee balance"""
        res = DepartmentModel.add_fee_record(student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, due_date)
        if res:
            StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        return False

    @staticmethod
    def get_all_fee_details():
        """Return all fee detail records for admin overview"""
        return DepartmentModel.get_all_fee_details()

    @staticmethod
    def get_all_students_for_admin():
        """Return all students for admin (wrapper)"""
        return DepartmentModel.get_all_students_for_admin()

    @staticmethod
    def get_student_by_id(student_id):
        """Wrapper to DepartmentModel.get_student_by_id for consistency"""
        return DepartmentModel.get_student_by_id(student_id)

    @staticmethod
    def update_student(student_id, update_data):
        """Wrapper to DepartmentModel.update_student"""
        return DepartmentModel.update_student(student_id, update_data)

    @staticmethod
    def enroll(student_id, section_id, enrollment_date=None):
        """Enroll a student into a section and compute fees for related semester"""
        try:
            with transaction() as (conn, cursor):
                cursor.execute("INSERT INTO enrollments (student_id, section_id, enrollment_date, status) VALUES (%s, %s, %s, 'enrolled')", (student_id, section_id, enrollment_date or datetime.date.today()))
                enrollment_id = cursor.lastrowid
                # fetch semester for this section
                cursor.execute("SELECT semester FROM course_sections WHERE section_id = %s", (section_id,))
                sec = cursor.fetchone()
                semester = sec['semester'] if sec else None
            if semester:
                # update fee record for that semester
                StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        except Exception as e:
            print(f"Enroll error: {e}")
            return False

    @staticmethod
    def drop_enrollment(enrollment_id):
        """Mark enrollment dropped and update fee calculation for that student and semester"""
        try:
            with transaction() as (conn, cursor):
                cursor.execute("SELECT student_id, section_id FROM enrollments WHERE enrollment_id = %s", (enrollment_id,))
                row = cursor.fetchone()
                if not row:
                    return False
                student_id = row['student_id']
                section_id = row['section_id']
                cursor.execute("UPDATE enrollments SET status = 'dropped' WHERE enrollment_id = %s", (enrollment_id,))
                cursor.execute("SELECT semester FROM course_sections WHERE section_id = %s", (section_id,))
                sec = cursor.fetchone()
                semester = sec['semester'] if sec else None
            if semester:
                StudentModel.compute_and_update_fee_for_semester(student_id, semester)
            return True
        except Exception as e:
            print(f"Drop enrollment error: {e}")
            return False

    @staticmethod
    def compute_and_update_fee_for_semester(student_id, semester, year=None):
        """Compute tuition based on enrollments and update fee_details and student's fee_balance"""
        try:
            with transaction() as (conn, cursor):
                # compute tuition_fee from enrolled courses
                # join enrollments -> course_sections -> courses
                args=(student_id, semester)
                query = """
                    SELECT IFNULL(SUM(c.credits * c.fee_per_credit), 0) as tuition
                    FROM enrollments e
                    JOIN course_sections cs ON e.section_id = cs.section_id
                    JOIN courses c ON cs.course_id = c.course_id
                    WHERE e.student_id = %s AND e.status = 'enrolled' AND cs.semester = %s
                """
                cursor.execute(query, args)
                row = cursor.fetchone()
                tuition_fee = float(row['tuition']) if row and row['tuition'] is not None else 0.00

                # find fee_details record for this student & semester
                cursor.execute("SELECT fee_id, tuition_fee, lab_fee, miscellaneous_fee, amount_paid FROM fee_details WHERE student_id = %s AND semester = %s FOR UPDATE", (student_id, semester))
                fd = cursor.fetchone()
                if fd:
                    lab_fee = fd.get('lab_fee', 0.00) or 0.00
                    misc = fd.get('miscellaneous_fee', 0.00) or 0.00
                    amount_due = tuition_fee + lab_fee + misc
                    cursor.execute("UPDATE fee_details SET tuition_fee = %s, amount_due = %s WHERE fee_id = %s", (tuition_fee, amount_due, fd['fee_id']))
                else:
                    # Insert new fee_details record with computed tuition
                    amount_due = tuition_fee
                    cursor.execute("INSERT INTO fee_details (student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, amount_due, status) VALUES (%s, %s, %s, 0.00, 0.00, %s, 'pending')", (student_id, semester, tuition_fee, amount_due))

                # compute total outstanding by subtracting amount_paid
                cursor.execute("SELECT IFNULL(SUM(amount_due - amount_paid), 0) as balance FROM fee_details WHERE student_id = %s", (student_id,))
                total_row = cursor.fetchone()
                balance = float(total_row['balance']) if total_row and total_row['balance'] is not None else 0.00
                cursor.execute("UPDATE students SET fee_balance = %s WHERE student_id = %s", (balance, student_id))
            return True
        except Exception as e:
            print(f"Compute and update fee error: {e}")
            return False

    @staticmethod
    def update_transcript(student_id, course_code, course_name, credits, semester, final_grade, grade_points):
        """Insert or update transcript entry for a student"""
        try:
            # check if an entry exists for this student-course-semester
            existing = execute_query("SELECT transcript_id FROM transcript WHERE student_id = %s AND course_code = %s AND semester = %s", (student_id, course_code, semester))
            if existing:
                transcript_id = existing[0]['transcript_id']
                query = "UPDATE transcript SET course_name = %s, credits = %s, final_grade = %s, grade_points = %s WHERE transcript_id = %s"
                execute_query(query, (course_name, credits, final_grade, grade_points, transcript_id), fetch=False)
            else:
                query = "INSERT INTO transcript (student_id, course_code, course_name, credits, semester, final_grade, grade_points) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                execute_query(query, (student_id, course_code, course_name, credits, semester, final_grade, grade_points), fetch=False)
            return True
        except Exception as e:
            print(f"Update transcript error: {e}")
            return False


# ========== FACULTY MODEL ==========
class FacultyModel:
    """Faculty operations including creation and salary calculations"""

    @staticmethod
    def generate_faculty_code_for_year(cursor, year_full):
        # Use atomic upsert to generate unique incremental codes safely under concurrency
        yy = year_full % 100
        cursor.execute(
            "INSERT INTO faculty_code_seq (year_small, last_seq) VALUES (%s, 1) "
            "ON DUPLICATE KEY UPDATE last_seq = last_seq + 1", (year_full,)
        )
        cursor.execute("SELECT last_seq FROM faculty_code_seq WHERE year_small = %s", (year_full,))
        row = cursor.fetchone()
        last_seq = row['last_seq'] if row else 1
        faculty_code = f"{yy:02d}f-{last_seq:03d}"
        if not re.match(r'^\d{2}f-\d{3}$', faculty_code):
            raise ValueError("Generated faculty_code invalid")
        return faculty_code

    @staticmethod
    def create_faculty(username, password_hash, email, first_name, last_name, department_id, phone, hire_date=None, status='active'):
        try:
            with transaction() as (conn, cursor):
                # create user
                cursor.execute("INSERT INTO users (username, password_hash, email, role) VALUES (%s, %s, %s, 'faculty')", (username, password_hash, email))
                user_id = cursor.lastrowid

                year_full = hire_date.year if isinstance(hire_date, datetime.date) else datetime.date.today().year
                faculty_code = FacultyModel.generate_faculty_code_for_year(cursor, year_full)

                cursor.execute("INSERT INTO faculty (user_id, faculty_code, first_name, last_name, department_id, phone, hire_date, status, salary, email) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0.00, %s)",
                               (user_id, faculty_code, first_name, last_name, department_id, phone, hire_date or datetime.date.today(), status, email))
                faculty_id = cursor.lastrowid
                # Recompute implemented salary if any sections were pre-assigned
                try:
                    FacultyModel.compute_and_update_salary(faculty_id)
                except Exception:
                    pass
                return faculty_id
        except Exception as e:
            print(f"Create faculty error: {e}")
            return None

    @staticmethod
    def compute_and_update_salary(faculty_id):
        """Compute salary based on currently active sections assigned and set in faculty table"""
        try:
            with transaction() as (conn, cursor):
                cursor.execute("SELECT IFNULL(SUM(c.credits * c.fee_per_credit), 0) as salary FROM course_sections cs JOIN courses c ON cs.course_id = c.course_id WHERE cs.faculty_id = %s AND cs.is_active = TRUE", (faculty_id,))
                row = cursor.fetchone()
                salary = float(row['salary']) if row and row['salary'] is not None else 0.00
                cursor.execute("UPDATE faculty SET salary = %s WHERE faculty_id = %s", (salary, faculty_id))
            return True
        except Exception as e:
            print(f"Compute and update salary error: {e}")
            return False

    @staticmethod
    def apply_for_leave(faculty_id, leave_date, reason):
        """Apply for faculty leave"""
        query = """
            INSERT INTO faculty_leaves (faculty_id, leave_date, reason, status)
            VALUES (%s, %s, %s, 'pending')
        """
        try:
            execute_query(query, (faculty_id, leave_date, reason), fetch=False)
            return True
        except Exception as e:
            print(f"Leave application error: {e}")
            return False

    @staticmethod
    def get_faculty_leaves(faculty_id):
        query = """
            SELECT * FROM faculty_leaves
            WHERE faculty_id = %s
            ORDER BY leave_date DESC
        """
        return execute_query(query, (faculty_id,))

    @staticmethod
    def get_teaching_courses(faculty_id):
        query = """
            SELECT cs.section_id, cs.section_code, cs.semester, cs.year, cs.schedule, cs.room, cs.max_capacity, c.course_code, c.course_name, c.credits
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            WHERE cs.faculty_id = %s
        """
        return execute_query(query, (faculty_id,))

    @staticmethod
    def get_course_students(section_id):
        query = """
            SELECT s.student_id, s.student_code, s.first_name, s.last_name, e.enrollment_id, e.enrollment_date, e.status
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE e.section_id = %s AND e.status = 'enrolled'
            ORDER BY s.first_name, s.last_name
        """
        return execute_query(query, (section_id,))

    @staticmethod
    def get_course_attendance(section_id, date=None):
        if date:
            query = """
                SELECT s.student_id, s.student_code, s.first_name, s.last_name, a.attendance_id, a.status, a.attendance_date
                FROM enrollments e
                JOIN students s ON e.student_id = s.student_id
                LEFT JOIN attendance a ON a.student_id = e.student_id AND a.section_id = %s AND a.attendance_date = %s
                WHERE e.section_id = %s AND e.status = 'enrolled'
                ORDER BY s.first_name, s.last_name
            """
            return execute_query(query, (section_id, date, section_id))
        else:
            query = """
                SELECT s.student_id, s.student_code, s.first_name, s.last_name, COUNT(a.attendance_id) as total_classes,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
                FROM enrollments e
                JOIN students s ON e.student_id = s.student_id
                LEFT JOIN attendance a ON a.student_id = e.student_id AND a.section_id = %s
                WHERE e.section_id = %s AND e.status = 'enrolled'
                GROUP BY s.student_id
            """
            return execute_query(query, (section_id, section_id))

    @staticmethod
    def get_faculty_announcements(faculty_id):
        """Get announcements created by a faculty member (with section & course info)"""
        query = """
            SELECT a.announcement_id, a.faculty_id, a.section_id, a.title, a.message, a.created_at,
                   cs.section_code, c.course_code, c.course_name
            FROM announcements a
            LEFT JOIN course_sections cs ON a.section_id = cs.section_id
            LEFT JOIN courses c ON cs.course_id = c.course_id
            WHERE a.faculty_id = %s
            ORDER BY a.created_at DESC
        """
        return execute_query(query, (faculty_id,))

    @staticmethod
    def create_announcement(faculty_id, section_id, title, message):
        """Create a faculty announcement for a section"""
        query = "INSERT INTO announcements (faculty_id, section_id, title, message) VALUES (%s, %s, %s, %s)"
        try:
            execute_query(query, (faculty_id, section_id, title, message), fetch=False)
            return True
        except Exception as e:
            print(f"Create faculty announcement error: {e}")
            return False

    @staticmethod
    def get_all_faculty_for_admin():
        """Return all faculty rows for admin management"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username, u.is_active
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.first_name, f.last_name
        """
        return execute_query(query)

    @staticmethod
    def get_faculty_by_id(faculty_id):
        """Return a single faculty by id"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username
            FROM faculty f
            LEFT JOIN departments d ON f.department_id = d.dept_id
            LEFT JOIN users u ON f.user_id = u.user_id
            WHERE f.faculty_id = %s
        """
        res = execute_query(query, (faculty_id,))
        return res[0] if res else None

    @staticmethod
    def update_faculty(faculty_id, update_data):
        """Update a faculty record and recompute salary after changes"""
        if not update_data:
            return False
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(faculty_id)
        query = f"UPDATE faculty SET {set_clause} WHERE faculty_id = %s"
        try:
            execute_query(query, values, fetch=False)
            # recompute salary to keep things consistent (salary depends on assignments & fee_per_credit)
            try:
                FacultyModel.compute_and_update_salary(faculty_id)
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"Update faculty error: {e}")
            return False

    @staticmethod
    def get_faculty_by_user_id(user_id):
        """Return faculty by user_id"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username
            FROM faculty f
            LEFT JOIN departments d ON f.department_id = d.dept_id
            LEFT JOIN users u ON f.user_id = u.user_id
            WHERE f.user_id = %s
        """
        res = execute_query(query, (user_id,))
        return res[0] if res else None

    @staticmethod
    def edit_marks(enrollment_id, marks_data):
        """Wrapper for upload_marks to allow explicit edit naming"""
        return FacultyModel.upload_marks(enrollment_id, marks_data)

    @staticmethod
    def edit_attendance(student_id, section_id, date, status):
        """Wrapper to mark attendance for edit"""
        return FacultyModel.mark_attendance(student_id, section_id, date, status)

    @staticmethod
    def mark_attendance(student_id, section_id, date, status):
        query = """
            INSERT INTO attendance (student_id, section_id, attendance_date, status)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = %s
        """
        try:
            execute_query(query, (student_id, section_id, date, status, status), fetch=False)
            return True
        except Exception as e:
            print(f"Mark attendance error: {e}")
            return False

    @staticmethod
    def mark_multiple_attendance(attendance_data):
        try:
            for record in attendance_data:
                student_id = record['student_id']
                section_id = record['section_id']
                date = record['date']
                status = record['status']
                query = """
                    INSERT INTO attendance (student_id, section_id, attendance_date, status)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE status = %s
                """
                execute_query(query, (student_id, section_id, date, status, status), fetch=False)
            return True
        except Exception as e:
            print(f"Mark multiple attendance error: {e}")
            return False

    @staticmethod
    def upload_marks(enrollment_id, marks_data):
        try:
            query = """
                INSERT INTO marks (enrollment_id, quiz_marks, assignment1_marks, assignment2_marks,
                                project_marks, midterm_marks, final_marks,
                                quiz_total, assignment1_total, assignment2_total,
                                project_total, midterm_total, final_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                quiz_marks = %s, assignment1_marks = %s, assignment2_marks = %s,
                project_marks = %s, midterm_marks = %s, final_marks = %s,
                quiz_total = %s, assignment1_total = %s, assignment2_total = %s,
                project_total = %s, midterm_total = %s, final_total = %s
            """
            execute_query(query, (
                enrollment_id,
                marks_data.get('quiz_marks', 0),
                marks_data.get('assignment1_marks', 0),
                marks_data.get('assignment2_marks', 0),
                marks_data.get('project_marks', 0),
                marks_data.get('midterm_marks', 0),
                marks_data.get('final_marks', 0),
                10, 10, 10, 20, 20, 30,
                marks_data.get('quiz_marks', 0),
                marks_data.get('assignment1_marks', 0),
                marks_data.get('assignment2_marks', 0),
                marks_data.get('project_marks', 0),
                marks_data.get('midterm_marks', 0),
                marks_data.get('final_marks', 0),
                10, 10, 10, 20, 20, 30
            ), fetch=False)

            # Compute final grade and update transcript
            quiz_marks = marks_data.get('quiz_marks', 0)
            assignment1_marks = marks_data.get('assignment1_marks', 0)
            assignment2_marks = marks_data.get('assignment2_marks', 0)
            project_marks = marks_data.get('project_marks', 0)
            midterm_marks = marks_data.get('midterm_marks', 0)
            final_marks = marks_data.get('final_marks', 0)
            total_possible = 100
            total_obtained = sum([quiz_marks, assignment1_marks, assignment2_marks, project_marks, midterm_marks, final_marks])
            percentage = (total_obtained / total_possible) * 100 if total_possible else 0

            if percentage >= 90:
                final_grade, grade_points = 'A', 4.0
            elif percentage >= 80:
                final_grade, grade_points = 'B', 3.0
            elif percentage >= 70:
                final_grade, grade_points = 'C', 2.0
            elif percentage >= 60:
                final_grade, grade_points = 'D', 1.0
            else:
                final_grade, grade_points = 'F', 0.0

            course_query = """
                SELECT c.course_code, c.course_name, c.credits, cs.semester, e.student_id
                FROM enrollments e
                JOIN course_sections cs ON e.section_id = cs.section_id
                JOIN courses c ON cs.course_id = c.course_id
                WHERE e.enrollment_id = %s
            """
            course_info = execute_query(course_query, (enrollment_id,))
            if course_info:
                course = course_info[0]
                StudentModel.update_transcript(
                    course['student_id'],
                    course['course_code'],
                    course['course_name'],
                    course['credits'],
                    course['semester'],
                    final_grade,
                    grade_points
                )
            return True
        except Exception as e:
            print(f"Marks upload error: {e}")
            return False

