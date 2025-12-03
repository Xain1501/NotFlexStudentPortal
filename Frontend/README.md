# Student Portal Frontend

React-based frontend for the Student Portal application.

## Features

- **Student Portal**
  - Dashboard with course overview and announcements
  - Course enrollment and management
  - View marks and grades
  - Check attendance records
  - View fee details and payment history
  - Access academic transcript with CGPA

- **Faculty Portal**
  - Dashboard with teaching courses
  - View assigned courses and students
  - Mark attendance
  - Upload grades
  - Manage announcements

- **Admin Portal**
  - System dashboard with statistics
  - Manage students and faculty
  - Course management
  - Fee management
  - Leave approval system

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```powershell
npm run build
```

## Configuration

The frontend is configured to proxy API requests to `http://localhost:5000`. Make sure your backend server is running on port 5000.

To change the API URL, update the proxy configuration in `vite.config.js` or set the `VITE_API_BASE_URL` environment variable.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React context (Auth)
│   ├── pages/           # Page components
│   │   ├── Student/     # Student portal pages
│   │   ├── Faculty/     # Faculty portal pages
│   │   └── Admin/       # Admin portal pages
│   ├── services/        # API services
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Dependencies
```

## Demo Credentials

- **Student**: username: `student` / password: `studentpass`
- **Faculty**: username: `faculty` / password: `facultypass`
- **Admin**: username: `admin` / password: `adminpass`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

All API calls are centralized in `src/services/api.js`. The application uses JWT tokens for authentication, which are stored in localStorage and automatically attached to requests.

## Features Implemented

### Student Features
- ✅ Dashboard with enrolled courses
- ✅ Course enrollment/unenrollment
- ✅ View detailed marks
- ✅ Attendance tracking
- ✅ Fee details with payment history
- ✅ Academic transcript with CGPA

### Faculty Features
- ✅ Dashboard with teaching courses
- ✅ View course details
- ✅ Announcements display

### Admin Features
- ✅ Dashboard with system statistics
- ✅ Quick action buttons for management

### Shared Features
- ✅ Authentication with JWT
- ✅ Protected routes
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Loading states
- ✅ Error handling

## Future Enhancements

- Faculty attendance marking interface
- Faculty grade upload interface
- Admin student/faculty management pages
- Admin course management interface
- Admin fee management
- Leave approval system
- Announcement creation
- Profile management
- Notification system
- Search and filter capabilities
- Export functionality (PDF/CSV)
- Charts and analytics
