-- ==================== COMPREHENSIVE SEED DATA ====================
-- This file populates the database with realistic sample data
-- Run after schema.sql to have a fully functional system
-- ==================== 

SET FOREIGN_KEY_CHECKS = 0;

-- ==================== DEPARTMENTS ====================
INSERT INTO departments (dept_id, dept_code, dept_name) VALUES
(1, 'CS', 'Computer Science'),
(2, 'EE', 'Electrical Engineering'),
(3, 'ME', 'Mechanical Engineering'),
(4, 'BBA', 'Business Administration'),
(5, 'MATH', 'Mathematics')
ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name);

-- ==================== USERS ====================
-- Password for all users: "password123"
INSERT INTO users (user_id, username, password_hash, email, role, is_active) VALUES
-- Admin
(1, 'admin', 'password123', 'admin@university.edu', 'admin', TRUE),

-- Faculty (10 members)
(2, '24f-001', 'password123', 'john.smith@university.edu', 'faculty', TRUE),
(3, '23f-001', 'password123', 'sarah.johnson@university.edu', 'faculty', TRUE),
(4, '24f-002', 'password123', 'michael.brown@university.edu', 'faculty', TRUE),
(5, '23f-002', 'password123', 'emily.davis@university.edu', 'faculty', TRUE),
(6, '24f-003', 'password123', 'david.wilson@university.edu', 'faculty', TRUE),
(7, '23f-003', 'password123', 'lisa.martinez@university.edu', 'faculty', TRUE),
(8, '24f-004', 'password123', 'james.garcia@university.edu', 'faculty', TRUE),
(9, '23f-004', 'password123', 'jennifer.rodriguez@university.edu', 'faculty', TRUE),
(10, '24f-005', 'password123', 'robert.miller@university.edu', 'faculty', TRUE),
(11, '23f-005', 'password123', 'maria.hernandez@university.edu', 'faculty', TRUE),

-- Students (20 students)
(12, '24k-001', 'password123', 'alice.student@university.edu', 'student', TRUE),
(13, '24k-002', 'password123', 'bob.student@university.edu', 'student', TRUE),
(14, '24k-003', 'password123', 'charlie.student@university.edu', 'student', TRUE),
(15, '24k-004', 'password123', 'diana.student@university.edu', 'student', TRUE),
(16, '24k-005', 'password123', 'eve.student@university.edu', 'student', TRUE),
(17, '23k-001', 'password123', 'frank.student@university.edu', 'student', TRUE),
(18, '23k-002', 'password123', 'grace.student@university.edu', 'student', TRUE),
(19, '23k-003', 'password123', 'henry.student@university.edu', 'student', TRUE),
(20, '23k-004', 'password123', 'iris.student@university.edu', 'student', TRUE),
(21, '23k-005', 'password123', 'jack.student@university.edu', 'student', TRUE),
(22, '22k-001', 'password123', 'kelly.student@university.edu', 'student', TRUE),
(23, '22k-002', 'password123', 'leo.student@university.edu', 'student', TRUE),
(24, '22k-003', 'password123', 'monica.student@university.edu', 'student', TRUE),
(25, '22k-004', 'password123', 'nathan.student@university.edu', 'student', TRUE),
(26, '22k-005', 'password123', 'olivia.student@university.edu', 'student', TRUE),
(27, '24k-006', 'password123', 'peter.student@university.edu', 'student', TRUE),
(28, '24k-007', 'password123', 'quinn.student@university.edu', 'student', TRUE),
(29, '23k-006', 'password123', 'rachel.student@university.edu', 'student', TRUE),
(30, '23k-007', 'password123', 'samuel.student@university.edu', 'student', TRUE),
(31, '22k-006', 'password123', 'tina.student@university.edu', 'student', TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- ==================== ADMIN INFO ====================
INSERT INTO admin_info (admin_id, user_id, name, department, email, contact) VALUES
(1, 1, 'Admin User', 'Administration', 'admin@university.edu', '+1-555-0100')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ==================== FACULTY ====================
INSERT INTO faculty (faculty_id, user_id, faculty_code, first_name, last_name, department_id, phone, email, hire_date, salary, status) VALUES
(1, 2, '24f-001', 'John', 'Smith', 1, '+1-555-0201', 'john.smith@university.edu', '2024-01-15', 0.00, 'active'),
(2, 3, '23f-001', 'Sarah', 'Johnson', 1, '+1-555-0202', 'sarah.johnson@university.edu', '2023-08-20', 0.00, 'active'),
(3, 4, '24f-002', 'Michael', 'Brown', 2, '+1-555-0203', 'michael.brown@university.edu', '2024-02-10', 0.00, 'active'),
(4, 5, '23f-002', 'Emily', 'Davis', 2, '+1-555-0204', 'emily.davis@university.edu', '2023-09-05', 0.00, 'active'),
(5, 6, '24f-003', 'David', 'Wilson', 3, '+1-555-0205', 'david.wilson@university.edu', '2024-01-20', 0.00, 'active'),
(6, 7, '23f-003', 'Lisa', 'Martinez', 3, '+1-555-0206', 'lisa.martinez@university.edu', '2023-08-15', 0.00, 'active'),
(7, 8, '24f-004', 'James', 'Garcia', 4, '+1-555-0207', 'james.garcia@university.edu', '2024-03-01', 0.00, 'active'),
(8, 9, '23f-004', 'Jennifer', 'Rodriguez', 4, '+1-555-0208', 'jennifer.rodriguez@university.edu', '2023-09-10', 0.00, 'active'),
(9, 10, '24f-005', 'Robert', 'Miller', 5, '+1-555-0209', 'robert.miller@university.edu', '2024-02-15', 0.00, 'active'),
(10, 11, '23f-005', 'Maria', 'Hernandez', 5, '+1-555-0210', 'maria.hernandez@university.edu', '2023-08-25', 0.00, 'active')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name);

