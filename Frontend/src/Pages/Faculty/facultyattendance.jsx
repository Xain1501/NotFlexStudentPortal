import React, { useEffect, useMemo, useState } from "react";
import "./attendance.css";

/*
  FacultyAttendanceView
  - Shows attendance records for the currently logged-in faculty (or a demo faculty if none).
  - Reads admin-marked faculty attendance from localStorage (FAC_ATT_KEY).
  - Left: list of courses the faculty teaches.
  - Right: selected course attendance with totals and a table (Date, Session, Status).
  - Listens for "storage" and "faculty_attendance_updated" events so UI updates in realtime.
*/

const FAC_ATT_KEY = "faculty_attendance";

// demo teacher loader (replace with your real getTeacher / auth)
async function getTeacherDemo() {
  return {
    id: "T1",
    name: "Prof X",
    courses: [
      { id: "CS301", code: "CS301", name: "Data Structures", section: "A" },
      { id: "CS302", code: "CS302", name: "Operating Systems", section: "B" },
    ],
  };
}

function loadFacultyAttendance() {
  try {
    const raw = localStorage.getItem(FAC_ATT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadFacultyAttendance error:", e);
    return [];
  }
}

export default function FacultyAttendanceView({ currentFacultyId /* optional: provide from auth/context */ }) {
  const [teacher, setTeacher] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [onlyAbsent, setOnlyAbsent] = useState(false);

  useEffect(() => {
    (async () => {
      const t = typeof window.getTeacher === "function"
        ? await window.getTeacher()
        : await getTeacherDemo();

      // If caller passed currentFacultyId it should match teacher.id from auth.
      if (currentFacultyId && String(currentFacultyId) !== String(t.id)) {
        // If different, prefer the provided id but still use demo teacher for courses if available.
        setTeacher({ ...t, id: currentFacultyId });
      } else {
        setTeacher(t);
      }

      setRecords(loadFacultyAttendance());
      // default select first course if available
      const first = (t.courses && t.courses.length) ? (t.courses[0].id || t.courses[0].code) : "";
      setSelectedCourseId(first);
    })();

    const onUpdated = () => setRecords(loadFacultyAttendance());
    window.addEventListener("storage", onUpdated);
    window.addEventListener("faculty_attendance_updated", onUpdated);
    return () => {
      window.removeEventListener("storage", onUpdated);
      window.removeEventListener("faculty_attendance_updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFacultyId]);

  const myRecords = useMemo(() => {
    if (!teacher) return [];
    return (records || []).filter(r => String(r.facultyId) === String(teacher.id));
  }, [records, teacher]);

  // group records by courseId for quick lookup
  const byCourse = useMemo(() => {
    const map = {};
    myRecords.forEach(r => {
      const key = r.courseId || "unknown";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    // sort each course records by date desc
    Object.keys(map).forEach(k => {
      map[k].sort((a,b) => b.date.localeCompare(a.date));
    });
    return map;
  }, [myRecords]);

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  const courseList = (teacher.courses || []).map(c => ({
    id: c.id || c.code,
    code: c.code || c.id,
    name: c.name || "",
    section: c.section || ""
  }));

  const selectedRecords = (byCourse[selectedCourseId] || []).filter(r => onlyAbsent ? r.status === "Absent" : true);

  const totals = selectedRecords.reduce((acc, r) => {
    if (r.status === "Present") acc.present++;
    else if (r.status === "Absent") acc.absent++;
    else acc.other++;
    acc.total++;
    return acc;
  }, { total: 0, present: 0, absent: 0, other: 0 });

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">My Attendance</h2>

      <div className="card">
        <div className="card-body">
          <div className="row gx-3">
            {/* left: courses */}
            <div className="col-md-4">
              <h5 className="mb-3">My Courses</h5>
              <div className="list-group">
                {courseList.length === 0 && <div className="text-muted p-3">No assigned courses</div>}
                {courseList.map(c => (
                  <button
                    key={c.id}
                    className={`list-group-item list-group-item-action ${selectedCourseId === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedCourseId(c.id)}
                  >
                    <div><strong>{c.code}</strong></div>
                    <div className="text-muted small">{c.name} {c.section ? `(Sec ${c.section})` : ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* right: attendance details */}
            <div className="col-md-8">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5>{selectedCourseId ? `${selectedCourseId} — Attendance` : "Select a course"}</h5>
                <div className="form-check">
                  <input id="onlyAbsent" className="form-check-input" type="checkbox" checked={onlyAbsent} onChange={e => setOnlyAbsent(e.target.checked)} />
                  <label className="form-check-label" htmlFor="onlyAbsent">Show only absences</label>
                </div>
              </div>

              {selectedCourseId ? (
                <>
                  <div className="mb-2 small text-muted">
                    Total: {totals.total} &nbsp; • &nbsp; Present: {totals.present} &nbsp; • &nbsp; Absent: {totals.absent}
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th style={{width: '35%'}}>Date</th>
                          <th style={{width: '20%'}}>Session</th>
                          <th style={{width: '15%'}}>Status</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecords.length === 0 ? (
                          <tr><td colSpan="4" className="text-center text-muted">No records.</td></tr>
                        ) : selectedRecords.map((r, i) => (
                          <tr key={i}>
                            <td>{r.date}</td>
                            <td>{r.session}</td>
                            <td>
                              <span className={`status-badge ${r.status === "Present" ? "present" : (r.status === "Absent" ? "absent" : "")}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>{r.note || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-muted">Choose one of your courses to view attendance marked by admin.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}