-- ==================== DATABASE FIX AND UPDATE SCRIPT ====================
-- This script fixes existing databases that may have issues
-- Run this on any existing database to apply fixes without losing data
-- ==================== 

SET FOREIGN_KEY_CHECKS = 0;

-- ==================== DROP EXISTING FOREIGN KEYS ====================
-- Drop all existing foreign keys to recreate them with proper CASCADE options

-- Students
ALTER TABLE students DROP FOREIGN KEY IF EXISTS students_ibfk_1;
ALTER TABLE students DROP FOREIGN KEY IF EXISTS students_ibfk_2;

-- Faculty
ALTER TABLE faculty DROP FOREIGN KEY IF EXISTS faculty_ibfk_1;
ALTER TABLE faculty DROP FOREIGN KEY IF EXISTS faculty_ibfk_2;

-- Courses
ALTER TABLE courses DROP FOREIGN KEY IF EXISTS courses_ibfk_1;

-- Course Sections
ALTER TABLE course_sections DROP FOREIGN KEY IF EXISTS course_sections_ibfk_1;
ALTER TABLE course_sections DROP FOREIGN KEY IF EXISTS course_sections_ibfk_2;

-- Enrollments
ALTER TABLE enrollments DROP FOREIGN KEY IF EXISTS enrollments_ibfk_1;
ALTER TABLE enrollments DROP FOREIGN KEY IF EXISTS enrollments_ibfk_2;

-- Marks
ALTER TABLE marks DROP FOREIGN KEY IF EXISTS marks_ibfk_1;

-- Attendance
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS attendance_ibfk_1;
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS attendance_ibfk_2;

-- Transcript
ALTER TABLE transcript DROP FOREIGN KEY IF EXISTS transcript_ibfk_1;

-- Fee Details
ALTER TABLE fee_details DROP FOREIGN KEY IF EXISTS fee_details_ibfk_1;

-- Faculty Leaves
ALTER TABLE faculty_leaves DROP FOREIGN KEY IF EXISTS faculty_leaves_ibfk_1;

-- Announcements
ALTER TABLE announcements DROP FOREIGN KEY IF EXISTS announcements_ibfk_1;
ALTER TABLE announcements DROP FOREIGN KEY IF EXISTS announcements_ibfk_2;

-- Faculty Attendance
ALTER TABLE faculty_attendance DROP FOREIGN KEY IF EXISTS faculty_attendance_ibfk_1;
ALTER TABLE faculty_attendance DROP FOREIGN KEY IF EXISTS faculty_attendance_ibfk_2;

-- Admin Announcements
ALTER TABLE admin_announcements DROP FOREIGN KEY IF EXISTS admin_announcements_ibfk_1;

-- ==================== ENSURE ALL COLUMNS EXIST ====================

-- Faculty: ensure email and hire_date columns exist
ALTER TABLE faculty 
ADD COLUMN IF NOT EXISTS email VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS hire_date DATE NULL;

-- Courses: ensure fee_per_credit and department_id exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS fee_per_credit DECIMAL(10,2) DEFAULT 10000.00,
ADD COLUMN IF NOT EXISTS department_id INT NULL;

-- Students: ensure fee_balance exists
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS fee_balance DECIMAL(10,2) DEFAULT 0.00;

-- Fee details: ensure breakdown columns exist
ALTER TABLE fee_details 
ADD COLUMN IF NOT EXISTS tuition_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lab_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00;

-- Course sections: ensure is_active exists
ALTER TABLE course_sections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ==================== RECREATE FOREIGN KEYS WITH CASCADE ====================

