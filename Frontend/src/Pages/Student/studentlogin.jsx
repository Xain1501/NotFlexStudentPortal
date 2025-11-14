import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "../Student/studentlogin.css";
import 'bootstrap/dist/css/bootstrap.min.css';

const studentDetails = {
  name: "Madiha Aslam",
  rollNo: "23k-0846",
  department: "Computer Science",
  year: "3rd Year",
  DOB: "25-08-2005",
  CNIC: "42101-1234567-8",
  contactno: "03001234567",
};

const PersonalDetails = {
  FatherName: "Muhammad Aslam",
  MotherName: "Deeba Aslam",
  Address: "123 Main St, Karachi",
  parent_contactno: "03001234567",
  email: "madiha.aslam@example.com",
  Nationality: "Pakistani",
};

const enrolledCourses = [
  { code: "CS301", name: "Data Structures", attendanceLeft: 3 },
  { code: "CS302", name: "Operating Systems", attendanceLeft: 2 },
  { code: "CS303", name: "Databases", attendanceLeft: 5 },
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
      // show only announcements for student's courses OR admin announcements targeting students
      // and only those within the last 2 days
      const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const filtered = all.filter(a =>
        ( (a.target && a.target === "students") ||
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
    <div className="student-page my-4">
      
      <div className="student-header">
        
        <h1 className="student-title text-center">Home</h1>
      </div>

      <div className="student-content">
        <Outlet />
      </div>

      {/* Current Page Content */}

      <div className="container mt-4">
        <div className="row gx-4 gy-3 align-items-stretch">
          <div className="col-md-4 d-flex">
            <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
              <h3 className="mb-3">Student Details</h3>
              <p className="mb-2"><strong>Name:</strong> {studentDetails.name}</p>
              <p className="mb-2"><strong>Roll No:</strong> {studentDetails.rollNo}</p>
              <p className="mb-2"><strong>Department:</strong> {studentDetails.department}</p>
              <p className="mb-2"><strong>Year:</strong> {studentDetails.year}</p>
              <p className="mb-2"><strong>CNIC NO:</strong> {studentDetails.CNIC}</p>
              <p className="mb-2"><strong>DOB:</strong> {studentDetails.DOB}</p>
              <p className="mb-2"><strong>Contact No:</strong> {studentDetails.contactno}</p>
            </section>
          </div>


          <div className="col-md-4 d-flex">
            {/* Personal Details */}
            <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
              <h3 className="mb-3">Personal Details</h3>
              <p className="mb-2"><strong>Father Name:</strong> {PersonalDetails.FatherName}</p>
              <p className="mb-2"><strong>Mother Name:</strong> {PersonalDetails.MotherName}</p>
              <p className="mb-2"><strong>Address:</strong> {PersonalDetails.Address}</p>
              <p className="mb-2"><strong>Parent Contact No:</strong> {PersonalDetails.parent_contactno}</p>
              <p className="mb-2"><strong>Email:</strong> {PersonalDetails.email}</p>
              <p className="mb-2"><strong>Nationality:</strong> {PersonalDetails.Nationality}</p>
            </section>
          
          </div>


          <div className="col-md-4 d-flex">
            {/* Announcements */}
            <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
              <h3 className="mb-3">Announcements</h3>

              <div style={{ width: "100%", textAlign: "left" }}>
                {announcements.length ? (
                  <div className="announcement-list">
                    {announcements.map((a, i) => (
                      <div key={i} style={{ marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #eee" }}>
                        <div style={{ fontWeight: 700 }}>
                          {a.courseCode ? `${a.courseCode}${a.section ? ` - ${a.section}` : ''}` : ``} {a.author ? ` — ${a.author}` : ''}
                        </div>
                        <div style={{ fontSize: 14, marginTop: 6 }}>{a.text}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontStyle: "italic" }}>No announcements for your courses.</div>
                )}
              </div>
            </section>

          </div>
        </div>

        <div className="student-content mt-4">
          {/* Home Page Details */}
          
          <section className="courses-card d-flex flex-column h-100 p-4 text-center">
            
            <h3>Enrolled Courses</h3>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Name</th>
                  <th>Attendance Left</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.map((course) => (
                  <tr key={course.code}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>
                      <button className="gradient-btn">
                        {course.attendanceLeft}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}