-- ==================== STUDENTS ====================
INSERT INTO students (student_id, user_id, student_code, first_name, last_name, date_of_birth, phone, cnic, enrollment_date, major_dept_id, current_semester, status, fee_balance) VALUES
-- 2024 Batch (Semester 1)
(1, 12, '24k-001', 'Alice', 'Anderson', '2006-03-15', '+1-555-1001', '12345-6789012-3', '2024-09-01', 1, 1, 'active', 0.00),
(2, 13, '24k-002', 'Bob', 'Baker', '2006-05-20', '+1-555-1002', '12345-6789013-4', '2024-09-01', 1, 1, 'active', 0.00),
(3, 14, '24k-003', 'Charlie', 'Clark', '2006-07-10', '+1-555-1003', '12345-6789014-5', '2024-09-01', 2, 1, 'active', 0.00),
(4, 15, '24k-004', 'Diana', 'Davis', '2006-02-28', '+1-555-1004', '12345-6789015-6', '2024-09-01', 2, 1, 'active', 0.00),
(5, 16, '24k-005', 'Eve', 'Evans', '2006-04-18', '+1-555-1005', '12345-6789016-7', '2024-09-01', 3, 1, 'active', 0.00),
(6, 27, '24k-006', 'Peter', 'Parker', '2006-06-12', '+1-555-1006', '12345-6789017-8', '2024-09-01', 4, 1, 'active', 0.00),
(7, 28, '24k-007', 'Quinn', 'Queen', '2006-08-25', '+1-555-1007', '12345-6789018-9', '2024-09-01', 5, 1, 'active', 0.00),

