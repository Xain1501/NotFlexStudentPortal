import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

// Student Pages
import { StudentDashboard } from "./pages/Student/Dashboard";
import { StudentCourses } from "./pages/Student/Courses";
import { StudentMarks } from "./pages/Student/Marks";
import { StudentAttendance } from "./pages/Student/Attendance";
import { StudentFees } from "./pages/Student/Fees";
import { StudentTranscript } from "./pages/Student/Transcript";

// Faculty Pages
import { FacultyDashboard } from "./pages/Faculty/Dashboard";
import { FacultyAttendance } from "./pages/Faculty/Attendance";
import { FacultyGrades } from "./pages/Faculty/Grades";
import { FacultyAnnouncements } from "./pages/Faculty/Announcements";
import { FacultyLeaves } from "./pages/Faculty/Leaves";

// Admin Pages
import { AdminDashboard } from "./pages/Admin/Dashboard";
import { AdminStudents } from "./pages/Admin/Students";
import { AdminFaculty } from "./pages/Admin/Faculty";
import { AdminCourses } from "./pages/Admin/Courses";
import { AdminFees } from "./pages/Admin/Fees";
import { AdminLeaves } from "./pages/Admin/Leaves";
import { AdminAnnouncements } from "./pages/Admin/Announcements";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-dark">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <>
                    <Navbar />
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="courses" element={<StudentCourses />} />
                      <Route path="marks" element={<StudentMarks />} />
                      <Route
                        path="attendance"
                        element={<StudentAttendance />}
                      />
                      <Route path="fees" element={<StudentFees />} />
                      <Route
                        path="transcript"
                        element={<StudentTranscript />}
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/student/dashboard" replace />}
                      />
                    </Routes>
                  </>
                </ProtectedRoute>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="/faculty/*"
              element={
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <>
                    <Navbar />
                    <Routes>
                      <Route path="dashboard" element={<FacultyDashboard />} />
                      <Route
                        path="attendance"
                        element={<FacultyAttendance />}
                      />
                      <Route path="grades" element={<FacultyGrades />} />
                      <Route
                        path="announcements"
                        element={<FacultyAnnouncements />}
                      />
                      <Route path="leaves" element={<FacultyLeaves />} />
                      <Route
                        path="*"
                        element={<Navigate to="/faculty/dashboard" replace />}
                      />
                    </Routes>
                  </>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <>
                    <Navbar />
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="students" element={<AdminStudents />} />
                      <Route path="faculty" element={<AdminFaculty />} />
                      <Route path="fees" element={<AdminFees />} />
                      <Route path="leaves" element={<AdminLeaves />} />
                      <Route
                        path="announcements"
                        element={<AdminAnnouncements />}
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/admin/dashboard" replace />}
                      />
                    </Routes>
                  </>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
