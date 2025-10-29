import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/timetable.css";

/*
  TimetablePage
  - Left: enrolled courses list (select a course - optional)
  - Right: full-week timetable (Course, Day, Time, Room)
  - The "week" here is displayed as a scrollable table list; you can replace with grid/week-view later.
*/

export default function TimetablePage() {
  const [courses] = useState([
    { code: "CS301", name: "Data Structures" },
    { code: "CS302", name: "Operating Systems" },
    { code: "CS303", name: "Databases" },
  ]);

  const [timetable] = useState([
    { course: "CS301", name: "Data Structures", day: "Monday", time: "09:00 - 10:30", room: "B101" },
    { course: "CS302", name: "Operating Systems", day: "Monday", time: "11:00 - 12:30", room: "B205" },
    { course: "CS303", name: "Databases", day: "Tuesday", time: "09:00 - 10:30", room: "C110" },
    { course: "CS301", name: "Data Structures", day: "Wednesday", time: "14:00 - 15:30", room: "B101" },
    { course: "CS302", name: "Operating Systems", day: "Thursday", time: "10:00 - 11:30", room: "B205" },
    { course: "CS303", name: "Databases", day: "Friday", time: "13:00 - 14:30", room: "C110" },
    // ... add more slots for whole week
  ]);

  const [selected, setSelected] = useState(null);

  // optionally filter by selected course
  const visible = selected ? timetable.filter((t) => t.course === selected) : timetable;

  return (
    <div className="timetable-page my-4">

    <div className="timetable-header">
        <h1 className="timetable-title text-center">Timetable</h1>

      <div className="row gap-3 mt-4">
        {/* Left - Courses list */}
        <div className="col-12 col-md-4">
          <div className="dashboard-card">
            <h5 className="card-title">Enrolled Courses</h5>

            <ul className="list-unstyled courses-list">
              <li
                className={`course-item ${selected === null ? "active" : ""}`}
                onClick={() => setSelected(null)}
              >
                <div className="course-code">All</div>
                <div className="course-name">Full Week</div>
              </li>

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

        {/* Right - Timetable */}
        <div className="col-12 col-md-7">
          <div className="dashboard-card">
            <h5 className="card-title">{selected ? `${selected} — Timetable` : "Weekly Timetable"}</h5>

            <div className="table-responsive">
              <table className="table timetable-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Course Name</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">No timetable entries.</td>
                    </tr>
                  ) : (
                    visible.map((s, i) => (
                      <tr key={i}>
                        <td>{s.course}</td>
                        <td>{s.name}</td>
                        <td>{s.day}</td>
                        <td>{s.time}</td>
                        <td>{s.room}</td>
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