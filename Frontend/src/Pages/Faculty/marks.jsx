import React, { useEffect, useState } from 'react';
import { getTeacher } from '../Faculty/api';
import "./marks.css";

export default function Marks() {
  const [teacher, setTeacher] = useState(null);
  const [selected, setSelected] = useState(null);
  const [testName, setTestName] = useState('');
  const [total, setTotal] = useState(''); // total marks for the test
  const [marksMap, setMarksMap] = useState({}); // { roll: "string value" }
  const [savedTests, setSavedTests] = useState([]); // [{ courseId, testName, total, marks: {roll: number|null} }]

  useEffect(() => {
    getTeacher().then(t => {
      setTeacher(t);
      if (t && t.courses && t.courses.length > 0) setSelected(t.courses[0]);
    });
  }, []);

  function selectCourse(c) {
    setSelected(c);
    setTestName('');
    setTotal('');
    setMarksMap({});
  }

  function createTest() {
    if (!selected) return alert('Select a course/section first');
    if (!testName.trim()) return alert('Enter a name for the test');
    // initialize marks map with existing saved values (if any) or empty strings
    const init = {};
    selected.students.forEach(s => {
      const existing = findSavedTest(selected.id, testName);
      init[s.roll] = existing && existing.marks[s.roll] != null ? String(existing.marks[s.roll]) : '';
    });
    // if a saved test exists, load its total too
    const existing = findSavedTest(selected.id, testName);
    if (existing) setTotal(existing.total != null ? String(existing.total) : '');
    setMarksMap(init);
    // focus first input for convenience (optional)
    setTimeout(() => {
      const el = document.querySelector('.marks-input');
      if (el) el.focus();
    }, 50);
  }

  function findSavedTest(courseId, tName) {
    return savedTests.find(st => st.courseId === courseId && st.testName === tName);
  }

  function handleMarkChange(roll, value) {
    // allow only digits and empty
    if (value === '' || /^[0-9]{0,4}$/.test(value)) {
      // if total is set, prevent entering a mark > total
      if (value !== '' && total !== '') {
        const n = Number(value);
        const tot = Number(total);
        if (!Number.isNaN(n) && !Number.isNaN(tot) && n > tot) {
          // ignore the change (or clamp). Here we'll clamp to total.
          value = String(tot);
        }
      }
      setMarksMap(prev => ({ ...prev, [roll]: value }));
    }
  }

  function saveMarks() {
    if (!selected) return alert('Select a course first');
    if (!testName.trim()) return alert('Enter a test name');
    // ensure at least one mark entered
    // convert strings to numbers or null
    const marks = {};
    selected.students.forEach(s => {
      const v = marksMap[s.roll];
      marks[s.roll] = v === '' || v === undefined ? null : Number(v);
    });

    // If total provided, validate entries are <= total
    if (total !== '') {
      const tot = Number(total);
      if (Number.isNaN(tot) || tot <= 0) return alert('Enter a valid total marks value');
      for (const r of Object.keys(marks)) {
        const m = marks[r];
        if (m != null && (Number.isNaN(m) || m < 0 || m > tot)) {
          return alert(`Invalid mark for roll ${r}. Marks must be between 0 and ${tot}`);
        }
      }
    }

    setSavedTests(prev => {
      const existingIndex = prev.findIndex(st => st.courseId === selected.id && st.testName === testName);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], marks, total: total === '' ? null : Number(total) };
        return copy;
      } else {
        return [...prev, { courseId: selected.id, testName, total: total === '' ? null : Number(total), marks }];
      }
    });

    alert('Marks saved locally (demo). They are available below and can be edited.');
  }

  function editTestEntry(entry) {
    // switch to that course if needed
    if (!selected || entry.courseId !== selected.id) {
      const course = teacher.courses.find(c => c.id === entry.courseId);
      if (course) setSelected(course);
    }
    setTestName(entry.testName);
    setTotal(entry.total != null ? String(entry.total) : '');
    const mm = {};
    const course = teacher.courses.find(c => c.id === entry.courseId);
    if (course) {
      course.students.forEach(s => {
        mm[s.roll] = entry.marks[s.roll] == null ? '' : String(entry.marks[s.roll]);
      });
    } else {
      Object.keys(entry.marks).forEach(r => mm[r] = entry.marks[r] == null ? '' : String(entry.marks[r]));
    }
    setMarksMap(mm);
    // scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function viewMarks(entry) {
    const course = teacher.courses.find(c => c.id === entry.courseId);
    const rows = (course ? course.students : Object.keys(entry.marks).map(r => ({ roll: r, name: '' })))
      .map(s => `${s.roll}: ${entry.marks[s.roll] != null ? entry.marks[s.roll] : '-'}`).join('\n');
    alert(`Marks for "${entry.testName}" (Total: ${entry.total ?? '-'})\n\n${rows}`);
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <h3 className="text-center page-title">Manage Marks</h3>

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

          {selected ? (
            <>
              {/* centered test name + total */}
              <div className="d-flex justify-content-center mb-3 flex-wrap test-header-row">
                <div style={{ minWidth: 240, width: '40%', maxWidth: 420 }} className="mx-2">
                  <label className="d-block text-center font-weight-bold">Test Name</label>
                  <input
                    className="form-control text-center test-name-input"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    placeholder="e.g. Midterm 1"
                  />
                </div>

                <div style={{ minWidth: 140, width: '18%', maxWidth: 160 }} className="mx-2">
                  <label className="d-block text-center font-weight-bold">Total</label>
                  <input
                    className="form-control text-center"
                    value={total}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || /^[0-9]{0,4}$/.test(v)) setTotal(v);
                    }}
                    placeholder="100"
                  />
                </div>

                <div className="d-flex align-items-end mx-2">
                  <button className="btn btn-primary create-btn" onClick={createTest}>Create Test</button>
                </div>
              </div>

              {/* marks table */}
              <div className="table-responsive">
                <table className="table table-sm marks-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Roll</th>
                      <th style={{ width: '52%' }}>Name</th>
                      <th className="text-center" style={{ width: '30%' }}>
                        Marks {total ? <small className="text-muted">/ {total}</small> : null}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.students.map(s => (
                      <tr key={s.roll}>
                        <td className="align-middle">{s.roll}</td>
                        <td className="align-middle">{s.name}</td>
                        <td className="text-center">
                          <input
                            className="form-control marks-input d-inline-block"
                            value={marksMap[s.roll] ?? ''}
                            onChange={e => handleMarkChange(s.roll, e.target.value)}
                            placeholder="-"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save button AFTER marks block with gap */}
              <div className="d-flex justify-content-end mt-3 save-after-marks-row">
                <button className="btn btn-primary save-btn" onClick={saveMarks}>Save Marks</button>
              </div>

              {/* saved tests for this course */}
              <div className="mt-4">
                <h6 className="mb-2">Saved Tests for {selected.code} (you can view or update)</h6>
                {savedTests.filter(st => st.courseId === selected.id).length === 0 ? (
                  <div><em>No saved tests</em></div>
                ) : (
                  <div className="list-group saved-tests-list">
                    {savedTests
                      .filter(st => st.courseId === selected.id)
                      .map((st, i) => (
                        <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{st.testName}</strong>
                            <div className="small text-muted">Total: {st.total ?? '-'}</div>
                          </div>

                          <div className="btn-group">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => editTestEntry(st)}>Edit</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => viewMarks(st)}>View</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : <div className="text-muted">Select a section to enter marks</div>}
        </div>
      </div>
    </>
  );
}