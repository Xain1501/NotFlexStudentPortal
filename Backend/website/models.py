"""
Database Models and CRUD Operations (PYMYSQL VERSION)
"""

from database.connection import execute_query
import datetime
class StudentModel:
    """
    CRUD operations for Students
    """
    
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
        """Get all courses a student is enrolled in"""
        query = """
            SELECT 
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                e.status as enrollment_status
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            WHERE e.student_id = %s
            AND e.status = 'enrolled'
        """
        return execute_query(query, (student_id,))
    
    @staticmethod
    def get_attendance_summary(student_id):
        """Get attendance summary for all enrolled courses"""
        query = """
            SELECT 
                c.course_code,
                c.course_name,
                COUNT(*) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM attendance a
            JOIN course_sections cs ON a.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            WHERE a.student_id = %s
            GROUP BY c.course_id, c.course_code, c.course_name
        """
        return execute_query(query, (student_id,))
    
    @staticmethod
    def get_marks_by_course(student_id, section_id):
        """Get detailed marks for a specific course"""
        query = """
            SELECT 
                m.*,
                sg.total_obtained,
                sg.percentage,
                sg.final_grade,
                sg.grade_points
            FROM marks m
            JOIN enrollments e ON m.enrollment_id = e.enrollment_id
            LEFT JOIN student_grades sg ON m.mark_id = sg.mark_id
            WHERE e.student_id = %s 
            AND e.section_id = %s
        """
        result = execute_query(query, (student_id, section_id))
        return result[0] if result else None
    
    @staticmethod
    def get_all_marks(student_id):
        """Get marks for all enrolled courses"""
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
    def update_transcript(student_id, course_code, course_name, credits, semester, final_grade, grade_points):
      """Update student transcript automatically"""
      query = """
        INSERT INTO transcript (student_id, course_code, course_name, credits, semester, final_grade, grade_points)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
        final_grade = %s, grade_points = %s
       """
      try:
        execute_query(query, (
            student_id, course_code, course_name, credits, semester, final_grade, grade_points,
            final_grade, grade_points
        ), fetch=False)
        return True
      except Exception as e:
        print(f"Transcript update error: {e}")
        return False


    @staticmethod
    def get_transcript(student_id):
        """Get complete transcript with all semesters"""
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
        """Calculate GPA (CGPA or SGPA)"""
        if semester:
            query = """
                SELECT 
                    ROUND(SUM(grade_points * credits) / SUM(credits), 2) as gpa
                FROM transcript
                WHERE student_id = %s AND semester = %s
            """
            result = execute_query(query, (student_id, semester))
        else:
            query = """
                SELECT 
                    ROUND(SUM(grade_points * credits) / SUM(credits), 2) as gpa
                FROM transcript
                WHERE student_id = %s
            """
            result = execute_query(query, (student_id,))
        
        return result[0]['gpa'] if result and result[0]['gpa'] else 0.0
    
    @staticmethod
    def get_fee_details(student_id):
        """Get fee details for student"""
        query = """
            SELECT *
            FROM fee_details
            WHERE student_id = %s
            ORDER BY semester DESC
        """
        return execute_query(query, (student_id,))

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
            execute_query(query, (fee_id,), fetch=False)
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
    

