# Database Setup & Troubleshooting Guide

## 📋 Overview

This guide helps you set up and fix the Student Portal database. The database includes comprehensive tables for managing students, faculty, courses, enrollments, marks, attendance, fees, and announcements.

---

## 🆕 Fresh Installation (New Users or Clean Setup)

If you're setting up the database for the first time or want a clean start:

### Step 1: Configure Database Connection

Edit `Backend 1/app/database/connection.py` or set environment variables:

```python
DB_CONFIG = {
    'host': 'localhost',      # Your MySQL host
    'user': 'root',           # Your MySQL username
    'password': 'your_pass',  # Your MySQL password
    'database': 'student_portal',
    'port': 3307,             # Your MySQL port (default: 3306)
}
```

**OR set environment variables:**

```bash
# Windows PowerShell
$env:DB_HOST="localhost"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
$env:DB_NAME="student_portal"
$env:DB_PORT="3307"
```

```bash
# Linux/Mac
export DB_HOST="localhost"
export DB_USER="root"
export DB_PASSWORD="your_password"
export DB_NAME="student_portal"
export DB_PORT="3306"
```

### Step 2: Run Database Initialization

```bash
# Navigate to backend directory
cd "Backend 1"

# Activate virtual environment (if using one)
# Windows:
..\venv\Scripts\Activate.ps1
# Linux/Mac:
source ../venv/bin/activate

# Initialize database with schema
python -c "from app.database.connection import init_db; init_db()"
```

### Step 3: Load Sample Data

```bash
# Load comprehensive seed data
mysql -u root -p -P 3307 student_portal < app/database/seed_data.sql
```

**OR using Python:**

```bash
python -c "from app.database.connection import get_connection; import os; conn = get_connection(); cursor = conn.cursor(); cursor.execute(open('app/database/seed_data.sql').read()); conn.commit(); conn.close(); print('✓ Data loaded')"
```

### Step 4: Verify Installation

```bash
# Check if tables were created
mysql -u root -p -P 3307 -e "USE student_portal; SHOW TABLES;"

# Check sample data counts
mysql -u root -p -P 3307 -e "USE student_portal; 
  SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users
  UNION ALL SELECT 'Students', COUNT(*) FROM students
  UNION ALL SELECT 'Faculty', COUNT(*) FROM faculty
  UNION ALL SELECT 'Courses', COUNT(*) FROM courses
  UNION ALL SELECT 'Enrollments', COUNT(*) FROM enrollments;"
```

**Expected Output:**
- Users: 31
- Students: 20
- Faculty: 10
- Courses: 20
- Enrollments: 41+

---

## 🔧 Fix Existing Database (Already Have Data)

If you already have a database with data but experiencing issues:

### Option 1: Apply Fix Script (Recommended)

```bash
# This script fixes foreign keys, adds missing columns, and repairs data
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/fix_existing_db.sql"
```

This will:
- ✅ Fix all foreign key relationships
- ✅ Add missing columns (email, hire_date, fee_balance, etc.)
- ✅ Update data integrity (calculate fees, update balances)
- ✅ Recreate views and indexes
- ⚠️ **Does NOT delete existing data**

### Option 2: Backup, Drop, and Recreate

```bash
# 1. Backup existing database
mysqldump -u root -p -P 3307 student_portal > backup_$(date +%Y%m%d).sql

# 2. Drop and recreate database
mysql -u root -p -P 3307 -e "DROP DATABASE IF EXISTS student_portal; CREATE DATABASE student_portal;"

# 3. Run schema
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/schema.sql"

# 4. Load seed data
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/seed_data.sql"
```

---

## 🚀 Quick Start (After Setup)

### Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `password123`

**Faculty (10 available):**
- Username: `24f-001` to `24f-005`, `23f-001` to `23f-005`
- Password: `password123`
- Example: `24f-001` (John Smith - Computer Science)

**Students (20 available):**
- Username: `24k-001` to `24k-007` (2024 batch, Semester 1)
- Username: `23k-001` to `23k-007` (2023 batch, Semester 3)
- Username: `22k-001` to `22k-006` (2022 batch, Semester 5)
- Password: `password123`
- Example: `24k-001` (Alice Anderson - CS Dept)

---

## 📊 Database Structure

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Authentication | Links to students/faculty/admin |
| `students` | Student profiles | → users, departments, enrollments |
| `faculty` | Faculty profiles | → users, departments, sections |
| `departments` | Academic departments | ← students, faculty, courses |
| `courses` | Course catalog | → departments, sections |
| `course_sections` | Course offerings | → courses, faculty, enrollments |
| `enrollments` | Student registrations | → students, sections, marks |
| `marks` | Student grades | → enrollments |
| `attendance` | Attendance records | → students, sections |
| `transcript` | Academic records | → students |
| `fee_details` | Fee management | → students |
| `faculty_leaves` | Leave requests | → faculty |
| `announcements` | Faculty announcements | → faculty, sections |
| `admin_announcements` | Admin announcements | → users |
| `faculty_attendance` | Faculty attendance | → faculty, users |

### Key Features

