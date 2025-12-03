# 🚀 QUICK START COMMANDS

## For You (Database Already Exists)

Run this command to fix your existing database without losing data:

```powershell
cd "Backend 1"
python app/setup_database.py --fix
```

**OR** using MySQL directly:

```powershell
mysql -u root -p -P 3307 student_portal < "app/database/fix_existing_db.sql"
```

---

## For GitHub Users (Fresh Setup)

Anyone cloning from GitHub should run:

```powershell
# 1. Navigate to backend
cd "Backend 1"

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup database (interactive mode)
python app/setup_database.py

# Choose option 1 for fresh install
```

**OR** automatic fresh install:

```powershell
cd "Backend 1"
python app/setup_database.py --fresh
```

---

## What Each Script Does

### ✅ `setup_database.py` (Python Script)
**Recommended - Easy to use!**

```powershell
# Interactive mode (shows menu)
python app/setup_database.py

# Specific actions
python app/setup_database.py --fresh    # New database + seed data
python app/setup_database.py --fix      # Fix existing database
python app/setup_database.py --seed     # Load sample data only
python app/setup_database.py --verify   # Check database status
```

### 📝 SQL Files (Direct MySQL)

1. **`schema.sql`** - Create fresh database structure
   ```powershell
   mysql -u root -p -P 3307 student_portal < "app/database/schema.sql"
   ```

2. **`seed_data.sql`** - Add 20 students, 10 faculty, 20 courses
   ```powershell
   mysql -u root -p -P 3307 student_portal < "app/database/seed_data.sql"
   ```

3. **`fix_existing_db.sql`** - Fix problems without deleting data
   ```powershell
   mysql -u root -p -P 3307 student_portal < "app/database/fix_existing_db.sql"
   ```

---

## 🎯 What Was Fixed

### Database Issues Resolved:
1. ✅ **Foreign Key Problems** - Added proper CASCADE options
2. ✅ **Missing Columns** - Added email, fee_balance, hire_date, etc.
3. ✅ **Data Integrity** - Fixed NULL values, calculated fees
4. ✅ **Relationships** - Fixed all table relationships

### Sample Data Added (seed_data.sql):
- 🏫 **5 Departments** (CS, EE, ME, BBA, Math)
- 📚 **20 Courses** with proper fee structure
- 👨‍🏫 **10 Faculty Members** across departments
- 👨‍🎓 **20 Students** (different semesters)
- 📖 **17 Course Sections** (Fall 2024)
- ✅ **41+ Enrollments** with realistic distribution
- 📊 **14 Marks Records** with grades
- 📅 **1000+ Attendance Records** (last 30 days)
- 💰 **Fee Records** with paid/pending/overdue statuses
- 📢 **15+ Announcements** (admin & faculty)
- 📝 **Transcript Entries** for senior students

---

## 🔑 Default Login Credentials

After running setup, you can login with:

### Admin
- Username: `admin`
- Password: `password123`

### Faculty (pick any)
- `24f-001` (John Smith - CS)
- `24f-002` (Michael Brown - EE)
- `24f-003` (David Wilson - ME)
- `24f-004` (James Garcia - BBA)
- `24f-005` (Robert Miller - Math)
- Password: `password123`

### Students (pick any)
- `24k-001` (Alice Anderson - CS, Semester 1)
- `24k-002` (Bob Baker - CS, Semester 1)
- `23k-001` (Frank Foster - CS, Semester 3)
- `22k-001` (Kelly King - CS, Semester 5)
- Password: `password123`

---

## 📋 Verification Commands

Check if everything worked:

```powershell
# Verify using Python
cd "Backend 1"
python app/setup_database.py --verify

# OR verify using MySQL
mysql -u root -p -P 3307 -e "USE student_portal; 
  SELECT 'Users' as t, COUNT(*) as count FROM users
  UNION ALL SELECT 'Students', COUNT(*) FROM students
  UNION ALL SELECT 'Faculty', COUNT(*) FROM faculty
  UNION ALL SELECT 'Courses', COUNT(*) FROM courses;"
```

**Expected Counts:**
- Users: 31
- Students: 20
- Faculty: 10
- Courses: 20

---

## 💡 Pro Tips

1. **Always backup first** (if you have important data):
   ```powershell
   mysqldump -u root -p -P 3307 student_portal > backup.sql
   ```

2. **Use Python script** - It's easier than running SQL directly

3. **Check DATABASE_SETUP_GUIDE.md** - Full documentation with troubleshooting

4. **Environment Variables** - Set DB credentials as env vars instead of hardcoding:
   ```powershell
   $env:DB_HOST="localhost"
   $env:DB_PASSWORD="your_password"
   ```

---

## 🆘 Still Having Issues?

1. Check MySQL is running: `mysql --version`
2. Verify port (3306 or 3307): Update in `connection.py`
3. Test connection: `mysql -u root -p -P 3307`
4. Read full guide: `DATABASE_SETUP_GUIDE.md`

---

## 📁 File Structure

```
Backend 1/
  ├── app/
  │   ├── database/
  │   │   ├── schema.sql           # ✅ Fixed schema
  │   │   ├── seed_data.sql        # ✅ New! Comprehensive data
  │   │   ├── fix_existing_db.sql  # ✅ New! Repair script
  │   │   └── connection.py
  │   └── setup_database.py        # ✅ New! Easy setup tool
  ├── DATABASE_SETUP_GUIDE.md      # ✅ New! Full documentation
  └── QUICK_START.md               # ✅ This file
```

---

**Last Updated:** December 2024
**Your Action:** Run `python app/setup_database.py --fix` to update your database!
