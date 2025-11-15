import React, { useEffect, useState } from 'react';
import { fetchCourses, fetchStudents, dropStudentFromCourse, assignStudentToCourse } from '../Admin/api';
import "./adminhome.css";

/**
 * CourseManagement page
 * - Select a course, view enrolled students, drop a student or assign a new student
 */
export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignRoll, setAssignRoll] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (typeof fetchCourses === 'function') setCourses(await fetchCourses());
        else setCourses([
          { id: 'CS301-A', code: 'CS301', name: 'Data Structures', section: 'A', students: [{ roll: 'S1', name: 'Ali' }, { roll: 'S2', name: 'Sara' }] },
          { id: 'CS302-B', code: 'CS302', name: 'Operating Systems', section: 'B', students: [{ roll: 'S3', name: 'Hassan' }] }
        ]);
        if (typeof fetchStudents === 'function') setStudents(await fetchStudents());
        else setStudents([
          { roll: 'S1', name: 'Ali' }, { roll: 'S2', name: 'Sara' }, { roll: 'S3', name: 'Hassan' }, { roll: 'S4', name: 'Zara' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function doDrop(courseId, roll) {
    if (!window.confirm(`Drop student ${roll} from course?`)) return;
    try {
      if (typeof dropStudentFromCourse === 'function') await dropStudentFromCourse({ courseId, roll });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, students: c.students.filter(s => s.roll !== roll) } : c));
    } catch (err) {
      console.error(err);
      alert('Failed to drop student (demo)');
    }
  }

  async function doAssign() {
    if (!assignRoll || !selectedCourse) return alert('Select a course and enter student roll');
    try {
      if (typeof assignStudentToCourse === 'function') await assignStudentToCourse({ courseId: selectedCourse.id, roll: assignRoll });
      // update local copy (demo)
      const student = students.find(s => s.roll === assignRoll) || { roll: assignRoll, name: assignRoll };
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, students: [...(c.students||[]), student] } : c));
      setAssignRoll('');
    } catch (err) {
      console.error(err);
      alert('Assign failed (demo)');
    }
  }

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Course Management</h3>

      <div className="card mt-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <h6>Courses</h6>
              <div className="list-group">
                {courses.map(c => (
                  <button key={c.id} className={`list-group-item list-group-item-action ${selectedCourse && selectedCourse.id === c.id ? 'active' : ''}`} onClick={() => setSelectedCourse(c)}>
                    {c.code} — {c.name} (Sec {c.section})
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-8">
              {selectedCourse ? (
                <>
                  <h6>Students in {selectedCourse.code} (Sec {selectedCourse.section})</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead><tr><th>Roll</th><th>Name</th><th>Action</th></tr></thead>
                      <tbody>
                        {(selectedCourse.students || []).map(s => (
                          <tr key={s.roll}>
                            <td>{s.roll}</td>
                            <td>{s.name}</td>
                            <td><button className="btn btn-sm btn-danger" onClick={() => doDrop(selectedCourse.id, s.roll)}>Drop</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex align-items-center mt-3">
                    <input className="form-control mr-2" placeholder="Student roll to assign" value={assignRoll} onChange={e => setAssignRoll(e.target.value)} />
                    <button className="btn btn-primary m-3" onClick={doAssign}>Assign Student</button>
                  </div>
                </>
              ) : <div className="text-muted">Select a course to manage students</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}