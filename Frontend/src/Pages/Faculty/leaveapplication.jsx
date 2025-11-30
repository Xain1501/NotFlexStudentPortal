import React, { useEffect, useState } from "react";
import { getTeacher, applyLeaveRequest } from "../Faculty/api";
import "./leaveapplication.css";

export default function Leave() {
  const [teacher, setTeacher] = useState(null);
  const [form, setForm] = useState({
    from: "",
    to: "",
    type: "Casual",
    reason: "",
  });
  const [semesterRange, setSemesterRange] = useState(null);

  useEffect(() => {
    getTeacher().then((t) => setTeacher(t));
    // compute current semester range on mount
    setSemesterRange(getCurrentSemesterRange(new Date()));
  }, []);

  function getCurrentSemesterRange(date) {
    // Simple two-semester split: Jan-Jun and Jul-Dec
    const year = date.getFullYear();
    const month = date.getMonth(); // 0..11
    if (month <= 5) {
      // First semester: Jan 1 - Jun 30
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 5, 30),
        label: `Jan - Jun ${year}`,
      };
    } else {
      // Second semester: Jul 1 - Dec 31
      return {
        start: new Date(year, 6, 1),
        end: new Date(year, 11, 31),
        label: `Jul - Dec ${year}`,
      };
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!form.from || !form.to || !form.reason)
      return alert("Fill required fields");
    applyLeaveRequest(form).then(() => {
      alert("Leave applied (demo). Replace with real app.");
      // refresh local view
      getTeacher().then((t) => setTeacher(t));
      setForm({ from: "", to: "", type: "Casual", reason: "" });
    });
  }

  function formatDate(d) {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toISOString().slice(0, 10);
  }

  function overlapsSemester(leave, sem) {
    if (!leave || !sem) return false;
    const from = new Date(leave.from);
    const to = new Date(leave.to);
    // overlap check: not (to < sem.start || from > sem.end)
    return !(to < sem.start || from > sem.end);
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  // Filter leaves that overlap the current semester range
  const leavesThisSemester = (teacher.leaves || []).filter((l) =>
    overlapsSemester(l, semesterRange)
  );

  return (
    <>
      <h3 className="text-center page-title">Apply for Leave</h3>

      <div className="card mt-3">
        <div className="card-body">
          <form onSubmit={submit}>
            {/* centered date/type controls */}
            <div className="date-controls d-flex justify-content-center flex-wrap mb-3">
              <div className="form-group mx-2">
                <label className="d-block text-center">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  required
                />
              </div>

              <div className="form-group mx-2">
                <label className="d-block text-center">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* prominent reason area */}
            <div className="form-group">
              <label className="d-block fw-bold">Reason</label>
              <textarea
                className="form-control prominent-reason"
                rows="6"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </div>

            {/* apply button with extra gap above */}
            <div className="apply-row d-flex justify-content-center">
              <button className="btn btn-primary apply-btn mt-4 " type="submit">
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Leave requests list */}
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="accent">Your Leave Requests</h5>
          <div className="table-responsive">
            <table className="table table-sm mt-2">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teacher.leaves.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <em>No requests</em>
                    </td>
                  </tr>
                ) : (
                  teacher.leaves.map((l, i) => (
                    <tr key={i}>
                      <td>
                        {formatDate(l.from)} → {formatDate(l.to)}
                      </td>
                      <td>{l.type}</td>
                      <td>{l.reason}</td>
                      <td>{l.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* History this semester */}
      <div className="card mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="accent mb-0">
              Leaves History —{" "}
              {semesterRange ? semesterRange.label : "This Semester"}
            </h5>
            <div className="text-muted small">
              Showing leaves that overlap this semester
            </div>
          </div>

          {leavesThisSemester.length === 0 ? (
            <div className="text-muted">
              <em>No leave records for this semester</em>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm mt-2 leave-history-table">
                <thead>
                  <tr>
                    <th style={{ width: "22%" }}>Applied On</th>
                    <th style={{ width: "22%" }}>Period</th>
                    <th style={{ width: "18%" }}>Type</th>
                    <th style={{ width: "28%" }}>Reason</th>
                    <th style={{ width: "10%" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesThisSemester.map((l, i) => (
                    <tr key={i}>
                      <td>
                        {formatDate(
                          l.appliedOn || l.createdAt || l.applied || ""
                        )}
                      </td>
                      <td>
                        {formatDate(l.from)} → {formatDate(l.to)}
                      </td>
                      <td>{l.type}</td>
                      <td>{l.reason}</td>
                      <td>{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
