import { Routes, Route } from "react-router-dom";
import "./App.css";

// Student pages
import Login from "./Pages/Student/login.jsx";
import StudentHome from "./Pages/Student/studentlogin.jsx";
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
// NOTE: removed the stray import that didn't assign a component:
// import "./Pages/Faculty/timetable.jsx";
// Re-using the student Timetable component for faculty routes (or create a FacultyTimetable component if needed)

// Admin pages
import AdminHome from "./Pages/Admin/adminhome.jsx";
import FacultyAttendance from "./Pages/Admin/facultyattendance.jsx";
import ApproveLeave from "./Pages/Admin/leave.jsx";
// Fixed file name: coursemanagement (was 'coursemangement' typo)
import CourseManagement from "./Pages/Admin/coursemangement.jsx";
import FeeStructure from "./Pages/Admin/feemanagement.jsx";
import ManageStudent from "./Pages/Admin/managestudent.jsx";
import ManageFaculty from "./Pages/Admin/managefaculty.jsx";

// If you have admin pages for student marks or admin timetable, import them here.
// import StudentMarksAdmin from "./Pages/Admin/studentmarks.jsx";
// import TimetableAdmin from "./Pages/Admin/timetable.jsx";

// Layouts
import StudentLayout from "./Layout/studentlayout.jsx";
import FacultyLayout from "./Layout/facultylayout.jsx";
import AdminLayout from "./Layout/adminlayout.jsx";

export default function App() {
  return (
    <Routes>
      {/* Student area under StudentLayout */}
      <Route path="/" element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="/student/transcript" element={<Transcript />} />
        <Route path="/student/marks" element={<StudentMarks />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/timetable" element={<Timetable />} />
        <Route path="/student/feedetail" element={<FeeDetail />} />
        <Route path="/student/courseregistration" element={<CourseRegistration />} />
      </Route>

      {/* Faculty area under FacultyLayout */}
      <Route path="faculty" element={<FacultyLayout />}>
        <Route index element={<TeacherHome />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="marks" element={<UpdateMarks />} />
        <Route path="timetable" element={<Timetable />} />
      </Route>

      {/* Admin area under AdminLayout */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="facultyattendance" element={<FacultyAttendance />} />
        <Route path="approveleave" element={<ApproveLeave />} />
        <Route path="coursemanagement" element={<CourseManagement />} />
        <Route path="feestructure" element={<FeeStructure />} />
        <Route path="managestudent" element={<ManageStudent />} />
        <Route path="managefaculty" element={<ManageFaculty />} />
        {/* Uncomment and import these when you add the pages */}
        {/* <Route path="studentmarks" element={<StudentMarksAdmin />} /> */}
        {/* <Route path="timetable" element={<TimetableAdmin />} /> */}
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* 404 fallback */}
      <Route path="*" element={<div className="text-center py-5">Page not found</div>} />
    </Routes>
  );
}