-- 2023 Batch (Semester 3)
(8, 17, '23k-001', 'Frank', 'Foster', '2005-01-15', '+1-555-1008', '12345-6789019-0', '2023-09-01', 1, 3, 'active', 0.00),
(9, 18, '23k-002', 'Grace', 'Green', '2005-03-20', '+1-555-1009', '12345-6789020-1', '2023-09-01', 1, 3, 'active', 0.00),
(10, 19, '23k-003', 'Henry', 'Harris', '2005-05-08', '+1-555-1010', '12345-6789021-2', '2023-09-01', 2, 3, 'active', 0.00),
(11, 20, '23k-004', 'Iris', 'Irwin', '2005-07-22', '+1-555-1011', '12345-6789022-3', '2023-09-01', 2, 3, 'active', 0.00),
(12, 21, '23k-005', 'Jack', 'Jackson', '2005-09-30', '+1-555-1012', '12345-6789023-4', '2023-09-01', 3, 3, 'active', 0.00),
(13, 29, '23k-006', 'Rachel', 'Reed', '2005-11-14', '+1-555-1013', '12345-6789024-5', '2023-09-01', 4, 3, 'active', 0.00),
(14, 30, '23k-007', 'Samuel', 'Scott', '2005-12-05', '+1-555-1014', '12345-6789025-6', '2023-09-01', 5, 3, 'active', 0.00),

-- 2022 Batch (Semester 5)
(15, 22, '22k-001', 'Kelly', 'King', '2004-02-10', '+1-555-1015', '12345-6789026-7', '2022-09-01', 1, 5, 'active', 0.00),
(16, 23, '22k-002', 'Leo', 'Lewis', '2004-04-16', '+1-555-1016', '12345-6789027-8', '2022-09-01', 1, 5, 'active', 0.00),
(17, 24, '22k-003', 'Monica', 'Moore', '2004-06-22', '+1-555-1017', '12345-6789028-9', '2022-09-01', 2, 5, 'active', 0.00),
(18, 25, '22k-004', 'Nathan', 'Nelson', '2004-08-08', '+1-555-1018', '12345-6789029-0', '2022-09-01', 3, 5, 'active', 0.00),
(19, 26, '22k-005', 'Olivia', 'Owens', '2004-10-19', '+1-555-1019', '12345-6789030-1', '2022-09-01', 4, 5, 'active', 0.00),
(20, 31, '22k-006', 'Tina', 'Turner', '2004-12-31', '+1-555-1020', '12345-6789031-2', '2022-09-01', 5, 5, 'active', 0.00)
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name);

-- ==================== COURSES ====================
INSERT INTO courses (course_id, course_code, course_name, credits, fee_per_credit, department_id) VALUES
-- Computer Science
(1, 'CS101', 'Introduction to Programming', 3, 10000.00, 1),
(2, 'CS201', 'Data Structures', 3, 10000.00, 1),
(3, 'CS301', 'Database Systems', 3, 10000.00, 1),
(4, 'CS401', 'Software Engineering', 3, 10000.00, 1),
(5, 'CS202', 'Object Oriented Programming', 4, 10000.00, 1),

-- Electrical Engineering
(6, 'EE101', 'Circuit Analysis', 3, 10000.00, 2),
(7, 'EE201', 'Digital Logic Design', 3, 10000.00, 2),
(8, 'EE301', 'Signals and Systems', 4, 10000.00, 2),
(9, 'EE401', 'Control Systems', 3, 10000.00, 2),

-- Mechanical Engineering
(10, 'ME101', 'Engineering Mechanics', 3, 10000.00, 3),
(11, 'ME201', 'Thermodynamics', 3, 10000.00, 3),
(12, 'ME301', 'Fluid Mechanics', 3, 10000.00, 3),
(13, 'ME401', 'Machine Design', 4, 10000.00, 3),

-- Business Administration
(14, 'BBA101', 'Principles of Management', 3, 10000.00, 4),
(15, 'BBA201', 'Financial Accounting', 3, 10000.00, 4),
(16, 'BBA301', 'Marketing Management', 3, 10000.00, 4),
(17, 'BBA401', 'Strategic Management', 3, 10000.00, 4),

-- Mathematics
(18, 'MATH101', 'Calculus I', 3, 10000.00, 5),
(19, 'MATH201', 'Linear Algebra', 3, 10000.00, 5),
(20, 'MATH301', 'Differential Equations', 3, 10000.00, 5)
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

