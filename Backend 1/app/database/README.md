# Database Files

This folder contains all database-related SQL scripts and configurations.

## 📁 Files

### Core Schema
- **`schema.sql`** - Complete database structure with all tables, views, and indexes
  - Creates all tables from scratch
  - Defines foreign key relationships with proper CASCADE
  - Creates views for calculated grades
  - Adds performance indexes

### Data Management
- **`seed_data.sql`** - Comprehensive sample data for development/testing
  - 31 users (1 admin + 10 faculty + 20 students)
  - 5 departments with 20 courses
  - 17 active course sections
  - 41+ student enrollments
  - Marks, attendance, fees, announcements
  - **All passwords:** `password123`

### Maintenance & Fixes
- **`fix_existing_db.sql`** - Non-destructive repair script
  - Fixes foreign key constraints
  - Adds missing columns
  - Repairs data integrity
  - Updates calculations (fees, salaries, balances)
  - **Safe to run on existing databases**

- **`migrate_update_schema.sql`** - Incremental schema updates
  - Applied automatically by `init_db()`
  - Adds new columns to existing tables
  - Safe for production use

### Python Integration
- **`connection.py`** - Database connection and utilities
  - Connection pooling
  - Transaction support
  - Schema initialization
  - Migration application

- **`__init__.py`** - Package initialization

## 🚀 Quick Commands

### Fresh Setup (New Users)
```bash
python ../setup_database.py --fresh
```

### Fix Existing Database
```bash
python ../setup_database.py --fix
```

### Load Sample Data Only
```bash
python ../setup_database.py --seed
```

### Direct MySQL Commands
```bash
# Create schema
mysql -u root -p -P 3307 student_portal < schema.sql

# Load sample data
mysql -u root -p -P 3307 student_portal < seed_data.sql

# Fix existing database
mysql -u root -p -P 3307 student_portal < fix_existing_db.sql
```

## 🔑 Default Credentials

After loading seed data:

**Admin:** admin / password123  
**Faculty:** 24f-001 / password123  
**Student:** 24k-001 / password123

See `seed_data.sql` for complete list of users.

## 📊 Database Schema Overview

```
users (31)
├── students (20) → enrollments (41+) → marks (14)
├── faculty (10) → course_sections (17)
└── admin_info (1)

departments (5)
├── courses (20)
└── course_sections (17)

enrollments (41+)
├── marks (14)
└── attendance (1000+)

fee_details (20)
announcements (15+)
transcript (20+)
```

## 🔧 What Was Fixed

### Foreign Keys
All tables now have proper CASCADE behaviors:
- Deleting user removes student/faculty record
- Deleting section removes enrollments
- Deleting student removes grades and fees

### Missing Columns
Added critical columns:
- `faculty.email`, `faculty.hire_date`
- `courses.department_id`, `courses.fee_per_credit`
- `students.fee_balance`
- `fee_details.tuition_fee`, `lab_fee`, `miscellaneous_fee`

### Data Integrity
- Calculated fees based on credits
- Updated student balances
- Computed faculty salaries
- Fixed NULL values

## 📖 Documentation

- **`../DATABASE_SETUP_GUIDE.md`** - Complete setup guide with troubleshooting
- **`../QUICK_START.md`** - Quick reference commands
- **`../DATABASE_FIXES_SUMMARY.md`** - Detailed list of fixes applied

## ⚠️ Important Notes

1. **Backup First!** Before running fixes on production data:
   ```bash
   mysqldump -u root -p student_portal > backup.sql
   ```

2. **Schema vs Fix vs Seed:**
   - `schema.sql` - Creates NEW database (deletes existing)
   - `fix_existing_db.sql` - Updates EXISTING database (safe)
   - `seed_data.sql` - Adds sample data (can run multiple times)

3. **Foreign Key Checks:**
   - Scripts temporarily disable FK checks with `SET FOREIGN_KEY_CHECKS = 0`
   - Re-enabled at end with `SET FOREIGN_KEY_CHECKS = 1`
   - Safe for loading data in any order

4. **ON DUPLICATE KEY:**
   - Seed data uses `ON DUPLICATE KEY UPDATE`
   - Safe to run multiple times
   - Updates existing records instead of erroring

## 🔍 Verification

Check if database is properly set up:

```sql
-- Show all tables
SHOW TABLES;

-- Check counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'courses', COUNT(*) FROM courses;

-- Expected: users=31, students=20, faculty=10, courses=20
```

Or use Python:
```bash
python ../setup_database.py --verify
```

## 🆘 Troubleshooting

### "Access Denied"
- Check password in `connection.py`
- Verify MySQL is running: `mysql --version`

### "Database doesn't exist"
- Run: `mysql -u root -p -e "CREATE DATABASE student_portal;"`

### "Foreign key constraint fails"
- Run: `fix_existing_db.sql`
- Check for orphaned records

### "Column doesn't exist"
- Run: `fix_existing_db.sql`
- Or recreate with: `schema.sql` + `seed_data.sql`

See full troubleshooting guide: `../DATABASE_SETUP_GUIDE.md`

## 🔄 Update History

- **v1.0** - Initial schema with basic tables
- **v1.1** - Added foreign key cascades
- **v1.2** - Added missing columns (email, fee_balance, etc.)
- **v1.3** - Added comprehensive seed data
- **v1.4** - Added fix script for existing databases
- **v1.5** - Added Python setup script

---

**Last Updated:** December 2024  
**Maintainer:** Database Team  
**Status:** ✅ Production Ready
