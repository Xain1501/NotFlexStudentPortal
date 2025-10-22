import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./components/login.jsx";
import StudentHome from "./components/studentlogin.jsx";
import Transcript from "./components/transcript.jsx";
import Marks from "./components/marks.jsx";
import Attendance from "./components/attendence.jsx";
import Timetable from "./components/timetable.jsx";
import FeeDetail from "./components/feedetail.jsx";
import CourseRegistration from "./components/courseregistration.jsx";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="student" element={<StudentHome />} />
          <Route path="transcript" element={<Transcript />} />
          <Route path="marks" element={<Marks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="fee" element={<FeeDetail />} />
          <Route path="courses" element={<CourseRegistration />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