-- ==================== COURSE SECTIONS (Fall 2024) ====================
INSERT INTO course_sections (section_id, course_id, faculty_id, section_code, semester, year, schedule, room, max_capacity, is_active) VALUES
-- CS Sections
(1, 1, 1, 'A', 'Fall', 2024, 'MWF 09:00-10:00', 'CS-101', 30, TRUE),
(2, 1, 2, 'B', 'Fall', 2024, 'TTH 10:00-11:30', 'CS-102', 30, TRUE),
(3, 2, 1, 'A', 'Fall', 2024, 'MWF 11:00-12:00', 'CS-103', 25, TRUE),
(4, 3, 2, 'A', 'Fall', 2024, 'TTH 13:00-14:30', 'CS-104', 25, TRUE),
(5, 5, 1, 'A', 'Fall', 2024, 'MWF 14:00-15:30', 'CS-105', 28, TRUE),

-- EE Sections
(6, 6, 3, 'A', 'Fall', 2024, 'MWF 09:00-10:00', 'EE-201', 30, TRUE),
(7, 7, 4, 'A', 'Fall', 2024, 'TTH 11:00-12:30', 'EE-202', 25, TRUE),
(8, 8, 3, 'A', 'Fall', 2024, 'MWF 13:00-14:30', 'EE-203', 25, TRUE),

-- ME Sections
(9, 10, 5, 'A', 'Fall', 2024, 'MWF 10:00-11:00', 'ME-301', 30, TRUE),
(10, 11, 6, 'A', 'Fall', 2024, 'TTH 09:00-10:30', 'ME-302', 28, TRUE),
(11, 12, 5, 'A', 'Fall', 2024, 'MWF 15:00-16:00', 'ME-303', 25, TRUE),

-- BBA Sections
(12, 14, 7, 'A', 'Fall', 2024, 'TTH 10:00-11:30', 'BBA-401', 35, TRUE),
(13, 15, 8, 'A', 'Fall', 2024, 'MWF 11:00-12:00', 'BBA-402', 30, TRUE),
(14, 16, 7, 'A', 'Fall', 2024, 'TTH 14:00-15:30', 'BBA-403', 30, TRUE),

-- MATH Sections
(15, 18, 9, 'A', 'Fall', 2024, 'MWF 08:00-09:00', 'MATH-501', 40, TRUE),
(16, 19, 10, 'A', 'Fall', 2024, 'TTH 13:00-14:30', 'MATH-502', 35, TRUE),
(17, 20, 9, 'A', 'Fall', 2024, 'MWF 16:00-17:00', 'MATH-503', 30, TRUE)
ON DUPLICATE KEY UPDATE schedule = VALUES(schedule);

-- ==================== ENROLLMENTS ====================
INSERT INTO enrollments (enrollment_id, student_id, section_id, enrollment_date, status) VALUES
-- First year students (CS)
(1, 1, 1, '2024-09-01', 'enrolled'),
(2, 1, 15, '2024-09-01', 'enrolled'),
(3, 2, 2, '2024-09-01', 'enrolled'),
(4, 2, 15, '2024-09-01', 'enrolled'),

-- First year students (EE)
(5, 3, 6, '2024-09-01', 'enrolled'),
(6, 3, 15, '2024-09-01', 'enrolled'),
(7, 4, 6, '2024-09-01', 'enrolled'),
(8, 4, 15, '2024-09-01', 'enrolled'),

-- First year students (ME)
(9, 5, 9, '2024-09-01', 'enrolled'),
(10, 5, 15, '2024-09-01', 'enrolled'),

-- First year students (BBA & MATH)
(11, 6, 12, '2024-09-01', 'enrolled'),
(12, 6, 15, '2024-09-01', 'enrolled'),
(13, 7, 15, '2024-09-01', 'enrolled'),
(14, 7, 16, '2024-09-01', 'enrolled'),

-- Third year students (CS)
(15, 8, 3, '2024-09-01', 'enrolled'),
(16, 8, 4, '2024-09-01', 'enrolled'),
(17, 8, 5, '2024-09-01', 'enrolled'),
(18, 9, 3, '2024-09-01', 'enrolled'),
(19, 9, 4, '2024-09-01', 'enrolled'),

