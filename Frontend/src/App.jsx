import { Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "./api/client";
import "./App.css";


// Student pages
import Login from "./Pages/Shared/login.jsx";
import StudentHome from "./Pages/Student/home.jsx";
import Transcript from "./Pages/Student/transcript.jsx";
import StudentMarks from "./Pages/Student/marks.jsx";
import StudentAttendance from "./Pages/Student/attendance.jsx";
import Timetable from "./Pages/Student/timetable.jsx";
import FeeDetail from "./Pages/Student/feedetail.jsx";
import CourseRegistration from "./Pages/Student/courseregistration.jsx";

// Faculty pages
import TeacherHome from "./Pages/Faculty/home.jsx";
import MarkAttendance from "./Pages/Faculty/attendance.jsx";
import Leave from "./Pages/Faculty/leaveapplication.jsx";
import UpdateMarks from "./Pages/Faculty/marks.jsx";
import FacultyTimetable from "./Pages/Faculty/timetable.jsx";

// Admin pages
import AdminHome from "./Pages/Admin/adminhome.jsx";
import ApproveLeave from "./Pages/Admin/leave.jsx";
import CourseManagement from "./Pages/Admin/coursemangement.jsx";
import FeeStructure from "./Pages/Admin/feemanagement.jsx";
import ManageStudent from "./Pages/Admin/managestudent.jsx";
import ManageFaculty from "./Pages/Admin/managefaculty.jsx";
import ManageDepartments from "./Pages/Admin/managedepartment.jsx";
import FacultyAttendance from "./Pages/Admin/facultyattendance.jsx";

// Layouts
import StudentLayout from "./Layout/studentlayout.jsx";
import FacultyLayout from "./Layout/facultylayout.jsx";
import AdminLayout from "./Layout/adminlayout.jsx";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    const user = getCurrentUser();
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      case "faculty":
        return <Navigate to="/faculty" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="transcript" element={<Transcript />} />
        <Route path="marks" element={<StudentMarks />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="fees" element={<FeeDetail />} />
        <Route path="course-registration" element={<CourseRegistration />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHome />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="marks" element={<UpdateMarks />} />
        <Route path="timetable" element={<FacultyTimetable />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="leaves" element={<ApproveLeave />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="fees" element={<FeeStructure />} />
        <Route path="students" element={<ManageStudent />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="departments" element={<ManageDepartments />} />
        <Route path="faculty-attendance" element={<FacultyAttendance />} />
      </Route>

      {/* Unauthorized Page */}
      <Route
        path="/unauthorized"
        element={
          <div className="text-center py-5">
            <h1>Unauthorized</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        }
      />

      {/* 404 fallback */}
      <Route
        path="*"
        element={<div className="text-center py-5">Page not found</div>}
      />
    </Routes>
  );
}