class UserModel:
    """
    User authentication operations
    """
    
    @staticmethod
    def authenticate_user(username, password):
        """
        Authenticate user and return user data
        """
        query = """
            SELECT user_id, username, email, role, password_hash
            FROM users
            WHERE username = %s AND is_active = 1
        """
        result = execute_query(query, (username,))
        
        if result and len(result) > 0:
            user = result[0]
            # Simple password check (implement proper hashing later)
            if user['password_hash'] == password:
                return {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role']
                }
        
        return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        query = "SELECT * FROM users WHERE user_id = %s"
        result = execute_query(query, (user_id,))
        return result[0] if result else None

    @staticmethod
    def can_create_admin():
        """Check if admin can be created (only one allowed) - Application-level restriction"""
        query = "SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin' AND is_active = 1"
        result = execute_query(query)
        return result[0]['admin_count'] == 0 if result else True
    
    @staticmethod
    def create_user_with_profile(user_data, profile_data):
        """Create user with student/faculty profile WITH ADMIN RESTRICTION"""
        try:
            # Check admin restriction BEFORE creating user
            if user_data['role'] == 'admin' and not UserModel.can_create_admin():
                return False, "Only one admin user allowed"
            
            # First create user
            user_query = """
                INSERT INTO users (username, password_hash, email, role)
                VALUES (%s, %s, %s, %s)
            """
            execute_query(user_query, (
                user_data['username'], 
                user_data['password_hash'], 
                user_data['email'], 
                user_data['role']
            ), fetch=False)
            
            # FIX: Get the new user ID using proper method
            user_id_query = "SELECT user_id FROM users WHERE username = %s"
            user_id_result = execute_query(user_id_query, (user_data['username'],))
            
            if not user_id_result:
                return False, "Failed to get user ID"
                
            user_id = user_id_result[0]['user_id']
            
            # Create profile based on role (admin doesn't need profile)
            if user_data['role'] == 'student':
                student_query = """
                    INSERT INTO students (user_id, student_code, first_name, last_name, date_of_birth, 
                                        phone, cnic, enrollment_date, major_dept_id, current_semester)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                execute_query(student_query, (
                    user_id, profile_data['student_code'], profile_data['first_name'], 
                    profile_data['last_name'], profile_data.get('date_of_birth'), 
                    profile_data.get('phone'), profile_data.get('cnic'), 
                    profile_data.get('enrollment_date', datetime.date.today()), 
                    profile_data.get('major_dept_id'), profile_data.get('current_semester', 1)
                ), fetch=False)
                
            elif user_data['role'] == 'faculty':
                faculty_query = """
                    INSERT INTO faculty (user_id, faculty_code, first_name, last_name, department_id, phone, salary)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                execute_query(faculty_query, (
                    user_id, profile_data['faculty_code'], profile_data['first_name'], 
                    profile_data['last_name'], profile_data.get('department_id'), 
                    profile_data.get('phone'), profile_data.get('salary', 100000)
                ), fetch=False)
            
            # For admin, we don't create additional profile - just user record
            return True, "User created successfully"
            
        except Exception as e:
            print(f"Create user with profile error: {e}")
            return False, f"Error: {str(e)}"
    
class CourseModel:
    """
    Course-related operations
    """
    
    @staticmethod
    def get_available_courses(semester, year):
        """Get courses available for registration"""
        query = """
            SELECT 
                cs.section_id,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.max_capacity,
                COUNT(e.enrollment_id) as enrolled_count,
                (cs.max_capacity - COUNT(e.enrollment_id)) as seats_available,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                cs.schedule,
                cs.room
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            WHERE cs.semester = %s AND cs.year = %s
            GROUP BY cs.section_id
            HAVING seats_available > 0
        """
        return execute_query(query, (semester, year))
    @staticmethod
    def check_seats_available(section_id):
        """Check available seats in a course section"""
        query = """
            SELECT 
                cs.section_id,
                cs.max_capacity,
                COUNT(e.enrollment_id) as enrolled_count,
                (cs.max_capacity - COUNT(e.enrollment_id)) as seats_available
            FROM course_sections cs
            LEFT JOIN enrollments e ON cs.section_id = e.section_id AND e.status = 'enrolled'
            WHERE cs.section_id = %s
            GROUP BY cs.section_id
        """
        result = execute_query(query, (section_id,))
        return result[0] if result else None
    
    @staticmethod
    def enroll_student(student_id, section_id):
        """Enroll student in a course section"""
        query = """
            INSERT INTO enrollments (student_id, section_id, enrollment_date, status)
            VALUES (%s, %s, CURDATE(), 'enrolled')
        """
        try:
            execute_query(query, (student_id, section_id), fetch=False)
            return True
        except Exception as e:
            print(f"Enrollment error: {e}")
            return False
        
    @staticmethod
    def get_student_enrollments(student_id):
        """Get all courses a student is enrolled in"""
        query = """
            SELECT 
                e.enrollment_id,
                cs.section_id,
                c.course_code,
                c.course_name,
                c.credits,
                cs.section_code,
                cs.semester,
                cs.year,
                cs.schedule,
                cs.room,
                CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
                e.enrollment_date,
                e.status
            FROM enrollments e
            JOIN course_sections cs ON e.section_id = cs.section_id
            JOIN courses c ON cs.course_id = c.course_id
            JOIN faculty f ON cs.faculty_id = f.faculty_id
            WHERE e.student_id = %s
            ORDER BY cs.year DESC, cs.semester DESC
        """
        return execute_query(query, (student_id,))

    
    @staticmethod
    def drop_course(student_id, section_id):
        """Drop a course"""
        query = """
            UPDATE enrollments
            SET status = 'dropped'
            WHERE student_id = %s AND section_id = %s
        """
        try:
            execute_query(query, (student_id, section_id), fetch=False)
            return True
        except:
            return False

