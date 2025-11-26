-- Migration: add columns and tables for fee_per_credit, student fee balance, fee component columns, and code_seq tables

ALTER TABLE courses
    ADD COLUMN fee_per_credit DECIMAL(10,2) DEFAULT 10000.00;
ALTER TABLE courses
    ADD COLUMN department_id INT NULL;

ALTER TABLE students
    ADD COLUMN fee_balance DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE course_sections
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE fee_details
    ADD COLUMN tuition_fee DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN lab_fee DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00;

-- seq tables for code generation
CREATE TABLE IF NOT EXISTS student_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faculty_code_seq (
    year_small INT PRIMARY KEY,
    last_seq INT DEFAULT 0
);

-- Add unique constraint for course_code and section uniqueness per course
ALTER TABLE courses ADD UNIQUE INDEX uq_course_code (course_code);
ALTER TABLE course_sections ADD UNIQUE INDEX uq_course_section_course_sectioncode (course_id, section_code);

-- Composite indexes to improve performance for enrollment queries
ALTER TABLE enrollments ADD INDEX idx_enrollments_section_status (section_id, status);
ALTER TABLE enrollments ADD INDEX idx_enrollments_student_status (student_id, status);

-- Add faculty email and admin info
ALTER TABLE faculty
    ADD COLUMN email VARCHAR(100) NULL;
ALTER TABLE faculty
    ADD COLUMN hire_date DATE;

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

-- Add recommended indexes
CREATE INDEX idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX idx_enrollments_section_id ON enrollments (section_id);
CREATE INDEX idx_marks_enrollment_id ON marks (enrollment_id);
CREATE INDEX idx_fee_details_student_id ON fee_details (student_id);
CREATE INDEX idx_course_sections_faculty_id ON course_sections (faculty_id);
CREATE INDEX idx_transcript_student_id ON transcript (student_id);

-- Note: do not uncomment or re-enable commented alter_table for amount_due; amount_due will be maintained by application logic.
