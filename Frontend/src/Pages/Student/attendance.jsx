import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/attendance.css";
import { getAttendance, getEnrolledCourses } from "./api";

export default function AttendancePage() {
  const [studentRoll, setStudentRoll] = useState("");
  const [studentName, setStudentName] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [catalogMap, setCatalogMap] = useState(new Map());
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseRecords, setCourseRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const courses = await getEnrolledCourses();
        const arr = Array.isArray(courses) ? courses : [];
        setEnrolledCourses(arr);
        const map = new Map(arr.map((c) => [c.code || c.id || c.title, c.title || c.code || String(c.id)]));
        setCatalogMap(map);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseRecords([]);
      return;
    }
    async function loadAttendance() {
      setLoading(true);
      try {
        const records = await getAttendance();
        const courseRecords = Array.isArray(records) ? records.filter((r) => r.course === selectedCourse) : [];
        setCourseRecords(courseRecords);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [selectedCourse]);

  const displayRows = courseRecords || [];
  const enrolledCourseIds = enrolledCourses.map((c) => c.code || c.id || String(c.title));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="attendance-page my-4">
      <div className="attendance-header">
        <h1 className="attendance-title text-center">Attendance</h1>
        <div className="text-center small text-muted">Enter your Roll to view courses you are enrolled in and your attendance</div>
      </div>

      <div className="row gap-3 mt-4">
        <div className="col-12 col-md-4">
          <div className="dashboard-card p-3">
            <div className="mb-3">
              <input className="form-control mb-2" placeholder="Your Roll (e.g. S1001)" value={studentRoll} onChange={e => setStudentRoll(e.target.value)} />
              <input className="form-control" placeholder="Your Name (optional)" value={studentName} onChange={e => setStudentName(e.target.value)} />
            </div>

            <h5 className="card-title">Enrolled Courses</h5>
            <ul className="list-unstyled courses-list">
              {enrolledCourseIds.length === 0 ? (
                <li className="text-muted">No enrolled courses (enter your roll or register first)</li>
              ) : (
                enrolledCourseIds.map(code => (
                  <li
                    key={code}
                    className={`course-item ${selectedCourse === code ? "active" : ""}`}
                    onClick={() => setSelectedCourse(code)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="course-code">{code}</div>
                    <div className="course-name">{catalogMap.get(code) || code}</div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="col-12 col-md-7">
          <div className="dashboard-card p-3">
            <h5 className="card-title">{selectedCourse ? `${selectedCourse} — ${catalogMap.get(selectedCourse) || ""}` : "Select a course"}</h5>

            {!selectedCourse ? (
              <div className="text-muted">Select an enrolled course to view attendance.</div>
            ) : (
              <>
                <div className="attendance-summary mb-3 d-flex gap-3">
                  <div>Total Classes: <strong>{courseRecords.length}</strong></div>
                  <div>Present: <strong>{displayRows.filter(r => r.status === "Present").length}</strong></div>
                  <div>Absent: <strong>{displayRows.filter(r => r.status === "Absent").length}</strong></div>
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
                      {displayRows.length === 0 ? (
                        <tr><td colSpan="2" className="text-center text-muted">No attendance records.</td></tr>
                      ) : (
                        displayRows.map((r, i) => (
                          <tr key={i}>
                            <td>{r.date}</td>
                            <td className="text-center">
                              <span className={`status-badge ${r.status === "Present" ? "present" : (r.status === "Absent" ? "absent" : "")}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}