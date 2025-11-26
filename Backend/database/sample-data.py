"""
Insert Sample Data for Testing
Run this AFTER starting the server once (to create tables)

Usage: 
cd Backend
python database/sample-data.py
"""

from connection import execute_query
import datetime
from datetime import timedelta

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
        
        # 2. Insert Admin User
        print("👑 Adding admin...")
        execute_query("""
            INSERT INTO users (username, password_hash, email, role, is_active) 
            VALUES ('admin', 'admin123', 'admin@university.edu', 'admin', 1)
            ON DUPLICATE KEY UPDATE username = username
        """, fetch=False)
        
        # 3. Insert Faculty User
        print("👨‍🏫 Adding faculty...")
        execute_query("""
            INSERT INTO users (username, password_hash, email, role, is_active) 
            VALUES ('dr.aisha', 'password123', 'aisha.khan@university.edu', 'faculty', 1)
            ON DUPLICATE KEY UPDATE username = username
        """, fetch=False)
        
        # Get faculty user_id and dept_id
        faculty_user = execute_query("SELECT user_id FROM users WHERE username = 'dr.aisha'")
        dept_cs = execute_query("SELECT dept_id FROM departments WHERE dept_code = 'CS'")
        
        if faculty_user and dept_cs:
            # Insert Faculty record
            execute_query("""
                INSERT INTO faculty (user_id, faculty_code, first_name, last_name, department_id, phone, salary, status)
                VALUES (%s, 'T2025-09', 'Dr. Aisha', 'Khan', %s, '03001234567', 150000, 'active')
                ON DUPLICATE KEY UPDATE faculty_code = faculty_code
            """, (faculty_user[0]['user_id'], dept_cs[0]['dept_id']), fetch=False)
        
        # 4. Insert Student Users
        print("👩‍🎓 Adding students...")
        students_data = [
            ('23k-001', 'Madiha', 'Aslam', '2005-08-25', '03001111111', '42101-1234567-1'),
            ('23k-002', 'Ahmed', 'Hassan', '2005-03-15', '03002222222', '42101-2345678-2'),
            ('23k-003', 'Zain', 'Saqib', '2004-11-20', '03003333333', '42101-3456789-3')
        ]
        
        for student_code, first_name, last_name, dob, phone, cnic in students_data:
            # Insert user
            execute_query("""
                INSERT INTO users (username, password_hash, email, role, is_active) 
                VALUES (%s, 'password123', %s, 'student', 1)
                ON DUPLICATE KEY UPDATE username = username
            """, (student_code, f'{first_name.lower()}.{last_name.lower()}@student.edu'), fetch=False)
            
            # Get user_id
            user = execute_query("SELECT user_id FROM users WHERE username = %s", (student_code,))
            
            if user and dept_cs:
                # Insert student
                execute_query("""
                    INSERT INTO students (
                        user_id, student_code, first_name, last_name, 
                        date_of_birth, phone, cnic, enrollment_date, 
                        major_dept_id, current_semester, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, '2023-09-01', %s, 5, 'active'
                    )
                    ON DUPLICATE KEY UPDATE student_code = student_code
                """, (user[0]['user_id'], student_code, first_name, last_name,
                      dob, phone, cnic, dept_cs[0]['dept_id']), fetch=False)
        
        # 5. Insert Courses
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
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE course_name = VALUES(course_name)
            """, (code, name, credits), fetch=False)
        
        # 6. Insert Course Sections
        print("🏫 Adding course sections...")
        faculty = execute_query("SELECT faculty_id FROM faculty WHERE faculty_code = 'T2025-09'")
        
        if faculty:
            sections_data = [
                ('CS301', 'A', 'Fall', 2024, 'Mon-Wed 09:00-10:30', 'B101'),
                ('CS302', 'A', 'Fall', 2024, 'Tue-Thu 10:00-11:30', 'B102'),
                ('CS303', 'B', 'Fall', 2024, 'Mon-Wed 11:00-12:30', 'B103')
            ]
            
            for course_code, section, semester, year, schedule, room in sections_data:
                course = execute_query("SELECT course_id FROM courses WHERE course_code = %s", (course_code,))
                
                if course:
                    execute_query("""
                        INSERT INTO course_sections (
                            course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, 30)
                        ON DUPLICATE KEY UPDATE section_code = section_code
                    """, (course[0]['course_id'], faculty[0]['faculty_id'], section,
                          semester, year, schedule, room), fetch=False)
        
        # 7. Enroll Students
        print("✍️ Enrolling students in courses...")
        student = execute_query("SELECT student_id FROM students WHERE student_code = '23k-001'")
        sections = execute_query("SELECT section_id FROM course_sections LIMIT 3")
        
        if student and sections:
            for section in sections:
                execute_query("""
                    INSERT INTO enrollments (student_id, section_id, enrollment_date, status)
                    VALUES (%s, %s, CURDATE(), 'enrolled')
                    ON DUPLICATE KEY UPDATE student_id = student_id
                """, (student[0]['student_id'], section['section_id']), fetch=False)
        
        # 8. Insert Sample Marks
        print("📝 Adding marks...")
        if student:
            enrollments = execute_query("""
                SELECT enrollment_id FROM enrollments 
                WHERE student_id = %s
            """, (student[0]['student_id'],))
            
            marks_data = [
                (9, 10, 8, 10, 9, 10, 18, 20, 17, 20, 25, 30),  # Course 1
                (8, 10, 9, 10, 8, 10, 17, 20, 16, 20, 23, 30),  # Course 2
                (10, 10, 9, 10, 9, 10, 19, 20, 18, 20, 27, 30)  # Course 3
            ]
            
            for i, enrollment in enumerate(enrollments):
                if i < len(marks_data):
                    quiz, qt, ass1, a1t, ass2, a2t, proj, pt, mid, mt, final, ft = marks_data[i]
                    execute_query("""
                        INSERT INTO marks (
                            enrollment_id, 
                            quiz_marks, quiz_total,
                            assignment1_marks, assignment1_total,
                            assignment2_marks, assignment2_total,
                            project_marks, project_total,
                            midterm_marks, midterm_total,
                            final_marks, final_total
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE enrollment_id = enrollment_id
                    """, (enrollment['enrollment_id'], quiz, qt, ass1, a1t, ass2, a2t,
                          proj, pt, mid, mt, final, ft), fetch=False)
        
        # 9. Insert Attendance
        print("📅 Adding attendance records...")
        start_date = datetime.date(2024, 9, 1)
        
        if student and sections:
            for section in sections[:3]:
                for day in range(0, 60, 3):  # 20 classes
                    att_date = start_date + timedelta(days=day)
                    status = 'present' if day % 5 != 0 else 'absent'
                    
                    execute_query("""
                        INSERT INTO attendance (student_id, section_id, attendance_date, status)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE status = status
                    """, (student[0]['student_id'], section['section_id'],
                          att_date, status), fetch=False)
        
        # 10. Insert Transcript
        print("📜 Adding transcript...")
        if student:
            transcript_data = [
                ('CS201', 'Data Structures Basics', 3, 'Fall2023', 'A', 4.0),
                ('CS202', 'OOP', 3, 'Fall2023', 'B', 3.0),
                ('CS203', 'Discrete Math', 3, 'Spring2024', 'A', 4.0),
                ('CS204', 'Linear Algebra', 3, 'Spring2024', 'B', 3.0)
            ]
            
            for code, name, credits, sem, grade, gp in transcript_data:
                execute_query("""
                    INSERT INTO transcript (student_id, course_code, course_name, credits, semester, final_grade, grade_points)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE course_code = course_code
                """, (student[0]['student_id'], code, name, credits, sem, grade, gp), fetch=False)
        
        # 11. Insert Fee Details
        print("💰 Adding fee details...")
        if student:
            execute_query("""
                INSERT INTO fee_details (student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, total_due, amount_paid, remaining_balance, due_date, status)
                VALUES 
                    (%s, 'Fall2024', 40000, 5000, 5000, 50000, 30000, 20000, '2024-09-15', 'pending'),
                    (%s, 'Spring2025', 40000, 5000, 5000, 50000, 0, 50000, '2025-02-15', 'pending')
                ON DUPLICATE KEY UPDATE student_id = student_id
            """, (student[0]['student_id'], student[0]['student_id']), fetch=False)
        
        print("\n" + "="*50)
        print("✅ Sample data inserted successfully!")
        print("="*50)
        print("\n📝 Test Login Credentials:")
        print("\n   ADMIN:")
        print("   Username: admin")
        print("   Password: admin123")
        print("\n   FACULTY:")
        print("   Username: dr.aisha")
        print("   Password: password123")
        print("\n   STUDENTS:")
        print("   Username: 23k-001")
        print("   Password: password123")
        print("\n   Username: 23k-002")
        print("   Password: password123")
        print("\n   Username: 23k-003")
        print("   Password: password123")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error inserting data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    insert_sample_data()