✅ **Foreign Key Cascades**: Proper ON DELETE CASCADE/SET NULL
✅ **Data Integrity**: Unique constraints, NOT NULL where needed
✅ **Automatic Calculations**: Views for grade computation
✅ **Sample Data**: 20 students, 10 faculty, 20 courses, 40+ enrollments

---

## 🐛 Common Issues & Solutions

### Issue 1: "Access Denied" Error

**Symptom:**
```
Error: Access denied for user 'root'@'localhost'
```

**Solution:**
```bash
# Check MySQL is running
mysql --version

# Try connecting manually
mysql -u root -p -P 3307

# Update password in connection.py or environment variables
```

### Issue 2: "Database doesn't exist"

**Symptom:**
```
Error: Unknown database 'student_portal'
```

**Solution:**
```bash
# Create database manually
mysql -u root -p -P 3307 -e "CREATE DATABASE student_portal;"

# Then run schema
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/schema.sql"
```

### Issue 3: "Foreign key constraint fails"

**Symptom:**
```
Error: Cannot add or update a child row: a foreign key constraint fails
```

**Solution:**
```bash
# Run the fix script to repair relationships
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/fix_existing_db.sql"
```

### Issue 4: "Column doesn't exist" (email, fee_balance, etc.)

**Symptom:**
```
Error: Unknown column 'faculty.email' in 'field list'
```

**Solution:**
```bash
# Run fix script to add missing columns
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/fix_existing_db.sql"
```

### Issue 5: Empty Tables / No Data

**Symptom:**
- Database exists but no students/faculty/courses appear

**Solution:**
```bash
# Load seed data
mysql -u root -p -P 3307 student_portal < "Backend 1/app/database/seed_data.sql"
```

### Issue 6: Port Issues (Can't connect)

**Symptom:**
```
Error: Can't connect to MySQL server on 'localhost'
```

**Solution:**
```bash
# Check which port MySQL is running on
mysql -u root -p --port=3306  # Try default port
mysql -u root -p --port=3307  # Try alternate port

# Update connection.py with correct port
```

---

## 📝 Manual Verification Commands

### Check Database Status

```sql
-- Show all tables
USE student_portal;
SHOW TABLES;

-- Check table row counts
SELECT 
    'users' as tbl, COUNT(*) as cnt FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'course_sections', COUNT(*) FROM course_sections
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'marks', COUNT(*) FROM marks
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL SELECT 'fee_details', COUNT(*) FROM fee_details;
```

### Check Foreign Keys

```sql
-- List all foreign keys
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'student_portal'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Check Sample Users

```sql
-- List admin user
SELECT * FROM users WHERE role = 'admin';

-- List first 3 students
SELECT u.username, s.first_name, s.last_name, s.student_code, d.dept_name
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN departments d ON s.major_dept_id = d.dept_id
LIMIT 3;

-- List first 3 faculty
SELECT u.username, f.first_name, f.last_name, f.faculty_code, d.dept_name
FROM faculty f
JOIN users u ON f.user_id = u.user_id
JOIN departments d ON f.department_id = d.dept_id
LIMIT 3;
```

---

## 🔄 Update from GitHub

If someone clones from GitHub and needs to set up the database:

```bash
# 1. Clone repository
git clone <repository-url>
cd NotFlexStudentPortal

# 2. Install Python dependencies
cd "Backend 1"
pip install -r requirements.txt

# 3. Configure database (update connection.py or set env variables)

# 4. Initialize database
python -c "from app.database.connection import init_db; init_db()"

# 5. Load seed data
mysql -u root -p -P 3307 student_portal < app/database/seed_data.sql

# 6. Start backend
python main.py

# 7. In another terminal, start frontend
cd ../frontend
npm install
npm run dev
```

---

## 📋 File Summary

| File | Purpose | When to Use |
|------|---------|-------------|
| `schema.sql` | Create fresh database structure | New installation |
| `seed_data.sql` | Populate with sample data | After schema creation |
| `fix_existing_db.sql` | Fix existing database issues | When having problems |
| `migrate_update_schema.sql` | Incremental updates | Auto-applied by init_db() |

---

## 💡 Best Practices

1. **Always backup before major changes:**
   ```bash
   mysqldump -u root -p -P 3307 student_portal > backup.sql
   ```

2. **Use environment variables for credentials** (don't commit passwords to Git)

3. **Test with seed data first** before adding real data

4. **Keep track of your MySQL port** (3306 or 3307 are common)

5. **Run fix_existing_db.sql** if you experience foreign key issues

---

## 🆘 Still Having Issues?

If problems persist:

1. Check MySQL error logs
2. Verify MySQL service is running
3. Ensure Python dependencies are installed: `pip install pymysql`
4. Try connecting with MySQL Workbench to verify credentials
5. Check if firewall is blocking MySQL port

---

## 📞 Support

For issues not covered here:
- Check the backend logs in the terminal
- Review `Backend 1/app/database/connection.py` configuration
- Verify MySQL is running: `mysql --version`

---

**Last Updated:** December 2024
**Database Version:** 1.0
**Compatible With:** MySQL 5.7+, MariaDB 10.3+
