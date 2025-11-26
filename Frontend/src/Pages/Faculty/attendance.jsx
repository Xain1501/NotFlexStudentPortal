import React, { useEffect, useState } from 'react';
import "./attendance.css";
import { useLocation } from 'react-router-dom';

const ATT_KEY = "attendance_records";

// helpers
function loadAttendance() {
  try {
    const raw = localStorage.getItem(ATT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadAttendance error:", e);
    return [];
  }
}
function saveAttendance(list) {
  try {
    localStorage.setItem(ATT_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("attendance_updated"));
  } catch (e) {
    console.error("saveAttendance error:", e);
  }
}

// Demo getTeacher() placeholder — keep your real API/get logic.
// Here we expect teacher.courses with structure [{ id: 'CS301', code, name, section, students: [{roll,name}] }]
async function getTeacherDemo() {
  // provide a demo teacher if your real getTeacher not available
  return {
    id: "T1",
    name: "Prof X",
    courses: [
      { id: "CS301", code: "CS301", name: "Data Structures", section: "A", students: [{ roll: "S1001", name: "Ali" }, { roll: "S1002", name: "Sara" }] },
      { id: "CS302", code: "CS302", name: "Operating Systems", section: "B", students: [{ roll: "S1001", name: "Ali" }] },
    ],
    attendanceRecords: loadAttendance()
  };
}

export default function Attendance() {
  const [teacher, setTeacher] = useState(null);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [session, setSession] = useState('Lecture');
  const [presentMap, setPresentMap] = useState({});
  const [records, setRecords] = useState([]); // all attendance records
  const location = useLocation();

  useEffect(() => {
    // load teacher (demo or API) and attendance records
    (async () => {
      const t = await (typeof window.getTeacher === 'function' ? window.getTeacher() : getTeacherDemo());
      setTeacher(t);
      setRecords(loadAttendance());
      // pick course from query param if provided
      const params = new URLSearchParams(location.search);
      const q = params.get('course');
      if (q) {
        const c = (t.courses || []).find(x => x.id === q || x.code === q);
        if (c) setSelected(c);
      }
    })();
    setDate(new Date().toISOString().slice(0,10));

    const onUpdated = () => setRecords(loadAttendance());
    window.addEventListener('storage', onUpdated);
    window.addEventListener('attendance_updated', onUpdated);
    return () => {
      window.removeEventListener('storage', onUpdated);
      window.removeEventListener('attendance_updated', onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  function selectCourse(c) {
    setSelected(c);
    setPresentMap({});
  }

  function togglePresent(roll) {
    setPresentMap(prev => ({ ...prev, [roll]: !prev[roll] }));
  }

  function loadStudents() {
    if (!selected) return alert('Select a section first');
    const map = {};
    (selected.students || []).forEach(s => map[s.roll] = true);
    setPresentMap(map);
  }

  function save() {
    if (!selected) return alert('Select a section');
    if (!date) return alert('Select a date');

    const present = Object.keys(presentMap).filter(k => presentMap[k]);
    const absent = (selected.students || []).map(s => s.roll).filter(r => !present.includes(r));
    const rec = { courseId: selected.id || selected.code, date, session, present, absent, createdAt: new Date().toISOString() };

    // write to localStorage (replace same course+date+session or prepend)
    setRecords(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(r => r.courseId === rec.courseId && r.date === rec.date && r.session === rec.session);
      if (idx >= 0) copy[idx] = { ...copy[idx], ...rec };
      else copy.unshift(rec);
      saveAttendance(copy);
      return copy;
    });

    alert('Attendance saved locally and visible to students.');
  }

  function viewRecord(record) {
    const presentList = (record.present || []).join(', ') || '-';
    const absentList = (record.absent || []).join(', ') || '-';
    alert(`Date: ${record.date}\nSession: ${record.session}\n\nPresent (${(record.present || []).length}):\n${presentList}\n\nAbsent (${(record.absent || []).length}):\n${absentList}`);
  }

  function editRecord(record) {
    if (!selected || (selected.id || selected.code) !== record.courseId) {
      const course = (teacher.courses || []).find(c => (c.id || c.code) === record.courseId);
      if (course) setSelected(course);
    }
    setDate(record.date);
    setSession(record.session);
    const map = {};
    (record.present || []).forEach(r => (map[r] = true));
    setPresentMap(map);
    const el = document.getElementById('attendance-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteRecord(record) {
    if (!window.confirm('Delete this attendance record?')) return;
    setRecords(prev => {
      const copy = prev.filter(r => !(r.courseId === record.courseId && r.date === record.date && r.session === record.session));
      saveAttendance(copy);
      return copy;
    });
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  const courseRecords = selected ? records.filter(r => r.courseId === (selected.id || selected.code)).slice().sort((a,b) => b.date.localeCompare(a.date)) : [];

  return (
    <>
      <h3 className="text-center page-title">Mark Attendance</h3>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="accent">Your Sections</h5>
          <div className="list-group mb-3">
            {(teacher.courses || []).map(c => (
              <button key={c.id || c.code} className={`list-group-item list-group-item-action ${(selected && (selected.id||selected.code) === (c.id||c.code)) ? 'active' : ''}`} onClick={() => selectCourse(c)}>
                {(c.code || c.id)} — {c.name} (Sec {c.section})
              </button>
            ))}
          </div>

          {selected && (
            <div id="attendance-panel">
              <h6 className="mb-4 mt-4 fw-bold">Mark Attendance for {selected.code || selected.id} — {selected.name} (Sec {selected.section})</h6>

              <div className="attendance-controls d-flex justify-content-center align-items-end flex-wrap">
                <div className="form-group text-center mx-2">
                  <label className="d-block">Date</label>
                  <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div className="form-group text-center mx-2">
                  <label className="d-block">Session</label>
                  <select className="form-control" value={session} onChange={e => setSession(e.target.value)}>
                    <option>Lecture</option>
                    <option>Lab</option>
                    <option>Tutorial</option>
                  </select>
                </div>

                <div className="form-group text-center mx-2">
                  <label className="d-block" style={{visibility: 'hidden'}}>sp</label>
                  <button className="btn btn-primary load-btn" onClick={loadStudents}>Load Students</button>
                </div>
              </div>

              {selected.students && selected.students.length > 0 && Object.keys(presentMap).length > 0 && (
                <div className="mt-4">
                  <table className="table table-sm">
                    <thead>
                      <tr><th>Roll</th><th>Name</th><th className="text-center">Present</th></tr>
                    </thead>
                    <tbody>
                      {selected.students.map(s => (
                        <tr key={s.roll}>
                          <td>{s.roll}</td>
                          <td>{s.name}</td>
                          <td className="text-center"><input type="checkbox" checked={!!presentMap[s.roll]} onChange={() => togglePresent(s.roll)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="save-row d-flex justify-content-end">
                    <button className="btn btn-success" onClick={save}>Save Attendance</button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h6 className="mb-3">Previous Attendance — {(selected.code || selected.id)} (Sec {selected.section})</h6>

                {courseRecords.length === 0 ? (
                  <div className="text-muted"><em>No previous attendance records</em></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm attendance-history-table">
                      <thead>
                        <tr><th style={{width:'22%'}}>Date</th><th style={{width:'18%'}}>Session</th><th style={{width:'18%'}}>Present</th><th style={{width:'18%'}}>Absent</th><th style={{width:'24%'}}>Actions</th></tr>
                      </thead>
                      <tbody>
                        {courseRecords.map((r,i) => (
                          <tr key={i}>
                            <td>{r.date}</td>
                            <td>{r.session}</td>
                            <td>{(r.present || []).length}</td>
                            <td>{(r.absent || []).length}</td>
                            <td>
                              <div className="btn-group">
                                <button className="btn btn-outline-primary btn-sm me-3" onClick={() => viewRecord(r)}>View</button>
                                <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => editRecord(r)}>Edit</button>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteRecord(r)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}