import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/attendance.css";

/*
  AttendancePage
  - Left: enrolled courses list (select a course)
  - Right: attendance table for the selected course (Date, Status)
  - Sample data included. Replace with API data as needed.
*/

export default function AttendancePage() {
  const [courses] = useState([
    { code: "CS301", name: "Data Structures" },
    { code: "CS302", name: "Operating Systems" },
    { code: "CS303", name: "Databases" },
  ]);

  // sample attendance records mapped by course code
  const [attendanceData] = useState({
    CS301: [
      { date: "2025-10-20", status: "Present" },
      { date: "2025-10-18", status: "Absent" },
      { date: "2025-10-15", status: "Present" },
      { date: "2025-10-12", status: "Present" },
    ],
    CS302: [
      { date: "2025-10-20", status: "Present" },
      { date: "2025-10-18", status: "Present" },
      { date: "2025-10-15", status: "Absent" },
    ],
    CS303: [
      { date: "2025-10-19", status: "Present" },
      { date: "2025-10-16", status: "Present" },
    ],
  });

  const [selected, setSelected] = useState(courses[0].code);

  const records = attendanceData[selected] ?? [];

  return (
    <div className="attendance-page my-4">

    <div className="attendance-header">
        <h1 className="attendance-title text-center">Attendance</h1>
    <div/>

      <div className="row gap-3 mt-4">
        {/* Left - Courses list */}
        <div className="col-12 col-md-4">
          <div className="dashboard-card">
            <h5 className="card-title">Enrolled Courses</h5>

            <ul className="list-unstyled courses-list">
              {courses.map((c) => (
                <li
                  key={c.code}
                  className={`course-item ${selected === c.code ? "active" : ""}`}
                  onClick={() => setSelected(c.code)}
                >
                  <div className="course-code">{c.code}</div>
                  <div className="course-name">{c.name}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right - Attendance records */}
        <div className="col-12 col-md-7">
          <div className="dashboard-card">
            <h5 className="card-title">{selected} — Attendance</h5>

            <div className="attendance-summary mb-3">
              <div>
                Total Classes: <strong>{records.length}</strong>
              </div>
              <div>
                Present:{" "}
                <strong>{records.filter((r) => r.status === "Present").length}</strong>
              </div>
              <div>
                Absent: <strong>{records.filter((r) => r.status === "Absent").length}</strong>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center text-muted">
                        No attendance records.
                      </td>
                    </tr>
                  ) : (
                    records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td className="text-center">
                          <span
                            className={`status-badge ${
                              r.status === "Present" ? "present" : "absent"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
