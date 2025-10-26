-- DISABLE FOREIGN KEY CHECKS
SET FOREIGN_KEY_CHECKS = 0;

-- ==================== CORE TABLES ====================

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
    credits INT NOT NULL
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
    -- FOREIGN KEYS ADDED LATER
);

CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    faculty_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT,
    phone VARCHAR(15),
    salary DECIMAL(10,2),
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active'
    -- FOREIGN KEYS ADDED LATER
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
    -- FOREIGN KEYS ADDED LATER
);

-- ==================== ACADEMIC TABLES ====================

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    enrollment_date DATE ,
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    UNIQUE KEY unique_enrollment (student_id, section_id)
    -- FOREIGN KEYS ADDED LATER
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
    -- FOREIGN KEYS ADDED LATER
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
    -- FOREIGN KEYS ADDED LATER
);

-- ==================== ADMINISTRATION TABLES ====================

CREATE TABLE IF NOT EXISTS fee_details (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester VARCHAR(10) NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE,
    payment_date DATE NULL,
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending'
    -- FOREIGN KEYS ADDED LATER
);

CREATE TABLE IF NOT EXISTS faculty_leaves (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- FOREIGN KEYS ADDED LATER
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    section_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
);

-- ==================== ADD FOREIGN KEYS AFTER ALL TABLES EXIST ====================

--announcements foreign keys
ALTER TABLE announcements ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id);
ALTER TABLE announcements ADD FOREIGN KEY (section_id) REFERENCES course_sections(section_id);

-- Students foreign keys
ALTER TABLE students ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE students ADD FOREIGN KEY (major_dept_id) REFERENCES departments(dept_id);

-- Faculty foreign keys  
ALTER TABLE faculty ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE faculty ADD FOREIGN KEY (department_id) REFERENCES departments(dept_id);

-- Course sections foreign keys
ALTER TABLE course_sections ADD FOREIGN KEY (course_id) REFERENCES courses(course_id);
ALTER TABLE course_sections ADD FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id);

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

-- ==================== VIEW FOR CALCULATED GRADES ====================

CREATE OR REPLACE VIEW student_grades AS
SELECT 
    m.mark_id,
    m.enrollment_id,
    m.quiz_marks, m.assignment1_marks, m.assignment2_marks,
    m.project_marks, m.midterm_marks, m.final_marks,
    (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
     m.project_marks + m.midterm_marks + m.final_marks) as total_obtained,
    ROUND(((m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
      m.project_marks + m.midterm_marks + m.final_marks) / 100 * 100), 2) as percentage,
    CASE 
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 90 THEN 'A'
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 80 THEN 'B'
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 70 THEN 'C'
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 60 THEN 'D'
        ELSE 'F'
    END as final_grade,
    CASE 
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 90 THEN 4.0
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 80 THEN 3.0
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 70 THEN 2.0
        WHEN (m.quiz_marks + m.assignment1_marks + m.assignment2_marks + 
              m.project_marks + m.midterm_marks + m.final_marks) >= 60 THEN 1.0
        ELSE 0.0
    END as grade_points
FROM marks m;

-- ==================== SAMPLE DATA ====================

INSERT IGNORE INTO departments (dept_code, dept_name) VALUES 
('CS', 'Computer Science'),
('SE', 'Software Engineering'),
('AI', 'Artificial Intelligence');

INSERT IGNORE INTO users (username, password_hash, email, role) VALUES 
('admin', 'admin123', 'admin@university.edu', 'admin');

-- RE-ENABLE FOREIGN KEY CHECKS
SET FOREIGN_KEY_CHECKS = 1;