-- Third year students (EE)
(20, 10, 7, '2024-09-01', 'enrolled'),
(21, 10, 8, '2024-09-01', 'enrolled'),
(22, 11, 7, '2024-09-01', 'enrolled'),
(23, 11, 8, '2024-09-01', 'enrolled'),

-- Third year students (ME)
(24, 12, 10, '2024-09-01', 'enrolled'),
(25, 12, 11, '2024-09-01', 'enrolled'),

-- Third year students (BBA & MATH)
(26, 13, 13, '2024-09-01', 'enrolled'),
(27, 13, 14, '2024-09-01', 'enrolled'),
(28, 14, 16, '2024-09-01', 'enrolled'),
(29, 14, 17, '2024-09-01', 'enrolled'),

-- Fifth year students (CS)
(30, 15, 4, '2024-09-01', 'enrolled'),
(31, 15, 5, '2024-09-01', 'enrolled'),
(32, 16, 4, '2024-09-01', 'enrolled'),
(33, 16, 5, '2024-09-01', 'enrolled'),

-- Fifth year students (EE)
(34, 17, 8, '2024-09-01', 'enrolled'),
(35, 17, 7, '2024-09-01', 'enrolled'),

-- Fifth year students (ME)
(36, 18, 11, '2024-09-01', 'enrolled'),
(37, 18, 10, '2024-09-01', 'enrolled'),

-- Fifth year students (BBA & MATH)
(38, 19, 14, '2024-09-01', 'enrolled'),
(39, 19, 13, '2024-09-01', 'enrolled'),
(40, 20, 17, '2024-09-01', 'enrolled'),
(41, 20, 16, '2024-09-01', 'enrolled')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ==================== MARKS ====================
INSERT INTO marks (mark_id, enrollment_id, quiz_marks, assignment1_marks, assignment2_marks, project_marks, midterm_marks, final_marks, quiz_total, assignment1_total, assignment2_total, project_total, midterm_total, final_total) VALUES
-- Excellent students
(1, 1, 9.5, 9.0, 9.5, 18.0, 18.5, 27.0, 10, 10, 10, 20, 20, 30),
(2, 3, 9.0, 9.5, 9.0, 19.0, 19.0, 28.0, 10, 10, 10, 20, 20, 30),
(3, 5, 8.5, 9.0, 9.0, 17.5, 18.0, 26.5, 10, 10, 10, 20, 20, 30),

-- Good students
(4, 15, 8.0, 8.5, 8.0, 16.0, 16.5, 24.0, 10, 10, 10, 20, 20, 30),
(5, 16, 7.5, 8.0, 8.5, 15.5, 17.0, 23.5, 10, 10, 10, 20, 20, 30),
(6, 17, 8.0, 7.5, 8.0, 16.5, 16.0, 24.5, 10, 10, 10, 20, 20, 30),
(7, 18, 7.0, 8.0, 7.5, 15.0, 16.5, 23.0, 10, 10, 10, 20, 20, 30),

-- Average students
(8, 20, 7.0, 7.0, 7.5, 14.0, 14.5, 21.0, 10, 10, 10, 20, 20, 30),
(9, 21, 6.5, 7.0, 7.0, 13.5, 15.0, 20.5, 10, 10, 10, 20, 20, 30),
(10, 22, 7.5, 6.5, 7.0, 14.5, 14.0, 21.5, 10, 10, 10, 20, 20, 30),

-- Below average students
(11, 30, 6.0, 6.5, 6.0, 12.0, 12.5, 18.0, 10, 10, 10, 20, 20, 30),
(12, 31, 6.5, 6.0, 6.5, 11.5, 13.0, 17.5, 10, 10, 10, 20, 20, 30),
(13, 32, 5.5, 6.0, 6.0, 12.5, 12.0, 18.5, 10, 10, 10, 20, 20, 30),
(14, 34, 6.0, 5.5, 6.5, 11.0, 13.5, 17.0, 10, 10, 10, 20, 20, 30)
ON DUPLICATE KEY UPDATE quiz_marks = VALUES(quiz_marks);

