import React, { useEffect, useState } from 'react';
import { getTeacher, saveAttendanceRecord } from '../Faculty/api';
import { useLocation } from 'react-router-dom';
import "./attendance.css";

export default function Attendance() {
  const [teacher, setTeacher] = useState(null);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [session, setSession] = useState('Lecture');
  const [presentMap, setPresentMap] = useState({});
  const [records, setRecords] = useState([]); // previous attendance records (local cache)
  const location = useLocation();

  useEffect(() => {
    // load teacher and any attendance records attached to teacher object (if backend provides them)
    getTeacher().then(t => {
      setTeacher(t);
      // attempt to read attendance records from teacher (common keys: attendanceRecords / attendances)
      const found = t.attendanceRecords || t.attendances || [];
      setRecords(Array.isArray(found) ? found : []);
      // pre-select course from query param
      const params = new URLSearchParams(location.search);
      const q = params.get('course');
      if (q) {
        const c = t.courses.find(x => x.id === q);
        if (c) setSelected(c);
      }
    });
    setDate(new Date().toISOString().slice(0,10));
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
    selected.students.forEach(s => map[s.roll] = true);
    setPresentMap(map);
  }

  function save() {
    if (!selected) return alert('Select a section');
    if (!date) return alert('Select a date');

    const present = Object.keys(presentMap).filter(k => presentMap[k]);
    const absent = selected.students.map(s => s.roll).filter(r => !present.includes(r));
    const rec = { courseId: selected.id, date, session, present, absent };

    // Call backend to save (demo) and then update local cache so previous records are visible immediately
    saveAttendanceRecord(rec).then(() => {
      // update local records: replace existing with same courseId+date+session, else append
      setRecords(prev => {
        const idx = prev.findIndex(r => r.courseId === rec.courseId && r.date === rec.date && r.session === rec.session);
        const copy = [...prev];
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...rec };
        } else {
          copy.unshift(rec); // add to top
        }
        return copy;
      });

      // optional: refresh teacher from backend if it returns attendance
      getTeacher().then(t => setTeacher(t));

      alert('Attendance saved (demo). Replace with real backend.');
      // keep presentMap as-is so teacher can see what was saved; clear if you prefer:
      // setPresentMap({});
    }).catch(err => {
      console.error(err);
      alert('Failed to save attendance (demo). See console.');
    });
  }

  function viewRecord(record) {
    // build a readable summary
    const presentList = (record.present || []).join(', ') || '-';
    const absentList = (record.absent || []).join(', ') || '-';
    const summary = `Date: ${record.date}\nSession: ${record.session}\n\nPresent (${(record.present || []).length}):\n${presentList}\n\nAbsent (${(record.absent || []).length}):\n${absentList}`;
    // you can replace this alert with a modal if you have one
    alert(summary);
  }

  function editRecord(record) {
    if (!selected || selected.id !== record.courseId) {
      const course = teacher.courses.find(c => c.id === record.courseId);
      if (course) setSelected(course);
    }
    setDate(record.date);
    setSession(record.session);
    // rebuild presentMap from record.present
    const map = {};
    // ensure we set keys for students of currently selected course when possible
    const course = teacher.courses.find(c => c.id === record.courseId) || selected;
    if (course && course.students) {
      course.students.forEach(s => {
        map[s.roll] = (record.present || []).includes(s.roll);
      });
    } else {
      // fallback: set present flags for rolls present in the record
      (record.present || []).forEach(r => (map[r] = true));
    }
    setPresentMap(map);
    // scroll to attendance panel for convenience
    const el = document.getElementById('attendance-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteRecord(record) {
    // demo-only: remove from local cache. If you have backend delete, call it here.
    if (!window.confirm('Delete this attendance record from local view? (demo only)')) return;
    setRecords(prev => prev.filter(r => !(r.courseId === record.courseId && r.date === record.date && r.session === record.session)));
    alert('Record removed from local view (demo). Implement API delete to persist.');
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  // filter records for the selected course (show newest first)
  const courseRecords = selected ? records.filter(r => r.courseId === selected.id).slice().sort((a,b) => b.date.localeCompare(a.date)) : [];

  return (
    <>
      <h3 className="text-center page-title">Mark Attendance</h3>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="accent">Your Sections</h5>
          <div className="list-group mb-3">
            {teacher.courses.map(c => (
              <button
                key={c.id}
                className={`list-group-item list-group-item-action ${selected && selected.id === c.id ? 'active' : ''}`}
                onClick={() => selectCourse(c)}
              >
                {c.code} — {c.name} (Sec {c.section})
              </button>
            ))}
          </div>

          {selected && (
            <div id="attendance-panel">
              <h6 className="mb-4 mt-4 fw-bold">Mark Attendance for {selected.code} — {selected.name} (Sec {selected.section})</h6>

              {/* centered controls with gap */}
              <div className="attendance-controls d-flex justify-content-center align-items-end flex-wrap">
                <div className="form-group text-center mx-2">
                  <label className="d-block">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                <div className="form-group text-center mx-2">
                  <label className="d-block">Session</label>
                  <select
                    className="form-control"
                    value={session}
                    onChange={e => setSession(e.target.value)}
                  >
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

              {selected.students.length > 0 && Object.keys(presentMap).length > 0 && (
                <div className="mt-4">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>Name</th>
                        <th className="text-center">Present</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.students.map(s => (
                        <tr key={s.roll}>
                          <td>{s.roll}</td>
                          <td>{s.name}</td>
                          <td className="text-center">
                            <input type="checkbox" checked={!!presentMap[s.roll]} onChange={() => togglePresent(s.roll)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* save button separated with extra top margin */}
                  <div className="save-row d-flex justify-content-end">
                    <button className="btn btn-success" onClick={save}>Save Attendance</button>
                  </div>
                </div>
              )}

              {/* Previous Attendance for this section */}
              <div className="mt-4">
                <h6 className="mb-3">Previous Attendance — {selected.code} (Sec {selected.section})</h6>

                {courseRecords.length === 0 ? (
                  <div className="text-muted"><em>No previous attendance records</em></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm attendance-history-table">
                      <thead>
                        <tr>
                          <th style={{width: '22%'}}>Date</th>
                          <th style={{width: '18%'}}>Session</th>
                          <th style={{width: '18%'}}>Present</th>
                          <th style={{width: '18%'}}>Absent</th>
                          <th style={{width: '24%'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseRecords.map((r, i) => (
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