-- Students foreign keys
ALTER TABLE students 
ADD CONSTRAINT students_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT students_dept_fk FOREIGN KEY (major_dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL;

-- Faculty foreign keys  
ALTER TABLE faculty 
ADD CONSTRAINT faculty_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
ADD CONSTRAINT faculty_dept_fk FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL;

-- Courses foreign keys
ALTER TABLE courses 
ADD CONSTRAINT courses_dept_fk FOREIGN KEY (department_id) REFERENCES departments(dept_id) ON DELETE SET NULL;

-- Course sections foreign keys
ALTER TABLE course_sections 
ADD CONSTRAINT course_sections_course_fk FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
ADD CONSTRAINT course_sections_faculty_fk FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE;

-- Enrollments foreign keys
ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_student_fk FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
ADD CONSTRAINT enrollments_section_fk FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE;

-- Marks foreign keys
ALTER TABLE marks 
ADD CONSTRAINT marks_enrollment_fk FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE;

-- Attendance foreign keys
ALTER TABLE attendance 
ADD CONSTRAINT attendance_student_fk FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
ADD CONSTRAINT attendance_section_fk FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE;

-- Transcript foreign keys
ALTER TABLE transcript 
ADD CONSTRAINT transcript_student_fk FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- Fee details foreign keys
ALTER TABLE fee_details 
ADD CONSTRAINT fee_details_student_fk FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- Faculty leaves foreign keys
ALTER TABLE faculty_leaves 
ADD CONSTRAINT faculty_leaves_faculty_fk FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE;

-- Announcements foreign keys
ALTER TABLE announcements 
ADD CONSTRAINT announcements_faculty_fk FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
ADD CONSTRAINT announcements_section_fk FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE;

-- Faculty attendance foreign keys
ALTER TABLE faculty_attendance 
ADD CONSTRAINT faculty_attendance_faculty_fk FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
ADD CONSTRAINT faculty_attendance_marker_fk FOREIGN KEY (marked_by) REFERENCES users(user_id) ON DELETE CASCADE;

-- Admin announcements foreign keys
ALTER TABLE admin_announcements 
ADD CONSTRAINT admin_announcements_creator_fk FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE;

-- ==================== FIX DATA INTEGRITY ISSUES ====================

-- Update NULL enrollment dates to current date
UPDATE enrollments SET enrollment_date = CURDATE() WHERE enrollment_date IS NULL;

-- Ensure all course sections have valid years
UPDATE course_sections SET year = YEAR(CURDATE()) WHERE year IS NULL OR year = 0;

-- Update fee_details to calculate amount_due if not set properly
UPDATE fee_details 
SET amount_due = tuition_fee + lab_fee + miscellaneous_fee
WHERE amount_due = 0 OR amount_due IS NULL;

-- Update student fee balances
UPDATE students s
SET fee_balance = (
    SELECT IFNULL(SUM(fd.amount_due - fd.amount_paid), 0)
    FROM fee_details fd
    WHERE fd.student_id = s.student_id
);

-- Update faculty salaries based on active sections
UPDATE faculty f
SET salary = (
    SELECT IFNULL(SUM(c.credits * c.fee_per_credit), 0)
    FROM course_sections cs
    JOIN courses c ON cs.course_id = c.course_id
    WHERE cs.faculty_id = f.faculty_id
    AND cs.is_active = TRUE
);

-- ==================== ENSURE SEQUENCE TABLES EXIST ====================

CREATE TABLE IF NOT EXISTS student_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faculty_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

-- ==================== RECREATE VIEW ====================

DROP VIEW IF EXISTS student_grades;

CREATE OR REPLACE VIEW student_grades AS
SELECT 
    m.mark_id,
    m.enrollment_id,
    m.quiz_marks, m.assignment1_marks, m.assignment2_marks,
    m.project_marks, m.midterm_marks, m.final_marks,
    -- Total obtained
    (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
     m.project_marks + m.midterm_marks + m.final_marks) as total_obtained,
    -- Calculate percentage using actual maximums from the table
    ROUND(((m.quiz_marks / m.quiz_total * 10) + 
           (m.assignment1_marks / m.assignment1_total * 10) +
           (m.assignment2_marks / m.assignment2_total * 10) +
           (m.project_marks / m.project_total * 20) +
           (m.midterm_marks / m.midterm_total * 20) +
           (m.final_marks / m.final_total * 30)), 2) as percentage,
    -- Grade based on calculated percentage
    CASE 
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 90 THEN 'A'
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 80 THEN 'B'
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 70 THEN 'C'
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 60 THEN 'D'
        ELSE 'F'
    END as final_grade,
    -- Grade points
    CASE 
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 90 THEN 4.0
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 80 THEN 3.0
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 70 THEN 2.0
        WHEN ROUND(((m.quiz_marks / m.quiz_total * 10) + 
                   (m.assignment1_marks / m.assignment1_total * 10) +
                   (m.assignment2_marks / m.assignment2_total * 10) +
                   (m.project_marks / m.project_total * 20) +
                   (m.midterm_marks / m.midterm_total * 20) +
                   (m.final_marks / m.final_total * 30)), 2) >= 60 THEN 1.0
        ELSE 0.0
    END as grade_points
FROM marks m;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✓ Database fixed successfully!' as status;
SELECT 'Run seed_data.sql to populate with sample data if needed.' as next_step;