-- ==================== ATTENDANCE ====================
-- Generate attendance for the last 30 days for enrolled students
INSERT INTO attendance (student_id, section_id, attendance_date, status) 
SELECT 
    e.student_id,
    e.section_id,
    DATE_SUB(CURDATE(), INTERVAL n.n DAY) as attendance_date,
    CASE 
        WHEN RAND() > 0.15 THEN 'present'  -- 85% attendance rate
        ELSE 'absent'
    END as status
FROM enrollments e
CROSS JOIN (
    SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
    SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
    SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL
    SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
    SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL
    SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
) n
WHERE e.status = 'enrolled'
AND DATE_SUB(CURDATE(), INTERVAL n.n DAY) >= '2024-09-01'
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ==================== FEE DETAILS ====================
-- Calculate fees based on enrolled credits
INSERT INTO fee_details (student_id, semester, tuition_fee, lab_fee, miscellaneous_fee, amount_due, amount_paid, due_date, payment_date, status)
SELECT 
    s.student_id,
    'Fall 2024' as semester,
    SUM(c.credits * c.fee_per_credit) as tuition_fee,
    5000.00 as lab_fee,
    3000.00 as miscellaneous_fee,
    SUM(c.credits * c.fee_per_credit) + 5000.00 + 3000.00 as amount_due,
    CASE 
        WHEN s.student_id % 3 = 0 THEN SUM(c.credits * c.fee_per_credit) + 5000.00 + 3000.00  -- Paid
        WHEN s.student_id % 3 = 1 THEN (SUM(c.credits * c.fee_per_credit) + 5000.00 + 3000.00) / 2  -- Partial
        ELSE 0.00  -- Unpaid
    END as amount_paid,
    DATE_ADD(s.enrollment_date, INTERVAL 30 DAY) as due_date,
    CASE 
        WHEN s.student_id % 3 = 0 THEN DATE_ADD(s.enrollment_date, INTERVAL 25 DAY)
        ELSE NULL
    END as payment_date,
    CASE 
        WHEN s.student_id % 3 = 0 THEN 'paid'
        WHEN DATE_ADD(s.enrollment_date, INTERVAL 30 DAY) < CURDATE() THEN 'overdue'
        ELSE 'pending'
    END as status
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN course_sections cs ON e.section_id = cs.section_id
JOIN courses c ON cs.course_id = c.course_id
WHERE e.status = 'enrolled'
GROUP BY s.student_id, s.enrollment_date
ON DUPLICATE KEY UPDATE tuition_fee = VALUES(tuition_fee);

-- Update student fee balance
UPDATE students s
SET fee_balance = (
    SELECT IFNULL(SUM(fd.amount_due - fd.amount_paid), 0)
    FROM fee_details fd
    WHERE fd.student_id = s.student_id
);

-- ==================== TRANSCRIPT ====================
-- Add completed courses to transcript for senior students
INSERT INTO transcript (student_id, course_code, course_name, credits, semester, final_grade, grade_points) VALUES
-- Student 15 (22k-001) - Excellent student
(15, 'CS101', 'Introduction to Programming', 3, 'Fall 2022', 'A', 4.0),
(15, 'CS201', 'Data Structures', 3, 'Spring 2023', 'A', 4.0),
(15, 'MATH101', 'Calculus I', 3, 'Fall 2022', 'B', 3.0),
(15, 'MATH201', 'Linear Algebra', 3, 'Spring 2023', 'A', 4.0),

-- Student 16 (22k-002) - Good student
(16, 'CS101', 'Introduction to Programming', 3, 'Fall 2022', 'B', 3.0),
(16, 'CS201', 'Data Structures', 3, 'Spring 2023', 'B', 3.0),
(16, 'MATH101', 'Calculus I', 3, 'Fall 2022', 'C', 2.0),
(16, 'CS202', 'Object Oriented Programming', 4, 'Fall 2023', 'B', 3.0),

