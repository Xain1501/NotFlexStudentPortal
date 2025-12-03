# Student Portal - Complete Setup Guide

This guide will help you set up and run both the backend (Flask/Python) and frontend (React) applications.

## 📋 Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** and npm installed
- **MySQL 8.0+** installed and running
- **Git** (optional, for version control)

## 🚀 Quick Start

### 1. Backend Setup

#### Step 1: Navigate to Backend
```powershell
cd "Backend 1"
```

#### Step 2: Create Virtual Environment
```powershell
python -m venv venv
```

#### Step 3: Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Step 4: Install Dependencies
```powershell
pip install -r requirements.txt
```

#### Step 5: Configure Environment Variables
1. Copy the example env file:
```powershell
Copy-Item app\.env.example app\.env
```

2. Edit `app\.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=student_portal
DB_USER=root
DB_PASSWORD=your_mysql_password
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

#### Step 6: Setup Database
1. Create the database in MySQL:
```sql
CREATE DATABASE student_portal;
```

2. Run the schema setup:
```powershell
cd app\database
python -c "from connection import init_database; init_database()"
```

#### Step 7: Seed Database (Optional)
```powershell
cd ..\..\tools
python seed_db.py
```

This creates demo accounts:
- Admin: `admin` / `adminpass`
- Student: `student` / `studentpass`  
- Faculty: `faculty` / `facultypass`

#### Step 8: Start Backend Server
```powershell
cd ..
python main.py
```

The backend will run on `http://localhost:5000`

---

### 2. Frontend Setup

#### Step 1: Navigate to Frontend (New Terminal)
```powershell
cd frontend
```

#### Step 2: Install Dependencies
```powershell
npm install
```

#### Step 3: Configure Environment (Optional)
Create `.env` file if you need to customize:
```
VITE_API_BASE_URL=http://localhost:5000
```

#### Step 4: Start Development Server
```powershell
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 🎯 Accessing the Application

1. Open your browser and go to: `http://localhost:5173`
2. You'll see the login page
3. Use demo credentials to login:
   - **Student**: username: `student`, password: `studentpass`
   - **Faculty**: username: `faculty`, password: `facultypass`
   - **Admin**: username: `admin`, password: `adminpass`

---

## 📱 Features by Role

### Student Portal
- ✅ Dashboard with enrolled courses and announcements
- ✅ Course enrollment/unenrollment
- ✅ View marks and grades
- ✅ Check attendance records
- ✅ View fee details
- ✅ Academic transcript with CGPA

### Faculty Portal
- ✅ Dashboard with teaching courses
- ✅ View assigned students
- ✅ Mark attendance
- ✅ Upload grades
- ✅ Create announcements
- ✅ Apply for leave

### Admin Portal
- ✅ System dashboard with statistics
- ✅ Manage students and faculty
- ✅ Course management
- ✅ Fee management
- ✅ Leave approval
- ✅ Announcements

---

## 🔧 Troubleshooting

### Backend Issues

**Problem: Module not found**
```powershell
pip install -r requirements.txt
```

**Problem: Database connection error**
- Check MySQL is running
- Verify credentials in `app\.env`
- Ensure database exists: `CREATE DATABASE student_portal;`

**Problem: Port 5000 already in use**
- Change port in `main.py`: `app.run(port=5001)`
- Update frontend proxy in `vite.config.js`

### Frontend Issues

**Problem: npm install fails**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Try `npm install --legacy-peer-deps`

**Problem: API calls fail**
- Check backend is running on port 5000
- Verify proxy settings in `vite.config.js`
- Check browser console for CORS errors

**Problem: Build fails**
- Clear cache: `npm run build --force`
- Update Node.js to latest LTS version

---

## 🏗️ Project Structure

```
NotFlexStudentPortal/
├── Backend 1/              # Flask backend
│   ├── app/
│   │   ├── database/       # Database connections and schemas
│   │   └── website/        # API routes and models
│   ├── tests/              # Unit and integration tests
│   ├── tools/              # Utility scripts
│   └── main.py             # Entry point
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── context/        # Auth context
    │   ├── pages/          # Page components
    │   │   ├── Student/
    │   │   ├── Faculty/
    │   │   └── Admin/
    │   └── services/       # API integration
    └── package.json
```

---

## 📦 Available Scripts

### Backend
```powershell
python main.py              # Start server
python -m pytest            # Run tests
python tools/seed_db.py     # Seed database
```

### Frontend
```powershell
npm run dev                 # Development server
npm run build               # Production build
npm run preview             # Preview build
npm run lint                # Run linter
```

---

## 🔐 Security Notes

1. **Change default secrets** in `app\.env`:
   - Generate strong `SECRET_KEY` and `JWT_SECRET`
   - Use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

2. **Database security**:
   - Use strong MySQL root password
   - Create dedicated DB user with limited privileges

3. **Production deployment**:
   - Enable HTTPS
   - Use environment variables for secrets
   - Configure CORS properly
   - Use production database

---

## 📚 API Documentation

API base URL: `http://localhost:5000/api`

### Authentication Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Student Endpoints
- `GET /api/student/dashboard` - Dashboard data
- `GET /api/student/transcript` - Transcript
- `GET /api/student/marks` - Marks
- `GET /api/student/attendance` - Attendance
- `GET /api/student/fees` - Fee details
- `GET /api/student/courses/enrolled` - Enrolled courses
- `POST /api/student/courses/enroll` - Enroll in course
- `POST /api/student/courses/unenroll` - Unenroll from course

### Faculty Endpoints
- `GET /api/faculty/dashboard` - Dashboard data
- `GET /api/faculty/courses/<id>/students` - Course students
- `POST /api/faculty/attendance/mark` - Mark attendance
- `POST /api/faculty/marks/upload` - Upload marks
- `POST /api/faculty/leave/apply` - Apply for leave

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/students` - All students
- `GET /api/admin/faculty` - All faculty
- `POST /api/admin/courses` - Create course
- `POST /api/admin/fees` - Add fee record
- `GET /api/admin/leaves/pending` - Pending leaves
- `POST /api/admin/leave/<id>/approve` - Approve leave

All protected endpoints require `Authorization: Bearer <token>` header.

---

## 🐛 Known Issues

1. **CSS @tailwind errors**: These are false positives from the linter. Tailwind CSS will process them correctly.

2. **Dark mode**: Currently works but requires manual toggle implementation in UI.

3. **Password hashing**: Demo uses plain text passwords. Implement bcrypt for production.

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📝 License

This project is for educational purposes.

---

## 💡 Tips

1. **Keep both terminals open** - one for backend, one for frontend
2. **Check logs** - Backend logs in terminal, frontend in browser console
3. **Use browser DevTools** - Network tab to debug API calls
4. **Database GUI** - Use MySQL Workbench or phpMyAdmin for easier DB management

---

## 🆘 Getting Help

- Check console logs for errors
- Verify all services are running
- Review API responses in Network tab
- Check database for data issues
- Refer to `Backend 1/app/FRONTEND_INTEGRATION.md` for API details

---

**Happy Coding! 🚀**
