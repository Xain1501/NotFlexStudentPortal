import { Routes, Route } from "react-router-dom";
import "./App.css";

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

// Layouts
import StudentLayout from "./Layout/StudentLayout.jsx";
import FacultyLayout from "./Layout/FacultyLayout.jsx";

export default function App() {
  return (
    <Routes>
      {/* Student area under StudentLayout */}
      <Route path="/" element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="transcript" element={<Transcript />} />
        <Route path="marks" element={<StudentMarks />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="fee" element={<FeeDetail />} />
        <Route path="courses" element={<CourseRegistration />} />
      </Route>

      {/* Faculty area under FacultyLayout (separate navbar/layout) */}
      <Route path="faculty" element={<FacultyLayout />}>
        <Route index element={<TeacherHome />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="marks" element={<UpdateMarks />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* 404 fallback */}
      <Route path="*" element={<div className="text-center py-5">Page not found</div>} />
    </Routes>
  );
}