-- Student 17 (22k-003) - Average student
(17, 'EE101', 'Circuit Analysis', 3, 'Fall 2022', 'C', 2.0),
(17, 'EE201', 'Digital Logic Design', 3, 'Spring 2023', 'B', 3.0),
(17, 'MATH101', 'Calculus I', 3, 'Fall 2022', 'C', 2.0),

-- Student 8 (23k-001) - Third year
(8, 'CS101', 'Introduction to Programming', 3, 'Fall 2023', 'A', 4.0),
(8, 'MATH101', 'Calculus I', 3, 'Fall 2023', 'B', 3.0),

-- Student 9 (23k-002)
(9, 'CS101', 'Introduction to Programming', 3, 'Fall 2023', 'B', 3.0),
(9, 'MATH101', 'Calculus I', 3, 'Fall 2023', 'B', 3.0)
ON DUPLICATE KEY UPDATE final_grade = VALUES(final_grade);

-- ==================== FACULTY LEAVES ====================
INSERT INTO faculty_leaves (faculty_id, leave_date, reason, status, applied_at) VALUES
(1, '2024-12-20', 'Medical appointment', 'approved', '2024-12-10 09:00:00'),
(2, '2024-12-15', 'Family emergency', 'approved', '2024-12-08 14:30:00'),
(3, '2024-12-25', 'Personal leave', 'pending', '2024-12-15 10:00:00'),
(4, '2024-12-22', 'Conference attendance', 'approved', '2024-12-05 11:20:00'),
(5, '2024-12-18', 'Sick leave', 'pending', '2024-12-16 08:45:00')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ==================== FACULTY ATTENDANCE ====================
-- Generate faculty attendance for last 30 days
INSERT INTO faculty_attendance (faculty_id, attendance_date, session, status, marked_by)
SELECT 
    f.faculty_id,
    DATE_SUB(CURDATE(), INTERVAL n.n DAY) as attendance_date,
    CASE 
        WHEN n.n % 2 = 0 THEN 'Morning'
        ELSE 'Evening'
    END as session,
    CASE 
        WHEN RAND() > 0.10 THEN 'present'  -- 90% attendance for faculty
        ELSE 'absent'
    END as status,
    1 as marked_by  -- Marked by admin
FROM faculty f
CROSS JOIN (
    SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
    SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
    SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL
    SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
    SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL
    SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
) n
WHERE f.status = 'active'
AND DATE_SUB(CURDATE(), INTERVAL n.n DAY) >= '2024-09-01'
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ==================== ANNOUNCEMENTS (Faculty) ====================
INSERT INTO announcements (faculty_id, section_id, title, message, created_at) VALUES
(1, 1, 'Midterm Exam Schedule', 'The midterm exam for CS101 Section A will be held on December 15, 2024 at 9:00 AM in CS-101. Please bring your student ID and calculator.', '2024-12-01 10:00:00'),
(1, 3, 'Assignment 2 Deadline Extended', 'Due to popular request, Assignment 2 deadline has been extended to December 20, 2024. Please submit via the online portal.', '2024-12-05 14:30:00'),
(2, 2, 'Guest Lecture Next Week', 'Dr. Jane Smith from Tech Corp will deliver a guest lecture on Software Development Practices next Tuesday. Attendance is mandatory.', '2024-12-02 09:15:00'),
(3, 6, 'Lab Session Rescheduled', 'This week''s lab session has been moved from Wednesday to Thursday at the same time due to equipment maintenance.', '2024-12-03 16:00:00'),
(4, 7, 'Project Submission Guidelines', 'Please ensure your final project includes documentation, source code, and a demo video. Submission portal will close on December 18, 2024 at 11:59 PM.', '2024-12-04 11:00:00'),
(5, 9, 'Extra Office Hours', 'I will hold extra office hours this week on Thursday 2-4 PM in ME-301 to help with exam preparation. Feel free to drop by with questions.', '2024-12-06 08:30:00'),
(7, 12, 'Case Study Discussion', 'We will discuss the Amazon business case next class. Please read Chapter 7 and prepare your analysis beforehand.', '2024-12-07 13:00:00'),
(9, 15, 'Quiz Next Class', 'There will be a 15-minute quiz covering topics from Week 10-12 at the beginning of next class. No make-up quizzes will be offered.', '2024-12-08 10:00:00')
ON DUPLICATE KEY UPDATE message = VALUES(message);

