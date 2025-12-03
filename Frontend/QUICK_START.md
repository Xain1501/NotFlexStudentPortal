# Quick Start Guide - Expanded Frontend

## What Was Added

### 1. **Signup/Registration Page** ✅
- URL: `/register`
- Allows new users to create accounts as Student or Faculty
- Auto-redirects to login after successful registration

### 2. **Admin Module - Complete** ✅
- **Students Management** (`/admin/students`)
  - Create, edit, delete students
  - Auto-generate login credentials
  - Toggle active/inactive status
  - Search and filter functionality

- **Faculty Management** (`/admin/faculty`)
  - Create, edit, delete faculty members
  - Assign designations and departments
  - Toggle active/inactive status
  - Track teaching sections

- **Fee Management** (`/admin/fees`)
  - View all fee records
  - Filter by status (paid/pending/overdue)
  - Mark fees as paid
  - Statistics dashboard

- **Leave Management** (`/admin/leaves`)
  - View all leave applications
  - Approve or reject leaves
  - Filter pending only
  - Statistics dashboard

- **Announcements** (`/admin/announcements`)
  - Create system-wide announcements
  - Target specific audiences (all/students/faculty)
  - Delete announcements

### 3. **Faculty Module - Complete** ✅
- **Attendance Marking** (`/faculty/attendance`)
  - Select course section
  - Mark student attendance by date
  - Toggle present/absent for each student
  - Bulk submission

- **Grade Upload** (`/faculty/grades`)
  - Select course section
  - Enter marks for students (0-100)
  - Choose exam type (midterm/final/quiz/assignment)
  - Bulk upload

- **Announcements** (`/faculty/announcements`)
  - Create course-specific announcements
  - View all posted announcements
  - Delete announcements

- **Leave Applications** (`/faculty/leaves`)
  - Apply for leave
  - Select leave type and dates
  - View application status
  - Track approval/rejection

## How to Run

### First Time Setup
```powershell
# Navigate to frontend folder
cd "c:\Users\zainsaqib\Desktop\NotFlexStudentPortal\frontend"

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

### Starting the Application

1. **Start Backend** (in a separate terminal):
```powershell
cd "c:\Users\zainsaqib\Desktop\NotFlexStudentPortal\Backend 1"
python main.py
```

2. **Start Frontend**:
```powershell
cd "c:\Users\zainsaqib\Desktop\NotFlexStudentPortal\frontend"
npm run dev
```

3. **Access Application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Testing the New Features

### Test Registration
1. Go to http://localhost:5173/register
2. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Role: Student or Faculty
   - Password: password123
   - Confirm Password: password123
3. Click "Create Account"
4. Login with the new credentials

### Test Admin Features
1. Login as admin
2. Navigate to each module:
   - **Students**: Create a new student and note the auto-generated credentials
   - **Faculty**: Create a new faculty member
   - **Fees**: View fee records and mark one as paid
   - **Leaves**: View pending leaves and approve/reject one
   - **Announcements**: Create a system announcement

### Test Faculty Features
1. Login as faculty
2. Navigate to each module:
   - **Attendance**: Select a course and mark attendance for a date
   - **Grades**: Select a course and upload marks
   - **Announcements**: Create a course announcement
   - **Leaves**: Apply for a leave

## Navigation Quick Reference

### Admin Navigation Bar
- Dashboard
- Students
- Faculty
- Fees
- Leaves
- Announcements

### Faculty Navigation Bar
- Dashboard
- Attendance
- Grades
- Announcements
- Leaves

### Student Navigation Bar (unchanged)
- Dashboard
- Courses
- Marks
- Attendance
- Fees
- Transcript

## Important Notes

### Auto-Generated Credentials
When creating students or faculty through the admin panel:
- A popup will show the auto-generated username and password
- **Save these credentials immediately** - they won't be shown again
- Example: Username: `STU2024001`, Password: `abc123xyz`

### Backend Integration
All features are connected to these backend endpoints:
- Registration: `POST /api/auth/register`
- Admin CRUD: `/api/admin/students`, `/api/admin/faculty`, etc.
- Faculty Operations: `/api/faculty/attendance/mark`, `/api/faculty/marks/upload`, etc.
- Leave Management: `/api/admin/leave/:id/approve`, `/api/admin/leave/:id/reject`
- Announcements: `/api/admin/announcements`, `/api/faculty/announcements`

### Search and Filter
Most management pages include:
- **Search bar**: Search by name, code, email, etc.
- **Status filters**: Filter by active/inactive, paid/pending, etc.
- **Real-time filtering**: Results update as you type

### Modals
Create/Edit operations use modal popups:
- Click outside or press ESC to close
- Cancel button to close without saving
- Form validation before submission

## Troubleshooting

### Frontend won't start
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### Backend connection errors
- Ensure backend is running on http://localhost:5000
- Check that MySQL database is running
- Verify database credentials in backend config

### Login issues with new accounts
- Registration creates a user in the database
- Use the exact username and password created
- Check backend logs for any errors

### No data showing in admin/faculty pages
- Ensure you're logged in as the correct role
- Check browser console for API errors (F12)
- Verify backend API is returning data

## File Locations

### New Pages
```
frontend/src/pages/
├── Register.jsx                    # Signup page
├── Admin/
│   ├── Students.jsx               # Student management
│   ├── Faculty.jsx                # Faculty management
│   ├── Fees.jsx                   # Fee management
│   ├── Leaves.jsx                 # Leave approvals
│   └── Announcements.jsx          # System announcements
└── Faculty/
    ├── Attendance.jsx             # Mark attendance
    ├── Grades.jsx                 # Upload grades
    ├── Announcements.jsx          # Course announcements
    └── Leaves.jsx                 # Leave applications
```

### Updated Configuration
- `App.jsx` - Added new routes
- `Navbar.jsx` - Added navigation links
- `api.js` - Added new API methods

## Next Steps

1. **Test All Features**: Go through each admin and faculty module
2. **Create Test Data**: Use admin panel to create students, faculty, fees, etc.
3. **Test Workflows**: 
   - Student enrollment flow
   - Faculty attendance marking flow
   - Leave approval workflow
   - Announcement distribution
4. **Production Build**: When ready, run `npm run build` for production

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Check backend logs for API errors
3. Review EXPANSION_COMPLETE.md for detailed feature documentation
4. Review FRONTEND_COMPLETE.md for initial setup documentation
