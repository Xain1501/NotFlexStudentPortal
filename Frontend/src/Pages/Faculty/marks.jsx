import React, { useEffect, useState } from 'react';
import { getTeacher, saveMarksRecord } from '../Faculty/api';
import { useLocation } from 'react-router-dom';
import "../Faculty/styles.css";

export default function Marks() {
  const [teacher, setTeacher] = useState(null);
  const [selected, setSelected] = useState(null);
  const [assessmentName, setAssessmentName] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [marksMap, setMarksMap] = useState({});
  const location = useLocation();

  useEffect(() => {
    getTeacher().then(t => {
      setTeacher(t);
      const q = new URLSearchParams(location.search).get('course');
      if (q) {
        const c = t.courses.find(x => x.id === q);
        if (c) setSelected(c);
      }
    });
  }, [location.search]);

  function selectCourse(c) {
    setSelected(c);
    setMarksMap({});
    setAssessmentName('');
    setMaxMarks('');
  }

  function createAssessment() {
    if (!assessmentName || !maxMarks) return alert('Enter assessment name and max marks.');
    // just note name & max in UI; editing table below
    alert(`Created assessment "${assessmentName}" (demo). Now enter marks and Save.`);
  }

  function setMark(roll, value) {
    setMarksMap(prev => ({ ...prev, [roll]: value }));
  }

  function save() {
    if (!selected) return alert('Select a section first');
    const marks = Object.entries(marksMap).map(([roll, marksObt]) => ({ roll, marks: marksObt === '' ? null : Number(marksObt) }));
    const rec = {
      courseId: selected.id,
      assessment: assessmentName || 'Untitled',
      maxMarks: maxMarks ? Number(maxMarks) : null,
      marks
    };
    saveMarksRecord(rec).then(() => {
      alert('Marks saved (demo). Replace with real backend.');
      setAssessmentName('');
      setMaxMarks('');
      setMarksMap({});
    });
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <h3 className="text-center page-title">Student Marks</h3>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="accent">Sections</h5>
          <div className="list-group">
            {teacher.courses.map(c => (
              <button key={c.id} className={`list-group-item list-group-item-action ${selected && selected.id === c.id ? 'active' : ''}`} onClick={() => selectCourse(c)}>
                {c.code} — {c.name} (Sec {c.section})
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div id="marks-entry" className="card mt-3">
          <div className="card-body">
            <h5 className="accent">Enter Marks — {selected.code} — {selected.name} (Sec {selected.section})</h5>

            <div className="form-inline mb-3">
              <input className="form-control mr-2" placeholder="Quiz / Assignment name" value={assessmentName} onChange={e => setAssessmentName(e.target.value)} />
              <input type="number" min="1" className="form-control mr-2" placeholder="Max marks" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
              <button className="btn btn-secondary" onClick={createAssessment}>Create</button>
            </div>

            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr><th>Roll</th><th>Name</th><th>Marks Obtained</th></tr>
                </thead>
                <tbody>
                  {selected.students.map(s => (
                    <tr key={s.roll}>
                      <td>{s.roll}</td>
                      <td>{s.name}</td>
                      <td>
                        <input type="number" min="0" className="form-control" style={{width: '140px'}} value={marksMap[s.roll] || ''} onChange={e => setMark(s.roll, e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right">
              <button className="btn btn-primary" onClick={save}>Save Marks</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}