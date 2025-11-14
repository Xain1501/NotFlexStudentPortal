import React, { useEffect, useState } from "react";
import "./adminhome.css";

const DEPTS_KEY = "departments_store";
const STUDENTS_KEY = "students_store";
const FACULTY_KEY = "faculty_store";

// Storage helpers
function loadDepts() {
  try { const raw = localStorage.getItem(DEPTS_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { console.error(e); return []; }
}
function saveDepts(list) {
  try {
    localStorage.setItem(DEPTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("departmentsUpdated"));
  } catch (e) { console.error(e); }
}
function loadStudents() { try { const raw = localStorage.getItem(STUDENTS_KEY); return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; } }
function saveStudents(list) { try { localStorage.setItem(STUDENTS_KEY, JSON.stringify(list)); window.dispatchEvent(new Event("storage")); } catch(e){ console.error(e); } }
function loadFaculty() { try { const raw = localStorage.getItem(FACULTY_KEY); return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; } }
function saveFaculty(list) { try { localStorage.setItem(FACULTY_KEY, JSON.stringify(list)); window.dispatchEvent(new Event("storage")); } catch(e){ console.error(e); } }

// Normalization helpers
function normalizeKey(v) { if (v == null) return ""; return String(v).trim().toLowerCase(); }
function makeIdFromName(name) {
  if (!name) return Date.now().toString();
  // create short code: take uppercase initials or first 4 letters
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  const initials = words.map(w => w[0]).slice(0, 4).join("").toUpperCase();
  return initials;
}

// Build department map from given arrays of member objects (students + faculty)
function buildDeptMapFromMembers(studentArr, facultyArr) {
  const seen = {}; // normalized name -> dept object
  const addName = (raw) => {
    const name = (raw || "").toString().trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!seen[key]) {
      const idCandidate = makeIdFromName(name);
      let id = idCandidate;
      // avoid collisions by appending counter if needed
      let counter = 1;
      while (Object.values(seen).some(d => d.id === id)) {
        id = `${idCandidate}${counter++}`;
      }
      seen[key] = { id, name, code: id, description: "" };
    }
  };

  (studentArr || []).forEach(s => {
    // accept free-text department keys
    const free = s.department ?? s.Department ?? "";
    addName(free);
  });
  (facultyArr || []).forEach(f => {
    const free = f.department ?? f.Department ?? "";
    addName(free);
  });

  // return array of departments
  return Object.values(seen);
}

// Recovery: create departments and reassign members to new ids
function recoverDepartmentsFromMembers() {
  const students = loadStudents();
  const faculty = loadFaculty();
  const candidateDepts = buildDeptMapFromMembers(students, faculty);
  if (!candidateDepts.length) return { created: [], updatedStudents: 0, updatedFaculty: 0 };

  // persist new depts
  // if there already are departments, merge (preserve existing ids/names)
  const existing = loadDepts();
  const existingByName = {};
  existing.forEach(d => { existingByName[normalizeKey(d.name)] = d; });

  const toSave = existing.slice();
  candidateDepts.forEach(cd => {
    if (!existingByName[normalizeKey(cd.name)]) {
      toSave.push(cd);
    }
  });
  saveDepts(toSave);

  // build name->id map for reassignment
  const nameToId = {};
  toSave.forEach(d => { nameToId[normalizeKey(d.name)] = d.id; nameToId[normalizeKey(d.code || "")] = d.id; });

  // update students/faculty to set departmentId where free-text matched
  let updatedStudents = 0, updatedFaculty = 0;
  const updatedStudentsArr = (students || []).map(s => {
    if (s.departmentId && toSave.some(d => d.id === s.departmentId)) return s;
    const free = (s.department || s.Department || "").toString().trim();
    if (free && nameToId[free.toLowerCase()]) {
      updatedStudents++;
      return { ...s, departmentId: nameToId[free.toLowerCase()], department: undefined, Department: undefined };
    }
    return s;
  });
  const updatedFacultyArr = (faculty || []).map(f => {
    if (f.departmentId && toSave.some(d => d.id === f.departmentId)) return f;
    const free = (f.department || f.Department || "").toString().trim();
    if (free && nameToId[free.toLowerCase()]) {
      updatedFaculty++;
      return { ...f, departmentId: nameToId[free.toLowerCase()], department: undefined, Department: undefined };
    }
    return f;
  });

  saveStudents(updatedStudentsArr);
  saveFaculty(updatedFacultyArr);

  return { created: candidateDepts, updatedStudents, updatedFaculty };
}

export default function ManageDepartments() {
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", code: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [recoverLog, setRecoverLog] = useState(null);

  useEffect(() => {
    const raw = loadDepts();
    if (!raw.length) {
      // show empty and allow admin to create departments manually or recover
      setDepts([]);
      return;
    }
    setDepts(raw);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSave(e) {
    e && e.preventDefault();
    const name = (form.name || "").trim();
    if (!name) return alert("Department name is required.");
    const id = (form.code || form.name || "").toString().trim() || Date.now().toString();
    const payload = { id, name, code: (form.code || "").trim(), description: (form.description || "").trim() };

    const existing = loadDepts();
    let newList;
    if (editingId) {
      newList = existing.map(d => (d.id === editingId ? { ...d, ...payload } : d));
    } else {
      if (existing.some(d => normalizeKey(d.id) === normalizeKey(payload.id) || normalizeKey(d.name) === normalizeKey(payload.name))) {
        return alert("Department with same id or name already exists.");
      }
      newList = [{ ...payload }, ...existing];
    }
    saveDepts(newList);
    setDepts(newList);
    setForm({ id: "", name: "", code: "", description: "" });
    setEditingId(null);
  }

  function handleEdit(d) {
    setEditingId(d.id);
    setForm({ id: d.id, name: d.name, code: d.code || "", description: d.description || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeleteStart(d) {
    // reuse deletion flow from your existing code (you already had reassign/clear UI)
    // For brevity assume user will use existing Delete button that uses reassign UI implemented earlier.
    // Here we provide recover only.
    if (!window.confirm(`Delete department "${d.name}"? Use Departments page reassign flow if members exist.`)) return;
    const remaining = loadDepts().filter(x => normalizeKey(x.id) !== normalizeKey(d.id));
    saveDepts(remaining);
    setDepts(remaining);
    alert("Department removed (if it had references they may become unassigned).");
  }

  function runRecovery() {
    if (!window.confirm("Recover departments from existing students and faculty? This will create department records for each distinct free-text department name and assign matching members.")) return;
    const res = recoverDepartmentsFromMembers();
    setRecoverLog(res);
    setDepts(loadDepts());
    alert(`Recovery complete. Created ${res.created.length} departments. Updated ${res.updatedStudents} students and ${res.updatedFaculty} faculty.`);
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Departments</h2>

      <form onSubmit={handleSave} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-2 mb-2">
            <input name="code" value={form.code} onChange={handleChange} className="form-control" placeholder="ID / Code (e.g. CS)" />
          </div>
          <div className="col-md-4 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Department name " />
          </div>
          <div className="col-md-4 mb-2">
            <input name="description" value={form.description} onChange={handleChange} className="form-control" placeholder="Short description (optional)" />
          </div>
          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Create"}</button>
          </div>
        </div>
      </form>

      <div className="mb-3">
        {recoverLog && (
          <div className="mt-2 small text-muted">
            Created: {recoverLog.created.length} • Students updated: {recoverLog.updatedStudents} • Faculty updated: {recoverLog.updatedFaculty}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <h5>Departments</h5>
          {depts.length ? (
            <table className="table table-bordered">
              <thead>
                <tr><th>Code / ID</th><th>Name</th><th>Description</th><th style={{width:160}}>Actions</th></tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  // count references for display (not used to block in this simplified view)
                  const students = loadStudents();
                  const faculty = loadFaculty();
                  const studentCount = (students || []).filter(s => normalizeKey(s.departmentId) === normalizeKey(d.id) || normalizeKey(s.department) === normalizeKey(d.id) || normalizeKey(s.Department) === normalizeKey(d.id)).length;
                  const facultyCount = (faculty || []).filter(f => normalizeKey(f.departmentId) === normalizeKey(d.id) || normalizeKey(f.department) === normalizeKey(d.id) || normalizeKey(f.Department) === normalizeKey(d.id)).length;
                  return (
                    <tr key={d.id}>
                      <td>{d.code || d.id}</td>
                      <td>{d.name}</td>
                      <td>{d.description}</td>
                      <td>
                        <div className="d-flex">
                          <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(d)}>Edit</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteStart(d)}>Delete</button>
                        </div>
                        <div className="mt-2 text-muted small">
                          Students: {studentCount} • Faculty: {facultyCount}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <p>No departments found. Use "Recover departments from students/faculty" or create departments above.</p>}
        </div>
      </div>
    </main>
  );
}