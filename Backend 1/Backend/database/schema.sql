SET FOREIGN_KEY_CHECKS = 0;

-- ==================== CORE TABLES ====================
--without enum keep it without enummm
CREATE TABLE IF NOT EXISTS faculty_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    session VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    marked_by INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- If there's an error, it will show here
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('student', 'faculty', 'admin') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(10) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    -- store per-credit fee (total course fee = credits * fee_per_credit)
    fee_per_credit DECIMAL(10,2) DEFAULT 10000.00
    ,
    -- map course to department
    department_id INT NULL

);

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(15),
    cnic VARCHAR(15),
    enrollment_date DATE NOT NULL,
    major_dept_id INT,
    current_semester INT DEFAULT 1,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active'
    ,
    -- store running balance or aggregated fee for student (optional: cached)
    fee_balance DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    faculty_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT,
    phone VARCHAR(15),
    salary DECIMAL(10,2) DEFAULT 0.00, -- salary computed as sum of currently teaching sections' course fees
    email VARCHAR(100) NULL,
    hire_date DATE,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active'
    
);

CREATE TABLE IF NOT EXISTS course_sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    faculty_id INT NOT NULL,
    section_code VARCHAR(10) NOT NULL,
    semester ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    year YEAR NOT NULL,
    schedule VARCHAR(100),
    room VARCHAR(50),
    max_capacity INT DEFAULT 30
    ,
    -- track if section is currently active
    is_active BOOLEAN DEFAULT TRUE
    
);

-- ==================== ACADEMIC TABLES ====================

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    enrollment_date DATE ,
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    UNIQUE KEY unique_enrollment (student_id, section_id)
    
);

CREATE TABLE IF NOT EXISTS marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT UNIQUE NOT NULL,
    quiz_marks DECIMAL(5,2) DEFAULT 0,
    assignment1_marks DECIMAL(5,2) DEFAULT 0,
    assignment2_marks DECIMAL(5,2) DEFAULT 0,
    project_marks DECIMAL(5,2) DEFAULT 0,
    midterm_marks DECIMAL(5,2) DEFAULT 0,
    final_marks DECIMAL(5,2) DEFAULT 0,
    quiz_total DECIMAL(5,2) DEFAULT 10,
    assignment1_total DECIMAL(5,2) DEFAULT 10,
    assignment2_total DECIMAL(5,2) DEFAULT 10,
    project_total DECIMAL(5,2) DEFAULT 20,
    midterm_total DECIMAL(5,2) DEFAULT 20,
    final_total DECIMAL(5,2) DEFAULT 30
    -- FOREIGN KEY ADDED LATER
);

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    UNIQUE KEY unique_attendance (student_id, section_id, attendance_date)
    
);

CREATE TABLE IF NOT EXISTS transcript (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    semester VARCHAR(10) NOT NULL,
    final_grade VARCHAR(3),
    grade_points DECIMAL(3,2)
    
);

-- ==================== ADMINISTRATION TABLES ====================

CREATE TABLE IF NOT EXISTS fee_details (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester VARCHAR(10) NOT NULL,
    -- breakdown of fee components: tuition computed from enrolled courses + optional lab/misc
    tuition_fee DECIMAL(10,2) DEFAULT 0.00,
    lab_fee DECIMAL(10,2) DEFAULT 0.00,
    miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00,
    amount_due DECIMAL(10,2) NOT NULL,--must be sum of tuition_fee + lab_fee + miscellaneous_fee
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE,--1 month after student is enrolled 
    payment_date DATE NULL,
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending'
   
);
--ALTER TABLE fee_details 
--ADD COLUMN  tuition_fee DECIMAL(10,2) DEFAULT 0,
--ADD COLUMN  lab_fee DECIMAL(10,2) DEFAULT 0, 
--ADD COLUMN  miscellaneous_fee DECIMAL(10,2) DEFAULT 0,
--MODIFY amount_due  DECIMAL(10,2) AS (tuition_fee + lab_fee + miscellaneous_fee) STORED

CREATE TABLE IF NOT EXISTS faculty_leaves (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    section_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registration_periods (
    period_id INT AUTO_INCREMENT PRIMARY KEY,
    semester ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    year YEAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_semester_year (semester, year)
);

-- Create faculty_attendance table manually

-- ADMIN ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS admin_announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('general', 'exam', 'fee', 'meeting') DEFAULT 'general',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS admin_info (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id)
);





ALTER TABLE students ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE students ADD FOREIGN KEY (major_dept_id) REFERENCES departments(dept_id);


-- Faculty foreign keys  
ALTER TABLE faculty ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE faculty ADD FOREIGN KEY (department_id) REFERENCES departments(dept_id);
-- do not add section_id FK on faculty (sections reference faculty instead)


-- Course sections foreign keys
ALTER TABLE course_sections ADD FOREIGN KEY (course_id) REFERENCES courses(course_id);
ALTER TABLE course_sections ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id);
-- course_sections should not have student_id FK (enrollments link students to sections)

-- Enrollments foreign keys
ALTER TABLE enrollments ADD FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE enrollments ADD FOREIGN KEY (section_id) REFERENCES course_sections(section_id);

-- Marks foreign keys
ALTER TABLE marks ADD FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id);

-- Attendance foreign keys
ALTER TABLE attendance ADD FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE attendance ADD FOREIGN KEY (section_id) REFERENCES course_sections(section_id);

-- Transcript foreign keys
ALTER TABLE transcript ADD FOREIGN KEY (student_id) REFERENCES students(student_id);

-- Fee details foreign keys
ALTER TABLE fee_details ADD FOREIGN KEY (student_id) REFERENCES students(student_id);

-- Faculty leaves foreign keys
ALTER TABLE faculty_leaves ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id);

-- faculry Announcements foreign keys
ALTER TABLE announcements ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE;
ALTER TABLE announcements ADD FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE;

--faculty attendance foriegn keys
ALTER TABLE faculty_attendance ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id);
ALTER TABLE faculty_attendance ADD FOREIGN KEY (marked_by) REFERENCES users(user_id);

--admin announcements foreign keys
ALTER TABLE admin_announcements ADD FOREIGN KEY (created_by) REFERENCES users(user_id);


-- ==================== VIEW FOR CALCULATED GRADES ====================

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
-- RE-ENABLE FOREIGN KEY CHECKS
SET FOREIGN_KEY_CHECKS = 1;

-- ==================== SEQUENCE TABLES FOR CODE GENERATION ====================
CREATE TABLE IF NOT EXISTS student_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faculty_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

-- Indexes to improve query performance on high-traffic joins
CREATE INDEX idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX idx_enrollments_section_id ON enrollments (section_id);
CREATE INDEX idx_marks_enrollment_id ON marks (enrollment_id);
CREATE INDEX idx_fee_details_student_id ON fee_details (student_id);
CREATE INDEX idx_course_sections_faculty_id ON course_sections (faculty_id);
CREATE INDEX idx_transcript_student_id ON transcript (student_id);