-- ==================== ADMIN ANNOUNCEMENTS ====================
INSERT INTO admin_announcements (title, message, type, created_by, created_at, is_active) VALUES
('Winter Break Schedule', 'The university will be closed for winter break from December 23, 2024 to January 5, 2025. Classes resume on January 6, 2025.', 'general', 1, '2024-12-01 09:00:00', TRUE),
('Final Exam Registration', 'All students must register for final exams through the student portal by December 12, 2024. Late registrations will incur a penalty fee of $50.', 'exam', 1, '2024-12-02 10:30:00', TRUE),
('Fee Payment Deadline', 'The deadline for Fall 2024 semester fee payment is December 31, 2024. Students with outstanding fees will not be allowed to register for Spring 2025.', 'fee', 1, '2024-12-03 11:00:00', TRUE),
('Library Extended Hours', 'The library will extend operating hours during exam week (December 15-22). New hours: 7:00 AM - 11:00 PM Monday-Saturday, 9:00 AM - 9:00 PM Sunday.', 'general', 1, '2024-12-04 14:00:00', TRUE),
('Spring 2025 Course Registration', 'Course registration for Spring 2025 semester opens on January 10, 2025. Please meet with your academic advisor before registration.', 'general', 1, '2024-12-05 09:30:00', TRUE),
('Campus Safety Reminder', 'Please ensure all doors are locked and report any suspicious activity to campus security at ext. 2222. New security protocols are now in effect.', 'general', 1, '2024-12-06 16:00:00', TRUE),
('Faculty Meeting Scheduled', 'All faculty members are requested to attend the department meeting on December 18, 2024 at 3:00 PM in Conference Room A to discuss Spring semester planning.', 'meeting', 1, '2024-12-07 08:00:00', TRUE)
ON DUPLICATE KEY UPDATE message = VALUES(message);

-- ==================== REGISTRATION PERIODS ====================
INSERT INTO registration_periods (semester, year, start_date, end_date, is_active) VALUES
('Fall', 2024, '2024-08-01', '2024-09-15', FALSE),
('Spring', 2025, '2025-01-10', '2025-02-01', FALSE),
('Summer', 2024, '2024-05-01', '2024-06-15', FALSE)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- ==================== CODE SEQUENCE TABLES ====================
INSERT INTO student_code_seq (year_small, last_seq) VALUES
(2022, 6),
(2023, 7),
(2024, 7)
ON DUPLICATE KEY UPDATE last_seq = VALUES(last_seq);

INSERT INTO faculty_code_seq (year_small, last_seq) VALUES
(2023, 5),
(2024, 5)
ON DUPLICATE KEY UPDATE last_seq = VALUES(last_seq);

-- Update faculty salaries based on active sections
UPDATE faculty f
SET salary = (
    SELECT IFNULL(SUM(c.credits * c.fee_per_credit), 0)
    FROM course_sections cs
    JOIN courses c ON cs.course_id = c.course_id
    WHERE cs.faculty_id = f.faculty_id
    AND cs.is_active = TRUE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ==================== VERIFICATION QUERIES ====================
-- Run these to verify data was inserted correctly:
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_students FROM students;
-- SELECT COUNT(*) as total_faculty FROM faculty;
-- SELECT COUNT(*) as total_courses FROM courses;
-- SELECT COUNT(*) as total_sections FROM course_sections;
-- SELECT COUNT(*) as total_enrollments FROM enrollments;
-- SELECT COUNT(*) as total_marks FROM marks;
-- SELECT COUNT(*) as total_attendance FROM attendance;
-- SELECT COUNT(*) as total_fees FROM fee_details;

SELECT '✓ Seed data loaded successfully!' as status;
