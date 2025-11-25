import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./studentlogin.css";
import 'bootstrap/dist/css/bootstrap.min.css';

// Student info
const studentDetails = {
  firstname: "Madiha",
  lastname: "Aslam",
  DOB: "25-08-2005",
  contactno: "03001234567",
  CNIC: "42101-1234567-8",
  enrolleddate: "15-08-2021",
  department: "Computer Science",
  currentsemester: "3rd semester",
  status: "Active",
};

// Courses info: 3-credit hour, 48 classes, 9 absences allowed
const enrolledCourses = [
  { code: "CS301", name: "Data Structures", absentClasses: 3, totalClasses: 48, allowedAbsences: 9 },
  { code: "CS302", name: "Operating Systems", absentClasses: 2, totalClasses: 48, allowedAbsences: 9 },
  { code: "CS303", name: "Databases", absentClasses: 5, totalClasses: 48, allowedAbsences: 9 },
];

const ANNOUNCEMENTS_KEY = "globalAnnouncements";
function loadGlobalAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export default function StudentHome() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const studentCourseCodes = new Set(enrolledCourses.map(c => c.code));
    function loadAndFilter() {
      const all = loadGlobalAnnouncements();
      const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000; // last 2 days
      const filtered = all.filter(a =>
        ((a.target && a.target === "students") ||
          (a.courseCode && studentCourseCodes.has(a.courseCode))
        ) && new Date(a.createdAt).getTime() >= cutoff
      );
      setAnnouncements(filtered);
    }
    loadAndFilter();

    function onStorage(e) {
      if (e.key === ANNOUNCEMENTS_KEY) loadAndFilter();
    }
    function onLocalUpdate() { loadAndFilter(); }

    window.addEventListener("storage", onStorage);
    window.addEventListener("globalAnnouncementsUpdated", onLocalUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("globalAnnouncementsUpdated", onLocalUpdate);
    };
  }, []);

  return (
    <div className="student-page">
      <div className="container d-flex flex-column align-items-center">
        <h1 className="dashboard-title text-center mb-4">Home</h1>
        {/* Top row with 2 cards, equal height, headings centered, content left */}
        <div className="row w-100 justify-content-center mb-4">
          <div className="col-md-5 d-flex mb-3">
            <section className="card-custom h-100 w-100">
              <h5 className="card-title accent text-center">Student Details</h5>
              <div className="card-content text-left mt-3">
                <p><strong>First Name:</strong> {studentDetails.firstname}</p>
                <p><strong>Last Name:</strong> {studentDetails.lastname}</p>
                <p><strong>DOB:</strong> {studentDetails.DOB}</p>
                <p><strong>Contact No:</strong> {studentDetails.contactno}</p>
                <p><strong>CNIC NO:</strong> {studentDetails.CNIC}</p>
                <p><strong>Enrollment Date:</strong> {studentDetails.enrolleddate}</p>
                <p><strong>Department:</strong> {studentDetails.department}</p>
                <p><strong>Current Semester:</strong> {studentDetails.currentsemester}</p>
                <p><strong>Status:</strong> {studentDetails.status}</p>
              </div>
            </section>
          </div>
          <div className="col-md-5 d-flex mb-3">
            <section className="card-custom h-100 w-100">
              <h5 className="card-title accent text-center">Announcements</h5>
              <div className="card-content text-left mt-3">
                {announcements.length ? (
                  <div className="announcement-list">
                    {announcements.map((a, i) => (
                      <div key={i} className="announcement-item">
                        <div className="announcement-meta">
                          {a.courseCode ? `${a.courseCode}${a.section ? ` - ${a.section}` : ''}` : ``}
                          {a.author ? ` — ${a.author}` : ''}
                        </div>
                        <div className="announcement-text">{a.text}</div>
                        <div className="announcement-date">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="announcement-empty">No announcements for your courses.</div>
                )}
              </div>
            </section>
          </div>
        </div>
        {/* Enrolled Courses Box: wide and centered below */}
        <div className="row w-100 justify-content-center mb-3">
          <div className="col-md-10 mb-3">
            <section className="card-custom">
              <h3 className="card-title accent text-center">Enrolled Courses</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Name</th>
                      <th>Attendance Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledCourses.map((course) => {
                      const attendanceLeft = course.allowedAbsences - course.absentClasses;
                      return (
                        <tr key={course.code}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>
                            <button className="gradient-btn">
                              {attendanceLeft} <span style={{ fontSize: 12 }}>of {course.allowedAbsences} allowed</span>
                            </button>
                            <br />
                            {attendanceLeft <= 0 && (
                              <span style={{color:"red", fontSize:12}}>
                                Minimum required attendance reached!
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
        <div className="student-content mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}