# 🎓 NotFlex Student Portal + React Frontend

This repository contains the **NotFlex Student Portal** system with a **React + Vite** frontend.

---

## ⚛️ React + Vite

This frontend is built using React and Vite, providing fast hot-module replacement (HMR) and ESLint rules.

Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) — uses [Babel](https://babeljs.io/) for Fast Refresh  
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) — uses [SWC](https://swc.rs/) for Fast Refresh  

---

## 🎓 NotFlex-Student Portal  

A fully normalized and modular **Student Portal** built using **MySQL**.  
This system manages students, faculty, departments, courses, enrollments, grades, attendance, transcripts, and fee records — ensuring academic and administrative operations are efficient, accurate, and scalable.

---

### 👨‍💻 Developers

| Name | Role | GitHub |
|------|------|--------|
| **Zain Saqib** | Full Stack Developer | [@zainsaqib](https://github.com/zainsaqib) |
| **Madiha Aslam** | Full Stack Developer | [@madihaslamnu](https://github.com/madihaslamnu) |
| **Tasbiha Nasir** | Full Stack Developer | [@TasbihaNasir](https://github.com/TasbihaNasir) |

---

*(Keep the rest of the NotFlex content as is — features, modules, database architecture, etc.)*

## 🧩 System Overview



This project follows a 
**fully normalized relational database design (up to 3NF)**
 ensuring data integrity, minimal redundancy, and efficient querying.

### 🗄️ Core Features & Modules


#### 🔐 User Authentication

Implements a secure role-based login system for 
**students**
, 
**faculty**
, and 
**admins**
, using hashed passwords and JWT sessions for API communication.

#### 🏫 Department Management

Maintains centralized records of all 
**departments**
, their 
**faculty members**
, and 
**associated courses**
, ensuring consistent organizational mapping.

#### 🎓 Student Records

Stores complete 
**student profiles**
, including demographic details, contact information, enrollment status, and academic progression across semesters.

#### 📚 Course & Section Management

Manages 
**courses**
, 
**class sections**
, and 
**faculty assignments**
 with constraints on section capacity and semester scheduling.

#### 🧾 Enrollment System

Handles 
**student course registrations**
, ensuring unique enrollment per section and validating prerequisites.

#### 🧮 Marks & Grade Calculation

Supports 
**automated grade and GPA computation**
 using SQL views — calculating percentages, grade points, SGPA, and CGPA dynamically.

#### 🕒 Attendance Tracking

Logs 
**daily student attendance**
, linking each record to its specific class session and enforcing unique constraints per student per date.

#### 📜 Transcript Generation

Generates 
**cumulative academic transcripts**
 with a clear semester-wise breakdown of grades, GPA, and course performance.

#### 💰 Fee Management

Tracks 
**semester-wise fee details**
, including total dues, paid amounts, pending balances, and payment deadlines.

#### 🧍‍♀️ Faculty Leave Management

Allows faculty to 
**submit leave applications**
, with an approval workflow handled by department admins.

---


## 🧱 Database Architecture


The system consists of the following key modules and tables:
| Module | Description | Key Tables |
|---------|-------------|-------------|
| **Core** | Base structure for users, departments, and authentication | `users`, `departments`, `students`, `faculty` |
| **Academics** | Course delivery and student registration | `courses`, `course_sections`, `enrollments` |
| **Grades & GPA** | Marks storage and computed grade metrics | `marks`, `student_grades (VIEW)`, `transcript` |
| **Attendance** | Logs presence/absence per class | `attendance` |
| **Finance** | Fee details, payments, and dues | `fee_details` |
| **Faculty Leave** | Leave management system for teachers | `faculty_leaves` |

🧮 GPA / SGPA Calculation
🎯 SGPA (Semester GPA)

Calculated as the weighted average of grade points × course credits for a single semester.

🧩 CGPA (Cumulative GPA)

Computed from all completed semesters to show a student's overall academic performance.

The student_grades SQL view automatically computes:

Total marks

Percentage

Letter grade (A–F)

Grade points (4.0 scale)

💸 Fee Management Module

Tracks each student’s semester fees, due date, amount paid, and payment status (paid, pending).

Supports partial payments and updates payment dates automatically.

Fully linked to the students table to maintain referential integrity.

📅 Attendance Module

Maintains daily attendance for each section.

Enforces unique attendance constraints to prevent duplicate entries per date.

Generates attendance percentage reports for faculty and admin analysis.

📘 Transcript & Results

Stores semester-wise course grades, credit hours, and GPA contributions.

Dynamically generates transcripts from marks and enrollment data.

Simplifies academic history tracking for both students and administrators.

⚙️ Technical Details
Feature	Description
Database	MySQL 19c / 21c
Normalization	Up to 3rd Normal Form (3NF)
Sequences	Used for auto-increment primary keys
Constraints	PK, FK, UNIQUE, CHECK for integrity enforcement
View	student_grades for derived metrics and reporting
🧰 Setup Instructions

Open MySQL SQL Developer or any compatible IDE.

Run the SQL scripts in the following order:

@create_tables
.
sql


@create_sequences
.
sql


@create_views
.
sql



Verify the tables:

SELECT
 table_name 
FROM
 user_tables;


Insert sample data to test each module.

🔒 Security Features

Role-based access (Student, Faculty, Admin)

Active/inactive status checks for all users

Unique constraints on key academic entities

Prevents duplication in attendance, enrollment, and marks

📈 Future Enhancements

Web dashboard (React + Flask + MySQL)

Online student portal with secure payment integration

Attendance auto-marking via RFID / QR code scanning

GPA visualization and predictive analytics dashboards

🏁 Conclusion

The NotFlex Student Portal is a comprehensive academic and administrative solution designed for efficiency, automation, and scalability.
It ensures data integrity, role-based control, and real-time academic management for institutions of any scale.

💡 Developed By

Zain Saqib, Madiha Aslam, and Tasbiha Nasir
Full Stack Developers | NotFlex Student Portal Team
>>>>>>> 3716091f85af0a417525349ef451e4d98f92cc5c
