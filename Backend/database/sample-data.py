"""
Insert Sample Data for Testing
Run this AFTER starting the server once (to create tables)

Usage: python insert_sample_data.py
"""

from Backend.database.connection import execute_query, get_db_session
from sqlalchemy import text

def insert_sample_data():
    print("🔄 Inserting sample data...")
    
    try:
        # 1. Insert Departments
        print("📚 Adding departments...")
        execute_query("""
            INSERT INTO departments (dept_code, dept_name) 
            VALUES 
                ('CS', 'Computer Science'),
                ('SE', 'Software Engineering'),
                ('AI', 'Artificial Intelligence')
            ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name)
        """, fetch=False)
        
        # 2. Insert Faculty User
        print("👨‍🏫 Adding faculty...")
        execute_query("""
            INSERT INTO users (username, password_hash, email, role) 
            VALUES ('dr.ahmed', 'password123', 'ahmed@university.edu', 'faculty')
            ON DUPLICATE KEY UPDATE username = username
        """, fetch=False)
        
        # Get faculty user_id
        faculty_user = execute_query("SELECT user_id FROM users WHERE username = 'dr.ahmed'")[0]
        dept_cs = execute_query("SELECT dept_id FROM departments WHERE dept_code = 'CS'")[0]
        
        # Insert Faculty record
        execute_query("""
            INSERT INTO faculty (user_id, faculty_code, first_name, last_name, department_id, phone, salary, status)
            VALUES (:user_id, 'F001', 'Dr. Ahmed', 'Khan', :dept_id, '03451234567', 150000, 'active')
            ON DUPLICATE KEY UPDATE faculty_code = faculty_code
        """, {'user_id': faculty_user['user_id'], 'dept_id': dept_cs['dept_id']}, fetch=False)
        
        # 3. Insert Student Users
        print("👩‍🎓 Adding students...")
        students_data = [
            ('23k-0846', 'Madiha', 'Aslam', '2005-08-25', '03001234567', '42101-1234567-8'),
            ('23k-0528', 'Tasbiha', 'Nasir', '2005-03-15', '03012345678', '42101-2345678-9'),
            ('23k-0588', 'Zain', 'Saqib', '2004-11-20', '03023456789', '42101-3456789-0')
        ]
        
        for student_code, first_name, last_name, dob, phone, cnic in students_data:
            # Insert user
            execute_query("""
                INSERT INTO users (username, password_hash, email, role) 
                VALUES (:username, 'password123', :email, 'student')
                ON DUPLICATE KEY UPDATE username = username
            """, {
                'username': student_code,
                'email': f'{first_name.lower()}.{last_name.lower()}@student.edu'
            }, fetch=False)
            
            # Get user_id
            user = execute_query("SELECT user_id FROM users WHERE username = :username", 
                               {'username': student_code})[0]
            
            # Insert student
            execute_query("""
                INSERT INTO students (
                    user_id, student_code, first_name, last_name, 
                    date_of_birth, phone, cnic, enrollment_date, 
                    major_dept_id, current_semester, status
                ) VALUES (
                    :user_id, :student_code, :first_name, :last_name,
                    :dob, :phone, :cnic, '2023-09-01', 
                    :dept_id, 5, 'active'
                )
                ON DUPLICATE KEY UPDATE student_code = student_code
            """, {
                'user_id': user['user_id'],
                'student_code': student_code,
                'first_name': first_name,
                'last_name': last_name,
                'dob': dob,
                'phone': phone,
                'cnic': cnic,
                'dept_id': dept_cs['dept_id']
            }, fetch=False)
        
        # 4. Insert Courses
        print("📖 Adding courses...")
        courses_data = [
            ('CS301', 'Data Structures', 3),
            ('CS302', 'Operating Systems', 3),
            ('CS303', 'Database Systems', 3),
            ('CS304', 'Computer Networks', 3),
            ('CS305', 'Software Engineering', 3)
        ]
        
        for code, name, credits in courses_data:
            execute_query("""
                INSERT INTO courses (course_code, course_name, credits)
                VALUES (:code, :name, :credits)
                ON DUPLICATE KEY UPDATE course_name = VALUES(course_name)
            """, {'code': code, 'name': name, 'credits': credits}, fetch=False)
        
        # 5. Insert Course Sections
        print("🏫 Adding course sections...")
        faculty = execute_query("SELECT faculty_id FROM faculty WHERE faculty_code = 'F001'")[0]
        
        sections_data = [
            ('CS301', 'A', 'Fall', 2024, 'Mon/Wed 9:00-10:30', 'Room 101'),
            ('CS302', 'A', 'Fall', 2024, 'Tue/Thu 10:00-11:30', 'Room 102'),
            ('CS303', 'B', 'Fall', 2024, 'Mon/Wed 11:00-12:30', 'Room 103')
        ]
        
        for course_code, section, semester, year, schedule, room in sections_data:
            course = execute_query("SELECT course_id FROM courses WHERE course_code = :code", 
                                 {'code': course_code})[0]
            
            execute_query("""
                INSERT INTO course_sections (
                    course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity
                ) VALUES (
                    :course_id, :faculty_id, :section_code, :semester, :year, :schedule, :room, 30
                )
                ON DUPLICATE KEY UPDATE section_code = section_code
            """, {
                'course_id': course['course_id'],
                'faculty_id': faculty['faculty_id'],
                'section_code': section,
                'semester': semester,
                'year': year,
                'schedule': schedule,
                'room': room
            }, fetch=False)
        
        # 6. Enroll Students
        print("✍️ Enrolling students in courses...")
        student = execute_query("SELECT student_id FROM students WHERE student_code = '23k-0846'")[0]
        sections = execute_query("SELECT section_id FROM course_sections LIMIT 3")
        
        for section in sections:
            execute_query("""
                INSERT INTO enrollments (student_id, section_id, enrollment_date, status)
                VALUES (:student_id, :section_id, CURRENT_DATE, 'enrolled')
                ON DUPLICATE KEY UPDATE student_id = student_id
            """, {
                'student_id': student['student_id'],
                'section_id': section['section_id']
            }, fetch=False)
        
        # 7. Insert Sample Marks
        print("📝 Adding marks...")
        enrollments = execute_query("""
            SELECT enrollment_id FROM enrollments 
            WHERE student_id = :student_id
        """, {'student_id': student['student_id']})
        
        marks_data = [
            (18, 8, 17, 45, 42, 78),  # Course 1
            (19, 9, 18, 40, 36, 72),  # Course 2
            (20, 10, 19, 48, 40, 85)  # Course 3
        ]
        
        for i, enrollment in enumerate(enrollments):
            if i < len(marks_data):
                quiz, ass1, ass2, proj, mid, final = marks_data[i]
                execute_query("""
                    INSERT INTO marks (
                        enrollment_id, quiz_marks, assignment1_marks, assignment2_marks,
                        project_marks, midterm_marks, final_marks
                    ) VALUES (
                        :enroll_id, :quiz, :ass1, :ass2, :proj, :mid, :final
                    )
                    ON DUPLICATE KEY UPDATE enrollment_id = enrollment_id
                """, {
                    'enroll_id': enrollment['enrollment_id'],
                    'quiz': quiz, 'ass1': ass1, 'ass2': ass2,
                    'proj': proj, 'mid': mid, 'final': final
                }, fetch=False)
        
        # 8. Insert Attendance
        print("📅 Adding attendance records...")
        import datetime
        from datetime import timedelta
        
        start_date = datetime.date(2024, 9, 1)
        for section in sections[:3]:
            for day in range(0, 60, 3):  # 20 classes
                att_date = start_date + timedelta(days=day)
                status = 'present' if day % 5 != 0 else 'absent'  # Absent every 5th class
                
                execute_query("""
                    INSERT INTO attendance (student_id, section_id, attendance_date, status)
                    VALUES (:student_id, :section_id, :att_date, :status)
                    ON DUPLICATE KEY UPDATE status = status
                """, {
                    'student_id': student['student_id'],
                    'section_id': section['section_id'],
                    'att_date': att_date,
                    'status': status
                }, fetch=False)
        
        # 9. Insert Transcript
        print("📜 Adding transcript...")
        transcript_data = [
            ('CS201', 'Data Structures Basics', 3, 'Fall2023', 'A', 4.0),
            ('CS202', 'OOP', 3, 'Fall2023', 'B', 3.0),
            ('CS203', 'Discrete Math', 3, 'Spring2024', 'A', 4.0),
            ('CS204', 'Linear Algebra', 3, 'Spring2024', 'B', 3.0)
        ]
        
        for code, name, credits, sem, grade, gp in transcript_data:
            execute_query("""
                INSERT INTO transcript (student_id, course_code, course_name, credits, semester, final_grade, grade_points)
                VALUES (:student_id, :code, :name, :credits, :sem, :grade, :gp)
                ON DUPLICATE KEY UPDATE course_code = course_code
            """, {
                'student_id': student['student_id'],
                'code': code, 'name': name, 'credits': credits,
                'sem': sem, 'grade': grade, 'gp': gp
            }, fetch=False)
        
        # 10. Insert Fee Details
        print("💰 Adding fee details...")
        execute_query("""
            INSERT INTO fee_details (student_id, semester, amount_due, amount_paid, due_date, status)
            VALUES 
                (:student_id, 'Fall2024', 50000, 50000, '2024-09-15', 'paid'),
                (:student_id, 'Spring2025', 50000, 0, '2025-02-15', 'pending')
            ON DUPLICATE KEY UPDATE student_id = student_id
        """, {'student_id': student['student_id']}, fetch=False)
        
        print("\n" + "="*50)
        print("✅ Sample data inserted successfully!")
        print("="*50)
        print("\n📝 Test Login Credentials:")
        print("   Username: 23k-0846")
        print("   Password: password123")
        print("\n   Username: 23k-0528")
        print("   Password: password123")
        print("\n   Username: 23k-0588")
        print("   Password: password123")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error inserting data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    insert_sample_data()
