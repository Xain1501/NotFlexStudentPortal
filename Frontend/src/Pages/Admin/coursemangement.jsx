import React, { useEffect, useState } from 'react';
import "./adminhome.css";

const DEPTS_KEY = "departments_store";
const REG_KEY = "course_registrations";

function loadDepts() {
  try {
    const raw = localStorage.getItem(DEPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadDepts error:", e);
    return [];
  }
}
function saveDepts(list) {
  try {
    localStorage.setItem(DEPTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("departments_updated"));
  } catch (e) {
    console.error("saveDepts error:", e);
  }
}

function loadRegistrations() {
  try {
    const raw = localStorage.getItem(REG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadRegistrations error:", e);
    return [];
  }
}

export default function CourseManagement() {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students] = useState([]); // optional roster; registrations will provide student info
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);

  // Form fields
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [assignRoll, setAssignRoll] = useState('');
  const [undoInfo, setUndoInfo] = useState(null);

  // For editing students inline
  const [editStudentIdx, setEditStudentIdx] = useState(-1);
  const [editStudentRoll, setEditStudentRoll] = useState('');
  const [editStudentName, setEditStudentName] = useState('');

  // flatten helper (unchanged)
  function flattenDepartmentsToCourses(depts) {
    return (depts || []).flatMap(d =>
      (d.courses || []).map(c => ({
        code: c.code,
        name: c.name,
        deptId: d.id,
        deptName: d.name,
        deptCode: d.code,
        sections: c.sections
          ? c.sections
          : (c.section ? [{ section: c.section, students: [] }] : [])
      }))
    );
  }

  useEffect(() => {
    const depts = loadDepts();
    setDepartments(depts);

    // seed demo students (optional)
    setCourses(flattenDepartmentsToCourses(depts));

    setLoading(false);

    // Apply registrations that already exist in localStorage
    applyRegistrationsToCourses(loadRegistrations());

    // Listen for events: departments changing or registrations changing
    const onStorage = () => {
      const d = loadDepts();
      setDepartments(d);
      setCourses(flattenDepartmentsToCourses(d));
      // reapply registrations after dept/course refresh
      applyRegistrationsToCourses(loadRegistrations());
    };
    const onRegs = () => {
      applyRegistrationsToCourses(loadRegistrations());
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('departments_updated', onStorage);
    window.addEventListener('course_registrations_updated', onRegs);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('departments_updated', onStorage);
      window.removeEventListener('course_registrations_updated', onRegs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // merge registrations into current courses state
  function applyRegistrationsToCourses(regs) {
    setCourses(prevCourses => {
      // make a deep-ish copy we can mutate safely
      const next = (prevCourses || []).map(c => ({
        ...c,
        sections: (c.sections || []).map(s => ({ ...s, students: [...(s.students || [])] }))
      }));

      regs.forEach(r => {
        const course = next.find(c => c.code === r.courseId);
        const student = r.student || {};
        if (course) {
          // ensure there is at least one section; if none, create section 'A'
          if (!course.sections || course.sections.length === 0) {
            course.sections = [{ section: "A", students: [] }];
          }
          // choose first section to add student
          const sec = course.sections[0];
          const exists = (sec.students || []).some(s => String(s.roll) === String(student.roll));
          if (!exists) {
            sec.students = [...(sec.students || []), { roll: student.roll, name: student.name }];
          }
        } else {
          // Course might be unassigned/local or not present; if not present, add as unassigned course and add section
          const existsCourse = next.find(c => c.code === r.courseId);
          if (!existsCourse) {
            next.push({
              code: r.courseId,
              name: r.courseId,
              deptId: undefined,
              deptName: "Unassigned",
              sections: [{ section: "A", students: [{ roll: student.roll, name: student.name }] }]
            });
          }
        }
      });

      return next;
    });
  }

  // Add a new course (local)
  function addCourse() {
    if (!newCourseCode || !newCourseName) return alert('Enter course code & name');
    if (courses.find(c => c.code === newCourseCode)) return alert('Course code already exists');

    const newCourse = { code: newCourseCode, name: newCourseName, sections: [] };
    setCourses(prev => [...prev, newCourse]);
    setNewCourseCode('');
    setNewCourseName('');
  }

  // Add a section to selected course
  function addSection() {
    if (!selectedCourse || !newSection) return alert('Select course and enter section name');
    setCourses(prev =>
      prev.map(c =>
        c.code === selectedCourse.code && (c.deptId ? c.deptId === selectedCourse.deptId : true)
          ? { ...c, sections: [...(c.sections || []), { section: newSection, students: [] }] }
          : c
      )
    );
    setSelectedCourse(prev =>
      prev
        ? {
            ...prev,
            sections: [...(prev.sections || []), { section: newSection, students: [] }]
          }
        : prev
    );
    setNewSection('');
  }

  function selectCourse(course) {
    setSelectedCourse(course);
    setSelectedSection(course.sections && course.sections.length > 0 ? course.sections[0].section : '');
  }

  function selectSection(section) {
    setSelectedSection(section);
  }

  // Manual assign student (admin)
  function doAssign() {
    if (!assignRoll || !selectedCourse || !selectedSection) return alert('Select course, section, and enter student roll');
    const student = { roll: assignRoll, name: assignRoll };
    setCourses(prev =>
      prev.map(c =>
        c.code !== selectedCourse.code || (c.deptId && selectedCourse.deptId && c.deptId !== selectedCourse.deptId)
          ? c
          : {
              ...c,
              sections: c.sections.map(sec =>
                sec.section === selectedSection
                  ? { ...sec, students: [...(sec.students || []), student] }
                  : sec
              )
            }
      )
    );
    setSelectedCourse(prev =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map(sec =>
              sec.section === selectedSection
                ? { ...sec, students: [...(sec.students || []), student] }
                : sec
            )
          }
        : prev
    );
    setAssignRoll('');
  }

  // Drop student, allow undo (unchanged)
  function doDrop(code, section, student, idx) {
    if (!window.confirm(`Drop student ${student.roll} from ${code} section ${section}?`)) return;
    setCourses(prev =>
      prev.map(c =>
        c.code !== code
          ? c
          : {
              ...c,
              sections: c.sections.map(sec =>
                sec.section !== section
                  ? sec
                  : { ...sec, students: sec.students.filter((s, sidx) => sidx !== idx) }
              )
            }
      )
    );
    // also remove any matching registration in localStorage (so student truly unenrolled)
    const regs = loadRegistrations().filter(r => !(r.courseId === code && String(r.student?.roll) === String(student.roll)));
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(regs));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("course_registrations_updated"));
    } catch (e) {
      console.error("error updating registrations on drop", e);
    }
    setUndoInfo({ code, section, student, idx });
    setTimeout(() => setUndoInfo(null), 8000);
  }

  function undoDrop() {
    if (!undoInfo) return;
    const { code, section, student, idx } = undoInfo;
    // re-add registration to localStorage
    const regs = loadRegistrations();
    regs.unshift({ courseId: code, student: { roll: student.roll, name: student.name }, enrolledAt: new Date().toISOString() });
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(regs));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("course_registrations_updated"));
    } catch (e) {
      console.error("undoDrop save failed", e);
    }
    // reapply
    applyRegistrationsToCourses(regs);
    setUndoInfo(null);
  }

  // Edit/save student inline (unchanged)
  function startEditStudent(idx, s) {
    setEditStudentIdx(idx);
    setEditStudentRoll(s.roll);
    setEditStudentName(s.name);
  }

  function saveEditStudent(idx) {
    if (!selectedCourse) return;
    setCourses(prev =>
      prev.map(c =>
        c.code !== selectedCourse.code
          ? c
          : {
              ...c,
              sections: c.sections.map(sec =>
                sec.section !== selectedSection
                  ? sec
                  : {
                      ...sec,
                      students: sec.students.map((stu, sidx) =>
                        sidx !== idx ? stu : { roll: editStudentRoll, name: editStudentName }
                      )
                    }
              )
            }
      )
    );
    // Update registration store if the student exists there
    try {
      const regs = loadRegistrations().map(r => {
        if (r.courseId === selectedCourse.code && r.student && r.student.roll === (selectedCourse.sections.find(sec=>sec.section===selectedSection)?.students[idx]?.roll)) {
          return { ...r, student: { roll: editStudentRoll, name: editStudentName } };
        }
        return r;
      });
      localStorage.setItem(REG_KEY, JSON.stringify(regs));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("course_registrations_updated"));
    } catch (e) {
      console.error("failed saving registrations after edit", e);
    }

    setEditStudentIdx(-1);
    setEditStudentRoll('');
    setEditStudentName('');
  }

  // Delete section/course (unchanged)
  function deleteSection(code, section) {
    if (!window.confirm(`Delete section ${section} from course ${code}? This is irreversible.`)) return;
    setCourses(prev =>
      prev.map(c =>
        c.code !== code
          ? c
          : { ...c, sections: c.sections.filter(sec => sec.section !== section) }
      )
    );
    setSelectedCourse(prev =>
      prev
        ? { ...prev, sections: prev.sections.filter(sec => sec.section !== section) }
        : prev
    );
    setSelectedSection('');
    // optionally remove registrations associated with that course/section
    const regs = loadRegistrations().filter(r => r.courseId !== code);
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(regs));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("course_registrations_updated"));
    } catch (e) {
      console.error("failed removing registrations on deleteSection", e);
    }
  }

  function deleteCourse(code) {
    if (!window.confirm(`Delete course ${code}? All sections and students will be removed. This is irreversible.`)) return;

    const course = courses.find(c => c.code === code);
    if (course && course.deptId) {
      const newDeps = (departments || []).map(d =>
        d.id !== course.deptId
          ? d
          : { ...d, courses: (d.courses || []).filter(cc => cc.code !== code) }
      );
      saveDepts(newDeps);
      setDepartments(newDeps);
    }

    setCourses(prev => prev.filter(c => c.code !== code));
    if (selectedCourse && selectedCourse.code === code) {
      setSelectedCourse(null);
      setSelectedSection('');
    }

    // remove registrations for this course
    const regs = loadRegistrations().filter(r => r.courseId !== code);
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(regs));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("course_registrations_updated"));
    } catch (e) {
      console.error("failed removing registrations on deleteCourse", e);
    }
  }

  if (loading) return <div className="text-center py-5">Loading...</div>;

  // Build grouped view...
  const grouped = [];
  const deptMap = {};
  (departments || []).forEach(d => {
    deptMap[d.id] = { id: d.id, name: d.name, code: d.code, courses: [] };
  });
  const unassigned = { id: '__unassigned', name: 'Unassigned', code: '', courses: [] };

  (courses || []).forEach(c => {
    if (c.deptId && deptMap[c.deptId]) {
      deptMap[c.deptId].courses.push(c);
    } else {
      unassigned.courses.push(c);
    }
  });

  (departments || []).forEach(d => grouped.push(deptMap[d.id]));
  if (unassigned.courses.length) grouped.push(unassigned);

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Course Management</h3>
      {undoInfo && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mt-2">
          <span>
            Student "{undoInfo.student.name}" removed from section {undoInfo.section} of {undoInfo.code}.
          </span>
          <button className="btn btn-sm btn-outline-primary ms-3" onClick={undoDrop}>Undo</button>
        </div>
      )}
      <div className="card mt-3">
        <div className="card-body">
          <div className="row">
            {/* Course list */}
            <div className="col-md-4 mb-2">
              <h6>Courses (grouped by department)</h6>
              <div className="mb-2">
                {grouped.map(dep => (
                  <div key={dep.id} className="mb-3">
                    <div className="small text-muted mb-1"><b>{dep.name || 'No department'}</b> {dep.code ? `(${dep.code})` : ''}</div>
                    <div className="list-group">
                      {(dep.courses || []).map(c => (
                        <div key={c.code} className="mb-1 d-flex align-items-center">
                          <button className={`list-group-item list-group-item-action flex-grow-1 ${selectedCourse && selectedCourse.code === c.code && selectedCourse.deptId === c.deptId ? 'active' : ''}`}
                            onClick={() => selectCourse(c)}
                          >
                            {c.code} — {c.name}
                          </button>
                          <button className="btn btn-outline-danger btn-sm ms-2" onClick={() => deleteCourse(c.code)}>Delete</button>
                        </div>
                      ))}
                      {(!dep.courses || dep.courses.length === 0) && (
                        <div className="text-muted small ps-2">No courses</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* New Course Inputs */}
              <div className="mt-2">
                <div className="mb-2">
                  <input type="text" className="form-control" placeholder="New course code" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} />
                </div>
                <div className="mb-2">
                  <input type="text" className="form-control" placeholder="New course name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
                </div>
                <div className="mb-2 small text-muted">New courses created here are "Unassigned".</div>
                <button className="btn btn-success" onClick={addCourse}>Add Course</button>
              </div>
            </div>

            {/* Course details & student assignment */}
            <div className="col-md-8">
              {selectedCourse ? (
                <>
                  <h6>Sections of {selectedCourse.code} — {selectedCourse.name} {selectedCourse.deptName ? ` (Dept: ${selectedCourse.deptName})` : ''}</h6>

                  {(selectedCourse.sections || []).map((sec) => (
                    <div key={sec.section} className="mb-2 d-flex align-items-center">
                      <button className={`btn btn-outline-primary btn-sm me-1 ${selectedSection === sec.section ? 'active' : ''}`} style={{minWidth: 65}} onClick={() => selectSection(sec.section)}>{sec.section}</button>
                      <button className="btn btn-outline-danger btn-sm ms-2" onClick={() => deleteSection(selectedCourse.code, sec.section)}>Delete Section</button>
                    </div>
                  ))}

                  <div className="mb-2 d-flex align-items-center">
                    <input type="text" className="form-control w-auto mx-2" placeholder="New section" value={newSection} onChange={e => setNewSection(e.target.value)} style={{maxWidth: 120}} />
                    <button className="btn btn-primary btn-sm" onClick={addSection}>Add Section</button>
                  </div>

                  {/* Students for selected section */}
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr><th>Roll</th><th>Name</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {(selectedCourse.sections.find(sec => sec.section === selectedSection)?.students || []).map((s, idx) => (
                          <tr key={s.roll + idx}>
                            {editStudentIdx === idx ? (
                              <>
                                <td><input className="form-control form-control-sm" value={editStudentRoll} onChange={e=>setEditStudentRoll(e.target.value)} placeholder="Roll" /></td>
                                <td><input className="form-control form-control-sm" value={editStudentName} onChange={e=>setEditStudentName(e.target.value)} placeholder="Name" /></td>
                                <td><button className="btn btn-sm btn-success me-2" onClick={() => saveEditStudent(idx)}>Save</button><button className="btn btn-sm btn-secondary" onClick={() => setEditStudentIdx(-1)}>Cancel</button></td>
                              </>
                            ) : (
                              <>
                                <td>{s.roll}</td>
                                <td>{s.name}</td>
                                <td><button className="btn btn-sm btn-secondary me-2" onClick={() => startEditStudent(idx, s)}>Edit</button><button className="btn btn-sm btn-danger" onClick={() => doDrop(selectedCourse.code, selectedSection, s, idx)}>Drop</button></td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Assign student form */}
                  <div className="d-flex align-items-center mt-3">
                    <input className="form-control" style={{maxWidth:180}} placeholder="Student roll to assign" value={assignRoll} onChange={e => setAssignRoll(e.target.value)} />
                    <button className="btn btn-primary m-2" onClick={doAssign}>Assign Student</button>
                  </div>
                </>
              ) : <div className="text-muted">Select a course to manage sections and students</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}