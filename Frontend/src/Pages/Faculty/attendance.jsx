import React, { useEffect, useState } from 'react';
import { getTeacher, saveAttendanceRecord } from '../Faculty/api';
import { useLocation } from 'react-router-dom';

export default function Attendance() {
  const [teacher, setTeacher] = useState(null);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [session, setSession] = useState('Lecture');
  const [presentMap, setPresentMap] = useState({});
  const location = useLocation();

  useEffect(() => {
    getTeacher().then(t => {
      setTeacher(t);
      // pre-select course from query param
      const params = new URLSearchParams(location.search);
      const q = params.get('course');
      if (q) {
        const c = t.courses.find(x => x.id === q);
        if (c) {
          setSelected(c);
        }
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
    // mark all present by default
    const map = {};
    selected.students.forEach(s => map[s.roll] = true);
    setPresentMap(map);
  }

  function save() {
    if (!selected) return alert('Select a section');
    const present = Object.keys(presentMap).filter(k => presentMap[k]);
    const absent = selected.students.map(s => s.roll).filter(r => !present.includes(r));
    const rec = {
      courseId: selected.id,
      date, session, present, absent
    };
    saveAttendanceRecord(rec).then(() => {
      alert('Attendance saved (demo). Replace with real backend.');
      setPresentMap({});
    });
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <h3 className="text-center page-title">Mark Attendance</h3>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="accent">Your Sections</h5>
          <div className="list-group mb-3">
            {teacher.courses.map(c => (
              <button key={c.id} className={`list-group-item list-group-item-action ${selected && selected.id === c.id ? 'active' : ''}`} onClick={() => selectCourse(c)}>
                {c.code} — {c.name} (Sec {c.section})
              </button>
            ))}
          </div>

          {selected && (
            <div id="attendance-panel">
              <h6>Mark Attendance for {selected.code} — {selected.name} (Sec {selected.section})</h6>

              <div className="form-row align-items-end">
                <div className="col-md-3">
                  <label>Date</label>
                  <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label>Session</label>
                  <select className="form-control" value={session} onChange={e => setSession(e.target.value)}>
                    <option>Lecture</option>
                    <option>Lab</option>
                    <option>Tutorial</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary" onClick={loadStudents}>Load Students</button>
                </div>
              </div>

              {selected.students.length > 0 && Object.keys(presentMap).length > 0 && (
                <div className="mt-4">
                  <table className="table table-sm">
                    <thead><tr><th>Roll</th><th>Name</th><th className="text-center">Present</th></tr></thead>
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
                  <div className="text-right">
                    <button className="btn btn-success" onClick={save}>Save Attendance</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}