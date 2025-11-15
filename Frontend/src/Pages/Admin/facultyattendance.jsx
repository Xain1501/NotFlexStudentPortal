import React, { useEffect, useState } from 'react';
import { fetchFacultyList, saveFacultyAttendance, fetchFacultyAttendance } from '../Admin/api';
import "./adminhome.css";

/**
 * Mark faculty attendance (admin)
 * - Select date/session, display faculty list, toggle present/absent
 * - Save attendance and view recent history
 */
export default function FacultyAttendance() {
  const [faculty, setFaculty] = useState([]);
  const [presentMap, setPresentMap] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [session, setSession] = useState('Morning');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        if (typeof fetchFacultyList === 'function') {
          setFaculty(await fetchFacultyList());
        } else {
          setFaculty([
            { id: 'F1', name: 'Dr. Aisha Khan' },
            { id: 'F2', name: 'Mr. Ali Raza' }
          ]);
        }

        if (typeof fetchFacultyAttendance === 'function') {
          const h = await fetchFacultyAttendance();
          setHistory(h);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  function toggle(id) {
    setPresentMap(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function save() {
    const present = Object.keys(presentMap).filter(k => presentMap[k]);
    try {
      if (typeof saveFacultyAttendance === 'function') {
        await saveFacultyAttendance({ date, session, present });
      } else {
        // local demo add
        setHistory(prev => [{ date, session, present, id: `rec-${Date.now()}` }, ...prev]);
      }
      alert('Attendance saved (demo)');
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    }
  }

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Mark Faculty Attendance</h3>

      <div className="card mt-3">
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-end flex-wrap attendance-controls mb-3">
            <div className="form-group mx-2 text-center">
              <label>Date</label>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="form-group mx-2 text-center">
              <label>Session</label>
              <select className="form-control" value={session} onChange={e => setSession(e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>

            <div className="form-group mx-2 text-center">
              <label style={{visibility: 'hidden'}}>sp</label>
              <button className="btn btn-primary" onClick={() => {
                const map = {};
                faculty.forEach(f => map[f.id] = true);
                setPresentMap(map);
              }}>Mark All Present</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm">
              <thead><tr><th>Faculty</th><th className="text-center">Present</th></tr></thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td className="text-center">
                      <input type="checkbox" checked={!!presentMap[f.id]} onChange={() => toggle(f.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-success" onClick={save}>Save Attendance</button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h6>Recent Records</h6>
          {history.length === 0 ? <div className="text-muted"><em>No records</em></div> : (
            <ul className="list-group">
              {history.map(h => (
                <li key={h.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>{h.date} — {h.session} <span className="small text-muted">({(h.present||[]).length} present)</span></div>
                  <div>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => alert(`Present: ${(h.present||[]).join(', ')}`)}>View</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}