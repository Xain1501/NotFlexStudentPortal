import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

const FACULTY_KEY = "faculty_store";
const DEPTS_KEY = "departments_store";
const STUDENTS_KEY = "students_store";
const PAGE_SIZE = 10;

function loadFacultyRaw() {
  try { const raw = localStorage.getItem(FACULTY_KEY); return raw ? JSON.parse(raw) : []; } catch(e) { console.error("loadFacultyRaw parse error", e); return []; }
}
function saveFaculty(list) { try { localStorage.setItem(FACULTY_KEY, JSON.stringify(list)); window.dispatchEvent(new Event("storage")); } catch(e) { console.error("saveFaculty write error", e); } }
function loadDepts() {
  try { const raw = localStorage.getItem(DEPTS_KEY); return raw ? JSON.parse(raw) : []; } catch(e) { console.error("loadDepts parse error", e); return []; }
}
function saveDepts(list) { try { localStorage.setItem(DEPTS_KEY, JSON.stringify(list)); window.dispatchEvent(new Event("storage")); } catch(e) { console.error("saveDepts write error", e); } }
function loadStudentsRaw() {
  try { const raw = localStorage.getItem(STUDENTS_KEY); return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
}

function normalize(v) { return (v == null) ? "" : String(v).trim(); }
function normalizeKey(v) { return normalize(v).toLowerCase(); }
function makeIdFromName(name) {
  const parts = (name||"").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts.map(p => p[0]).slice(0,4).join("").toUpperCase();
}

function buildDepartmentsFromNames(names, existing = []) {
  const existingIds = new Set((existing || []).map(d => normalizeKey(d.id)));
  const existingNames = new Set((existing || []).map(d => normalizeKey(d.name)));
  const out = existing.slice();
  names.forEach(rawName => {
    const name = normalize(rawName);
    if (!name) return;
    if (existingNames.has(normalizeKey(name))) return;
    const candidate = makeIdFromName(name);
    let id = candidate;
    let counter = 1;
    while (existingIds.has(normalizeKey(id)) || out.some(d => normalizeKey(d.id) === normalizeKey(id))) {
      id = `${candidate}${counter++}`;
    }
    out.push({ id, name, code: id, description: "" });
    existingIds.add(normalizeKey(id));
    existingNames.add(normalizeKey(name));
  });
  return out;
}

function buildNameToIdMap(depts) {
  const m = {};
  (depts || []).forEach(d => {
    if (!d) return;
    if (d.name) m[normalizeKey(d.name)] = d.id;
    if (d.code) m[normalizeKey(d.code)] = d.id;
    if (d.id) m[normalizeKey(d.id)] = d.id;
  });
  return m;
}

export default function ManageFaculty() {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", departmentId: "", employeeId: "" });
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [pageByDept, setPageByDept] = useState({});
  const [pageUnassigned, setPageUnassigned] = useState(1);

  function initLoadAndNormalize() {
    let depts = loadDepts() || [];
    const rawFaculty = loadFacultyRaw() || [];
    const rawStudents = loadStudentsRaw() || [];

    // If no departments exist but there are free-text names on faculty/students, recover departments
    if ((!depts || depts.length === 0) && ((rawFaculty && rawFaculty.length) || (rawStudents && rawStudents.length))) {
      const freeNamesSet = new Set();
      (rawFaculty || []).forEach(f => {
        const free = normalize(f.department || f.Department || "");
        if (free) freeNamesSet.add(free);
      });
      (rawStudents || []).forEach(s => {
        const free = normalize(s.department || s.Department || "");
        if (free) freeNamesSet.add(free);
      });
      const freeNames = Array.from(freeNamesSet);
      if (freeNames.length) {
        const recovered = buildDepartmentsFromNames(freeNames, depts);
        saveDepts(recovered);
        depts = recovered;
      }
    }

    setDepartments(depts);

    // Build map to match department id/name/code -> id
    const nameToId = buildNameToIdMap(depts);

    // Normalize faculty set departmentId where possible
    let updated = 0;
    const normalized = (rawFaculty || []).map(f => {
      if (f.departmentId && nameToId[normalizeKey(f.departmentId)]) {
        return { ...f, departmentId: nameToId[normalizeKey(f.departmentId)] };
      }
      const free = normalize(f.department || f.Department || "");
      if (free && nameToId[normalizeKey(free)]) {
        updated++;
        return { ...f, departmentId: nameToId[normalizeKey(free)], department: undefined, Department: undefined };
      }
      return { ...f, departmentId: f.departmentId || "" };
    });

    if (updated || JSON.stringify(normalized) !== JSON.stringify(rawFaculty)) {
      saveFaculty(normalized);
    }

    setFaculty(normalized);
  }

  useEffect(() => {
    initLoadAndNormalize();
    const handler = () => initLoadAndNormalize();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Grouping: preserve department order from departments array where possible
  const { groups, deptOrder, unassigned } = useMemo(() => {
    const map = {};
    const seenOrder = [];
    (faculty || []).forEach(f => {
      const deptId = f.departmentId || "";
      if (!deptId) return;
      if (!map[deptId]) { map[deptId] = []; seenOrder.push(deptId); }
      map[deptId].push(f);
    });

    const deptIdsInOrder = (departments || []).map(d => d.id).filter(id => seenOrder.includes(id));
    seenOrder.forEach(id => { if (!deptIdsInOrder.includes(id)) deptIdsInOrder.push(id); });

    Object.keys(map).forEach(k => map[k].sort((a,b) => (a.name||"").localeCompare(b.name||"")));

    const unassignedList = (faculty || []).filter(f => !f.departmentId);

    return { groups: map, deptOrder: deptIdsInOrder, unassigned: unassignedList };
  }, [faculty, departments]);

  function deptName(id) {
    const d = (departments || []).find(x => x && x.id === id);
    return d ? d.name : id;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if (!form.name.trim()) return alert("Name is required.");
    if (!form.departmentId) return alert("Please select a Department from Manage Departments.");
    const payload = { ...form, id, status: form.status || "Active" };
    const newList = editingId ? faculty.map(f => f.id === editingId ? { ...f, ...payload } : f) : [{ ...payload }, ...faculty];
    saveFaculty(newList);
    setFaculty(newList);
    setForm({ id: "", name: "", departmentId: "", employeeId: "" });
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({ id: item.id, name: item.name, departmentId: item.departmentId || "", employeeId: item.employeeId, status: item.status || "Active" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this faculty member?")) return;
    const newList = faculty.filter(f => f.id !== id);
    saveFaculty(newList);
    setFaculty(newList);
  }

  function toggleCollapse(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function setDeptPage(deptId, page) {
    setPageByDept(prev => ({ ...prev, [deptId]: page }));
  }

  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Faculty</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-5 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Faculty name" />
          </div>
          <div className="col-md-3 mb-2">
            <input name="employeeId" value={form.employeeId} onChange={handleChange} className="form-control" placeholder="Employee ID" />
          </div>
          <div className="col-md-3 mb-2">
            <div className="d-flex">
              <select name="departmentId" value={form.departmentId} onChange={handleChange} className="form-control">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ""}</option>)}
              </select>
            </div>
          </div>
          <div className="col-md-1 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Faculty Members</h5>

          {unassigned.length > 0 && (
            <div className="mb-4">
              <div className="mb-2"><strong>Unassigned Faculty</strong> <small className="text-muted">({unassigned.length})</small></div>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead><tr><th>Name</th><th>Employee ID</th><th>Department</th><th>Actions</th></tr></thead>
                  <tbody>
                    {paginate(unassigned, pageUnassigned).map(f => (
                      <tr key={f.id}>
                        <td>{f.name}</td>
                        <td>{f.employeeId}</td>
                        <td></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(f)}>Assign Dept</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Math.ceil(unassigned.length / PAGE_SIZE) > 1 && (
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageUnassigned(p => Math.max(1, p - 1))}>Prev</button>
                  <div className="small text-muted">Page {pageUnassigned} of {Math.ceil(unassigned.length / PAGE_SIZE)}</div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setPageUnassigned(p => Math.min(Math.ceil(unassigned.length / PAGE_SIZE), p + 1))}>Next</button>
                </div>
              )}
            </div>
          )}

          {deptOrder.map(deptId => {
            const items = groups[deptId] || [];
            const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
            const current = pageByDept[deptId] || 1;
            const visible = paginate(items, current);

            return (
              <div key={deptId} className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div><strong>Department: {deptName(deptId)}</strong> <small className="text-muted">({items.length})</small></div>
                  <div>
                    <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => toggleCollapse(deptId)}>
                      {collapsed[deptId] ? "Expand" : "Collapse"}
                    </button>
                  </div>
                </div>

                {!collapsed[deptId] && (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead><tr><th>Name</th><th>Employee ID</th><th>Department</th><th>status</th><th style={{width:140}}>Actions</th></tr></thead>
                      <tbody>
                        {visible.map(f => (
                          <tr key={f.id}>
                            <td>{f.name}</td>
                            <td>{f.employeeId}</td>
                            <td>{deptName(f.departmentId)}</td>
                            <td>{f.status || "Active"}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(f)}>Edit</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pages > 1 && (
                      <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeptPage(deptId, Math.max(1, current - 1))}>Prev</button>
                        <div className="small text-muted">Page {current} of {pages}</div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeptPage(deptId, Math.min(pages, current + 1))}>Next</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </main>
  );
}