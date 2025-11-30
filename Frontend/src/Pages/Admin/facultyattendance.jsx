import React, { useEffect, useState } from "react";
import "./adminhome.css";

// Dummy faculty list for demo
const DEMO_FACULTY = [
  { id: "F1", name: "Dr. Aisha Khan" },
  { id: "F2", name: "Mr. Ali Raza" },
  { id: "F3", name: "Ms. Fatima Sohail" },
  { id: "F4", name: "Mr. Imran Ahmed" },
  { id: "F5", name: "Dr. Shanaz Zaidi" },
  { id: "F6", name: "Mrs. Erum Akhtar" },
  { id: "F7", name: "Mr. Javed Iqbal" },
  { id: "F8", name: "Ms. Rabia Saleem" },
  { id: "F9", name: "Dr. Naveed Shah" },
  { id: "F10", name: "Mr. Sajjad Malik" },
  { id: "F11", name: "Dr. Kamran Jehangir" },
];

const PAGE_SIZE = 10;

export default function () {
  const [faculty, setFaculty] = useState(DEMO_FACULTY);
  const [presentMap, setPresentMap] = useState({});
  const [attendance_date, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [session, setSession] = useState("Morning");
  const [marked_by, setMarkedBy] = useState("");
  const [marked_at, setMarkedAt] = useState(
    new Date().toISOString().slice(0, 19)
  );
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);

  function toggle(id) {
    setPresentMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function markAllPresent() {
    const map = {};
    faculty.forEach((f) => (map[f.id] = true));
    setPresentMap(map);
  }

  function save() {
    const present = Object.keys(presentMap).filter((k) => presentMap[k]);
    if (!marked_by) return alert("Please enter 'Marked By'");
    setHistory((prev) => [
      {
        attendance_id: `rec-${Date.now()}`,
        attendance_date,
        session,
        present,
        marked_by,
        marked_at,
        faculty_ids: present, // just for clarity
      },
      ...prev,
    ]);
    alert("Attendance saved (demo)");
  }

  // paging logic
  const start = (page - 1) * PAGE_SIZE;
  const pagedHistory = history.slice(start, start + PAGE_SIZE);

  function viewRecord(record) {
    const names = faculty
      .filter((f) => record.present.includes(f.id))
      .map((f) => f.name);
    alert(
      `Attendance Date: ${record.attendance_date}\nSession: ${record.session}\n` +
        `Marked By: ${record.marked_by}\nMarked At: ${record.marked_at}\n\n` +
        `Present (${names.length}):\n${names.join(", ")}`
    );
  }

  function totalPages() {
    return Math.ceil(history.length / PAGE_SIZE) || 1;
  }

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Mark Faculty Attendance</h3>

      <div className="card mt-3">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-center align-items-end attendance-controls mb-3">
            <div className="form-group mx-2 text-center">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={attendance_date}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div className="form-group mx-2 text-center">
              <label>Session</label>
              <select
                className="form-control"
                value={session}
                onChange={(e) => setSession(e.target.value)}
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>

            <div className="form-group mx-2 text-center">
              <label>Marked By (User ID)</label>
              <input
                className="form-control"
                value={marked_by}
                onChange={(e) => setMarkedBy(e.target.value)}
                placeholder="Admin ID"
              />
            </div>
            <div className="form-group mx-2 text-center">
              <label>Marked At</label>
              <input
                className="form-control"
                type="datetime-local"
                value={marked_at}
                onChange={(e) => setMarkedAt(e.target.value)}
              />
            </div>

            <div className="form-group mx-2 text-center">
              <label style={{ visibility: "hidden" }}>sp</label>
              <button className="btn btn-primary" onClick={markAllPresent}>
                Mark All Present
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th className="text-center">Present</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={!!presentMap[f.id]}
                        onChange={() => toggle(f.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-success" onClick={save}>
              Save Attendance
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h6>Recent Records</h6>
          {history.length === 0 ? (
            <div className="text-muted">
              <em>No records</em>
            </div>
          ) : (
            <>
              <ul className="list-group">
                {pagedHistory.map((h) => (
                  <li
                    key={h.attendance_id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      {h.attendance_date} — {h.session}
                      <span className="small ms-2 text-muted">
                        {" "}
                        ({(h.present || []).length} present)
                      </span>
                      {h.marked_at && (
                        <span className="small ms-2 text-success">
                          Marked at: {h.marked_at}
                        </span>
                      )}
                      {h.marked_by && (
                        <span className="small ms-2 text-info">
                          By: {h.marked_by}
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => viewRecord(h)}
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {/* Paging controls */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span>
                  Page {page} of {totalPages()}
                </span>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page >= totalPages()}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
