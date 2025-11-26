import React, { useEffect, useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/attendance.css";

const REG_KEY = "course_registrations";
const ATT_KEY = "attendance_records";

// small static course catalog (keeps names). You can later load from API or departments_store.
const COURSE_CATALOG = [
  { code: "CS301", name: "Data Structures" },
  { code: "CS302", name: "Operating Systems" },
  { code: "CS303", name: "Databases" },
  { code: "CS304", name: "Computer Networks" },
  { code: "CS305", name: "Software Engineering" },
];

function loadRegistrations() {
  try {
    const raw = localStorage.getItem(REG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadRegistrations error:", e);
    return [];
  }
}
function loadAttendance() {
  try {
    const raw = localStorage.getItem(ATT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadAttendance error:", e);
    return [];
  }
}

export default function AttendancePage() {
  // student identity (enter roll to view your courses/attendance)
  const [studentRoll, setStudentRoll] = useState("");
  const [studentName, setStudentName] = useState("");

  // enrolled course codes for this student (derived from registrations)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  // attendance records (all), we'll filter per selected course
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    // load attendance and registrations on mount
    setAttendanceRecords(loadAttendance());

    const refresh = () => {
      setAttendanceRecords(loadAttendance());
      // recompute enrolled courses if roll set
      if (studentRoll) {
        const regs = loadRegistrations();
        const ids = regs.filter(r => String(r.student?.roll) === String(studentRoll)).map(r => r.courseId);
        setEnrolledCourseIds(Array.from(new Set(ids)));
        if (!ids.includes(selectedCourse)) {
          setSelectedCourse(ids[0] || "");
        }
      }
    };

    // listen for updates
    window.addEventListener("storage", refresh);
    window.addEventListener("course_registrations_updated", refresh);
    window.addEventListener("attendance_updated", refresh);

    // cleanup
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("course_registrations_updated", refresh);
      window.removeEventListener("attendance_updated", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentRoll]);

  // recompute enrolled courses whenever studentRoll changes
  useEffect(() => {
    const regs = loadRegistrations();
    const ids = regs.filter(r => String(r.student?.roll) === String(studentRoll)).map(r => r.courseId);
    setEnrolledCourseIds(Array.from(new Set(ids)));
    setSelectedCourse(prev => (ids.includes(prev) ? prev : (ids[0] || "")));
  }, [studentRoll]);

  // build catalog map for names
  const catalogMap = useMemo(() => {
    const m = new Map();
    COURSE_CATALOG.forEach(c => m.set(c.code, c.name));
    return m;
  }, []);

  // records for selected course
  const courseRecords = attendanceRecords
    .filter(r => r.courseId === selectedCourse)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  // for display: map each record to student's own status
  const displayRows = courseRecords.map(rec => {
    const isPresent = (rec.present || []).some(p => String(p) === String(studentRoll));
    const isAbsent = (rec.absent || []).some(a => String(a) === String(studentRoll));
    const status = isPresent ? "Present" : (isAbsent ? "Absent" : "Not marked");
    return { ...rec, status };
  });

  return (
    <div className="attendance-page my-4">
      <div className="attendance-header">
        <h1 className="attendance-title text-center">Attendance</h1>
        <div className="text-center small text-muted">Enter your Roll to view courses you are enrolled in and your attendance</div>
      </div>

      <div className="row gap-3 mt-4">
        {/* Left - Enrolled courses */}
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

        {/* Right - Attendance for selected course */}
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