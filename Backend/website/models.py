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
            print(f"❌ Attendance error: {e}")
            print(f"❌ Query: {query}")
            print(f"❌ Params: ({student_id}, {section_id}, {date}, {status}, {status})")
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