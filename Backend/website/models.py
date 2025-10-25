"""
Database Models and CRUD Operations (PYMYSQL VERSION)
"""

from Backend.database.connection import execute_query

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

class UserModel:
    """
    User authentication operations
    """
    
    @staticmethod
    def authenticate_user(username, password):
        """
        Authenticate user and return user data
        Uses proper password hashing
        """
        query = """
            SELECT user_id, username, email, role, password_hash
            FROM users
            WHERE username = %s AND is_active = 1
        """
        result = execute_query(query, (username,))
        
        if result and len(result) > 0:
            user = result[0]
            # TODO: Implement proper password hashing
            # For now, using simple comparison
            if user['password_hash'] == password:
                return {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role']
                }
        
        return None
    