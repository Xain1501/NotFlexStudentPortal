import React, { useEffect, useState } from "react";
import "./adminhome.css";

const DEPTS_KEY = "departments_store";
const STUDENTS_KEY = "students_store";
const FACULTY_KEY = "faculty_store";
const PAGE_SIZE = 10;

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
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  const initials = words.map(w => w[0]).slice(0, 4).join("").toUpperCase();
  return initials;
}

// Build department map from given arrays of member objects (students + faculty)
function buildDeptMapFromMembers(studentArr, facultyArr) {
  const seen = {};
  const addName = (raw) => {
    const name = (raw || "").toString().trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!seen[key]) {
      const idCandidate = makeIdFromName(name);
      let id = idCandidate;
      let counter = 1;
      while (Object.values(seen).some(d => d.id === id)) {
        id = `${idCandidate}${counter++}`;
      }
      seen[key] = { id, name, code: id, description: "" };
    }
  };

  (studentArr || []).forEach(s => {
    const free = s.department ?? s.Department ?? "";
    addName(free);
  });
  (facultyArr || []).forEach(f => {
    const free = f.department ?? f.Department ?? "";
    addName(free);
  });

  return Object.values(seen);
}

// Recovery: create departments and reassign members to new ids
function recoverDepartmentsFromMembers() {
  const students = loadStudents();
  const faculty = loadFaculty();
  const candidateDepts = buildDeptMapFromMembers(students, faculty);
  if (!candidateDepts.length) return { created: [], updatedStudents: 0, updatedFaculty: 0 };

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

  const nameToId = {};
  toSave.forEach(d => { nameToId[normalizeKey(d.name)] = d.id; nameToId[normalizeKey(d.code || "")] = d.id; });

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

// Deactivate members that reference given deptId or deptName (set status = "Inactive")
function deactivateMembers(deptId, deptName) {
  try {
    const students = loadStudents();
    const updatedStudents = (students || []).map(s => {
      if (normalizeKey(s.departmentId) === normalizeKey(deptId) ||
          normalizeKey(s.department) === normalizeKey(deptName) ||
          normalizeKey(s.Department) === normalizeKey(deptName)) {
        return { ...s, status: "Inactive" };
      }
      return s;
    });
    saveStudents(updatedStudents);
  } catch (e) {
    console.error("deactivateMembers students error", e);
  }

  try {
    const faculty = loadFaculty();
    const updatedFaculty = (faculty || []).map(f => {
      if (normalizeKey(f.departmentId) === normalizeKey(deptId) ||
          normalizeKey(f.department) === normalizeKey(deptName) ||
          normalizeKey(f.Department) === normalizeKey(deptName)) {
        return { ...f, status: "Inactive" };
      }
      return f;
    });
    saveFaculty(updatedFaculty);
  } catch (e) {
    console.error("deactivateMembers faculty error", e);
  }
}

// Reactivate members that reference given deptId or deptName (set status = "Active")
function reactivateMembers(deptId, deptName) {
  try {
    const students = loadStudents();
    const updatedStudents = (students || []).map(s => {
      if (normalizeKey(s.departmentId) === normalizeKey(deptId) ||
          normalizeKey(s.department) === normalizeKey(deptName) ||
          normalizeKey(s.Department) === normalizeKey(deptName)) {
        return { ...s, status: "Active" };
      }
      return s;
    });
    saveStudents(updatedStudents);
  } catch (e) {
    console.error("reactivateMembers students error", e);
  }

  try {
    const faculty = loadFaculty();
    const updatedFaculty = (faculty || []).map(f => {
      if (normalizeKey(f.departmentId) === normalizeKey(deptId) ||
          normalizeKey(f.department) === normalizeKey(deptName) ||
          normalizeKey(f.Department) === normalizeKey(deptName)) {
        return { ...f, status: "Active" };
      }
      return f;
    });
    saveFaculty(updatedFaculty);
  } catch (e) {
    console.error("reactivateMembers faculty error", e);
  }
}

export default function ManageDepartments() {
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", code: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [recoverLog, setRecoverLog] = useState(null);

  // UI state: tab and paging
  const [activeTab, setActiveTab] = useState("active"); // "active" | "inactive"
  const [pageActive, setPageActive] = useState(1);
  const [pageInactive, setPageInactive] = useState(1);

  useEffect(() => {
    setDepts(loadDepts());
    const handler = () => setDepts(loadDepts());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
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
    const payload = { id, name, code: (form.code || "").trim(), description: (form.description || "").trim(), status: "Active" };

    const existing = loadDepts();
    let newList;
    if (editingId) {
      const prev = existing.find(d => d.id === editingId);
      newList = existing.map(d => (d.id === editingId ? { ...d, ...payload } : d));
      saveDepts(newList);
      setDepts(newList);

      // If previously inactive and now active -> reactivate members
      if (prev && (prev.status || "Active") !== "Active" && (payload.status || "Active") === "Active") {
        reactivateMembers(payload.id, payload.name);
      }
    } else {
      if (existing.some(d => normalizeKey(d.id) === normalizeKey(payload.id) || normalizeKey(d.name) === normalizeKey(payload.name))) {
        return alert("Department with same id or name already exists.");
      }
      newList = [{ ...payload }, ...existing];
      saveDepts(newList);
      setDepts(newList);

      // Newly created department -> reactivate members that reference this dept id/name
      reactivateMembers(payload.id, payload.name);
    }

    setForm({ id: "", name: "", code: "", description: "" });
    setEditingId(null);
  }

  function handleEdit(d) {
    setEditingId(d.id);
    setForm({ id: d.id, name: d.name, code: d.code || "", description: d.description || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Archive/Deactivate department: mark dept.status = "Inactive" but keep department record.
  // Also mark all members referencing this dept as Inactive (but keep their department assignment).
  function handleArchive(d) {
    if (!window.confirm(`Archive department "${d.name}"? This will mark all students and faculty in this department as Inactive. The department record will remain (status = Inactive).`)) return;

    // mark members inactive (keep their dept assignment)
    deactivateMembers(d.id, d.name);

    // update dept status to Inactive (don't remove)
    const existing = loadDepts();
    const newList = existing.map(item => item.id === d.id ? { ...item, status: "Inactive" } : item);
    saveDepts(newList);
    setDepts(newList);

    alert(`Department "${d.name}" archived. Affected students and faculty have been marked Inactive.`);
  }

  // Restore department: set status = "Active" and reactivate members that belong to it
  function handleRestore(d) {
    if (!window.confirm(`Restore department "${d.name}" to Active? Members that reference this department will be reactivated.`)) return;
    const existing = loadDepts();
    const newList = existing.map(item => item.id === d.id ? { ...item, status: "Active" } : item);
    saveDepts(newList);
    setDepts(newList);

    // Reactivate members that reference this dept
    reactivateMembers(d.id, d.name);

    alert(`Department "${d.name}" restored to Active and its members reactivated.`);
  }

  // Permanently delete department record (optional, hidden behind strict confirmation)
  function handleDeletePermanent(d) {
    if (!window.confirm(`Permanently delete department "${d.name}"? This will remove the department record. Members will keep their department assignment but the referenced dept id may no longer exist.`)) return;
    const remaining = loadDepts().filter(x => normalizeKey(x.id) !== normalizeKey(d.id));
    saveDepts(remaining);
    setDepts(remaining);
    alert(`Department "${d.name}" permanently deleted.`);
  }

  function runRecovery() {
    if (!window.confirm("Recover departments from existing students and faculty? This will create department records for each distinct free-text department name and assign matching members.")) return;
    const res = recoverDepartmentsFromMembers();
    setRecoverLog(res);
    setDepts(loadDepts());
    alert(`Recovery complete. Created ${res.created.length} departments. Updated ${res.updatedStudents} students and ${res.updatedFaculty} faculty.`);
  }

  // Paging helpers
  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  const activeDepts = (depts || []).filter(d => (d.status || "Active") === "Active");
  const inactiveDepts = (depts || []).filter(d => (d.status || "Active") !== "Active");

  const totalActivePages = Math.max(1, Math.ceil(activeDepts.length / PAGE_SIZE));
  const totalInactivePages = Math.max(1, Math.ceil(inactiveDepts.length / PAGE_SIZE));

  const visibleActive = paginate(activeDepts, pageActive);
  const visibleInactive = paginate(inactiveDepts, pageInactive);

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
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">Departments</h5>
            <div>
              <button className={`btn btn-sm ${activeTab === "active" ? "btn-primary" : "btn-outline-primary"} me-2`} onClick={() => setActiveTab("active")}>Active ({activeDepts.length})</button>
              <button className={`btn btn-sm ${activeTab === "inactive" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveTab("inactive")}>Inactive ({inactiveDepts.length})</button>
            </div>
          </div>

          {activeTab === "active" && (
            <>
              {activeDepts.length ? (
                <>
                  <table className="table table-bordered">
                    <thead>
                      <tr><th>Code / ID</th><th>Name</th><th>Description</th><th>Status</th><th style={{width:220}}>Actions</th></tr>
                    </thead>
                    <tbody>
                      {visibleActive.map(d => {
                        const students = loadStudents();
                        const faculty = loadFaculty();
                        const studentCount = (students || []).filter(s => normalizeKey(s.departmentId) === normalizeKey(d.id) || normalizeKey(s.department) === normalizeKey(d.name) || normalizeKey(s.Department) === normalizeKey(d.name)).length;
                        const facultyCount = (faculty || []).filter(f => normalizeKey(f.departmentId) === normalizeKey(d.id) || normalizeKey(f.department) === normalizeKey(d.name) || normalizeKey(f.Department) === normalizeKey(d.name)).length;
                        return (
                          <tr key={d.id}>
                            <td>{d.code || d.id}</td>
                            <td>{d.name}</td>
                            <td>{d.description}</td>
                            <td>{d.status || "Active"}</td>
                            <td>
                              <div className="d-flex">
                                <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(d)}>Edit</button>
                                <button type="button" className="btn btn-sm btn-outline-warning me-2" onClick={() => handleArchive(d)}>Archive (mark members Inactive)</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePermanent(d)}>Delete Permanently</button>
                              </div>
                              <div className="mt-2 text-muted small">Students: {studentCount} • Faculty: {facultyCount}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {totalActivePages > 1 && (
                    <div className="d-flex align-items-center gap-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageActive(p => Math.max(1, p - 1))}>Prev</button>
                      <div className="small text-muted">Page {pageActive} of {totalActivePages}</div>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageActive(p => Math.min(totalActivePages, p + 1))}>Next</button>
                    </div>
                  )}
                </>
              ) : <p>No active departments found.</p>}
            </>
          )}

          {activeTab === "inactive" && (
            <>
              {inactiveDepts.length ? (
                <>
                  <table className="table table-bordered">
                    <thead>
                      <tr><th>Code / ID</th><th>Name</th><th>Description</th><th>Status</th><th style={{width:220}}>Actions</th></tr>
                    </thead>
                    <tbody>
                      {visibleInactive.map(d => {
                        const students = loadStudents();
                        const faculty = loadFaculty();
                        const studentCount = (students || []).filter(s => normalizeKey(s.departmentId) === normalizeKey(d.id) || normalizeKey(s.department) === normalizeKey(d.name) || normalizeKey(s.Department) === normalizeKey(d.name)).length;
                        const facultyCount = (faculty || []).filter(f => normalizeKey(f.departmentId) === normalizeKey(d.id) || normalizeKey(f.department) === normalizeKey(d.name) || normalizeKey(f.Department) === normalizeKey(d.name)).length;
                        return (
                          <tr key={d.id}>
                            <td>{d.code || d.id}</td>
                            <td>{d.name}</td>
                            <td>{d.description}</td>
                            <td>{d.status || "Inactive"}</td>
                            <td>
                              <div className="d-flex">
                                <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(d)}>Edit</button>
                                <button type="button" className="btn btn-sm btn-outline-success me-2" onClick={() => handleRestore(d)}>Restore</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePermanent(d)}>Delete Permanently</button>
                              </div>
                              <div className="mt-2 text-muted small">Students: {studentCount} • Faculty: {facultyCount}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {totalInactivePages > 1 && (
                    <div className="d-flex align-items-center gap-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageInactive(p => Math.max(1, p - 1))}>Prev</button>
                      <div className="small text-muted">Page {pageInactive} of {totalInactivePages}</div>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageInactive(p => Math.min(totalInactivePages, p + 1))}>Next</button>
                    </div>
                  )}
                </>
              ) : <p>No inactive departments found.</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}