# ==================== FACULTY MODELS ====================

class FacultyModel:
    """
    CRUD operations for Faculty
    """
    @staticmethod
    def get_faculty_by_user_id(user_id):
        """Get faculty details by user_id"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            WHERE f.user_id = %s
        """
        result = execute_query(query, (user_id,))
        return result[0] if result else None 
    

    @staticmethod
    def get_teaching_courses(faculty_id):
        """Get courses taught by faculty"""
        query = """
            SELECT cs.section_id, cs.section_code, cs.semester, cs.year, 
                   cs.schedule, cs.room, c.course_code, c.course_name, c.credits
            FROM course_sections cs
            JOIN courses c ON cs.course_id = c.course_id
            WHERE cs.faculty_id = %s
        """
        return execute_query(query, (faculty_id,))
    
    @staticmethod 
    def get_course_students(section_id):
        """Get students enrolled in a course section"""
        query = """
            SELECT s.student_id, s.student_code, s.first_name, s.last_name,
                   e.enrollment_id, e.enrollment_date
            FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE e.section_id = %s AND e.status = 'enrolled'
        """
        return execute_query(query, (section_id,))
    

    @staticmethod
    def mark_attendance(student_id, section_id, date, status):
        """Mark student attendance"""
        query = """
            INSERT INTO attendance (student_id, section_id, attendance_date, status)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = %s
        """
        try:
            print(f"DEBUG: Marking attendance - student_id: {student_id}, section_id: {section_id}, date: {date}, status: {status}")
            execute_query(query, (student_id, section_id, date, status, status), fetch=False)
            print("DEBUG: Attendance marked successfully")
            return True
        except Exception as e:
            print(f"âŒ Attendance error: {e}")
            print(f"âŒ Query: {query}")
            print(f"âŒ Params: ({student_id}, {section_id}, {date}, {status}, {status})")
            return False

    @staticmethod
    def get_course_attendance(section_id, date=None):
        """Get attendance for a course section on specific date"""
        if date:
            query = """
                SELECT 
                    s.student_id, s.student_code, s.first_name, s.last_name,
                    a.attendance_id, a.status, a.attendance_date
                FROM enrollments e
                JOIN students s ON e.student_id = s.student_id
                LEFT JOIN attendance a ON e.student_id = a.student_id 
                    AND a.section_id = %s 
                    AND a.attendance_date = %s
                WHERE e.section_id = %s AND e.status = 'enrolled'
                ORDER BY s.first_name, s.last_name
            """
            return execute_query(query, (section_id, date, section_id))
        else:
            query = """
                SELECT 
                    s.student_id, s.student_code, s.first_name, s.last_name,
                    COUNT(a.attendance_id) as total_classes,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
                FROM enrollments e
                JOIN students s ON e.student_id = s.student_id
                LEFT JOIN attendance a ON e.student_id = a.student_id AND a.section_id = %s
                WHERE e.section_id = %s AND e.status = 'enrolled'
                GROUP BY s.student_id
                ORDER BY s.first_name, s.last_name
            """
            return execute_query(query, (section_id, section_id))
    
    @staticmethod
    def mark_multiple_attendance(attendance_data):
        """Mark attendance for multiple students at once"""
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
            print(f"Multiple attendance error: {e}")
            return False
        
    @staticmethod 
    def upload_marks(enrollment_id, marks_data):
        """Upload marks and auto-update transcript"""
        try:
            # FIX: Include the total marks in the query
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
                10, 10, 10, 20, 20, 30,  # TOTALS
                marks_data.get('quiz_marks', 0),
                marks_data.get('assignment1_marks', 0),
                marks_data.get('assignment2_marks', 0),
                marks_data.get('project_marks', 0),
                marks_data.get('midterm_marks', 0),
                marks_data.get('final_marks', 0),
                10, 10, 10, 20, 20, 30   # TOTALS for UPDATE
            ), fetch=False)
            
            # FIX: Calculate percentage using the actual totals
            quiz_marks = marks_data.get('quiz_marks', 0)
            assignment1_marks = marks_data.get('assignment1_marks', 0)
            assignment2_marks = marks_data.get('assignment2_marks', 0)
            project_marks = marks_data.get('project_marks', 0)
            midterm_marks = marks_data.get('midterm_marks', 0)
            final_marks = marks_data.get('final_marks', 0)
            
            # Use the actual totals from your schema
            quiz_max = 10
            assignment1_max = 10
            assignment2_max = 10
            project_max = 20
            midterm_max = 20
            final_max = 30
            total_possible = quiz_max + assignment1_max + assignment2_max + project_max + midterm_max + final_max  # = 100
            
            # Calculate actual total and percentage
            total_obtained = quiz_marks + assignment1_marks + assignment2_marks + project_marks + midterm_marks + final_marks
            percentage = (total_obtained / total_possible) * 100
            
            # Calculate grade based on percentage
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
            
            # Get course info and student info
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
                # Update transcript
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
    def get_all_faculty_for_admin():
        """Get all faculty for admin management"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username, u.is_active,
                   (SELECT COUNT(*) FROM course_sections WHERE faculty_id = f.faculty_id) as teaching_courses
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.first_name, f.last_name
        """
        return execute_query(query)
    @staticmethod
    def apply_for_leave(faculty_id, leave_date, reason):  # â† CORRECT: 3 parameters
        """Apply for faculty leave"""
        query = """
            INSERT INTO faculty_leaves (faculty_id, leave_date, reason, status)
            VALUES (%s, %s, %s, 'pending')  # â† CORRECT: 4 placeholders
        """
        try:
            execute_query(query, (faculty_id, leave_date, reason), fetch=False)  # â† CORRECT: 3 values
            return True
        except Exception as e:
            print(f"Leave application error: {e}")
            return False
    @staticmethod
    def get_faculty_leaves(faculty_id):
        """Get all leaves for a faculty member"""
        query = """
            SELECT * FROM faculty_leaves 
            WHERE faculty_id = %s 
            ORDER BY leave_date DESC
        """
        return execute_query(query, (faculty_id,))
    @staticmethod
    def get_all_faculty_for_admin():
        """Get all faculty for admin management"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username, u.is_active,
                (SELECT COUNT(*) FROM course_sections WHERE faculty_id = f.faculty_id) as teaching_courses
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.first_name, f.last_name
        """
        return execute_query(query)

    @staticmethod
    def update_faculty(faculty_id, update_data):
        """Update faculty information"""
        if not update_data:
            return False
        
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values())
        values.append(faculty_id)
        
        query = f"UPDATE faculty SET {set_clause} WHERE faculty_id = %s"
        
        try:
            execute_query(query, values, fetch=False)
            return True
        except Exception as e:
            print(f"Update faculty error: {e}")
            return False

    @staticmethod
    def get_faculty_by_id(faculty_id):
        """Get faculty by ID with all details"""
        query = """
            SELECT f.*, d.dept_name, u.email, u.username, u.is_active
            FROM faculty f
            JOIN departments d ON f.department_id = d.dept_id
            JOIN users u ON f.user_id = u.user_id
            WHERE f.faculty_id = %s
        """
        result = execute_query(query, (faculty_id,))
        return result[0] if result else None


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
            print(f"DEBUG: Marking faculty attendance - faculty_id: {faculty_id}, date: {date}, session: {session}, status: {status}")
            execute_query(query, (faculty_id, date, session, status, marked_by_user_id, status), fetch=False)
            print("DEBUG: Faculty attendance marked successfully")
            return True
        except Exception as e:
            print(f"âŒ Faculty attendance mark error: {e}")
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
    def get_system_statistics():
        """Get comprehensive system statistics for admin dashboard"""
        query = """
            SELECT 
                (SELECT COUNT(*) FROM students WHERE status = 'active') as active_students,
                (SELECT COUNT(*) FROM faculty WHERE status = 'active') as active_faculty,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM course_sections WHERE semester = 'Fall' AND year = YEAR(CURDATE())) as current_sections,
                (SELECT COUNT(*) FROM fee_details WHERE status = 'pending') as pending_fees,
                (SELECT COUNT(*) FROM faculty_leaves WHERE status = 'pending') as pending_leaves,
                (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users
        """
        result = execute_query(query)
        return result[0] if result else {}
    
    @staticmethod
    def create_course_section(course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity=30):
        """Create new course section"""
        query = """
            INSERT INTO course_sections (course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        try:
            execute_query(query, (course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity), fetch=False)
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
            execute_query(query, values, fetch=False)
            return True
        except Exception as e:
            print(f"Update course section error: {e}")
            return False
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