import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

const STUDENTS_KEY = "students_store";
const DEPTS_KEY = "departments_store";

function loadStudentsRaw() {
  try { const raw = localStorage.getItem(STUDENTS_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { console.error("loadStudentsRaw parse error", e); return []; }
}
function saveStudents(list) { try { localStorage.setItem(STUDENTS_KEY, JSON.stringify(list)); } catch(e){ console.error("saveStudents write error", e); } }
function loadDepts() {
  try { const raw = localStorage.getItem(DEPTS_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { console.error("loadDepts parse error", e); return []; }
}
function saveDepts(list) { try { localStorage.setItem(DEPTS_KEY, JSON.stringify(list)); } catch(e){ console.error("saveDepts write error", e); } }

function normalize(v){ return (v == null) ? "" : String(v).trim(); }
function normalizeKey(v){ return normalize(v).toLowerCase(); }
function makeIdFromName(name){
  const parts = (name||"").trim().split(/\s+/);
  if(parts.length === 1) return parts[0].slice(0,4).toUpperCase();
  return parts.map(p => p[0]).slice(0,4).join("").toUpperCase();
}

// Create dept records from free-text names (avoid collisions with existing)
function buildDepartmentsFromNames(names, existing = []) {
  const out = existing.slice();
  const existingIds = new Set(out.map(d => normalizeKey(d.id)));
  const existingNames = new Set(out.map(d => normalizeKey(d.name)));
  names.forEach(rawName => {
    const name = normalize(rawName);
    if(!name) return;
    if(existingNames.has(normalizeKey(name))) return;
    let candidate = makeIdFromName(name);
    let id = candidate;
    let counter = 1;
    while(existingIds.has(normalizeKey(id)) || out.some(d => normalizeKey(d.id) === normalizeKey(id))) {
      id = `${candidate}${counter++}`;
    }
    out.push({ id, name, code: id, description: "" });
    existingIds.add(normalizeKey(id));
    existingNames.add(normalizeKey(name));
  });
  return out;
}

// Build lookup for matching by id/name/code
function buildDeptLookup(depts = []) {
  const map = new Map();
  (depts || []).forEach(d => {
    if(!d) return;
    if(d.id) map.set(normalizeKey(d.id), d.id);
    if(d.name) map.set(normalizeKey(d.name), d.id);
    if(d.code) map.set(normalizeKey(d.code), d.id);
  });
  return map; // normalized-string -> deptId
}

export default function ManageStudents(){
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ id: "", name:"", section:"", rollNo:"", departmentId:"" });
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    // Diagnostic logging
    console.debug("[ManageStudents] mount: loading departments and students from localStorage");
    const rawDepts = loadDepts();
    const rawStudents = loadStudentsRaw();
    console.debug("[ManageStudents] rawDepts:", rawDepts);
    console.debug("[ManageStudents] rawStudents (first 10):", rawStudents.slice(0,10));

    let depts = rawDepts || [];

    // If no departments but students have free-text department names, attempt recovery
    if((!depts || depts.length === 0) && rawStudents && rawStudents.length) {
      const nameSet = new Set();
      rawStudents.forEach(s => {
        const free = normalize(s.department || s.Department || "");
        if(free) nameSet.add(free);
      });
      const names = Array.from(nameSet);
      if(names.length) {
        console.warn("[ManageStudents] No departments found — recovering from student free-text department names:", names);
        depts = buildDepartmentsFromNames(names, depts);
        saveDepts(depts);
        console.info("[ManageStudents] Recovered departments:", depts);
      }
    }

    setDepartments(depts);

    // build lookup
    const lookup = buildDeptLookup(depts);

    // Normalize students => set departmentId where possible
    let updated = 0;
    const normalized = (rawStudents || []).map(s => {
      // prefer existing departmentId if it matches lookup
      if(s.departmentId && lookup.has(normalizeKey(s.departmentId))) {
        return { ...s, departmentId: lookup.get(normalizeKey(s.departmentId)) };
      }
      // if departmentId exists but doesn't match a dept, try matching it as name/code
      if(s.departmentId && lookup.has(normalizeKey(s.departmentId))) {
        return { ...s, departmentId: lookup.get(normalizeKey(s.departmentId)) };
      }
      // try free-text fields
      const free = normalize(s.department || s.Department || "");
      if(free && lookup.has(normalizeKey(free))) {
        updated++;
        return { ...s, departmentId: lookup.get(normalizeKey(free)), department: undefined, Department: undefined };
      }
      // else leave departmentId as-is (empty or whatever) — show as unassigned
      return { ...s, departmentId: s.departmentId || "" };
    });

    if(updated || JSON.stringify(normalized) !== JSON.stringify(rawStudents)) {
      console.debug(`[ManageStudents] Normalized students: updated=${updated}`);
      saveStudents(normalized);
    } else {
      console.debug("[ManageStudents] No normalization changes needed for students");
    }

    setStudents(normalized);
  }, []);

  // grouping logic (preserve department order as in departments array where possible)
  const { groups, deptOrder, unassigned } = useMemo(() => {
    const map = {};
    const seenOrder = [];
    (students || []).forEach(s => {
      const deptId = s.departmentId || "";
      if(!deptId) return;
      if(!map[deptId]) { map[deptId]=[]; seenOrder.push(deptId); }
      map[deptId].push(s);
    });

    // Attempt to order departments according to departments list (preferred)
    const deptIdsInOrder = (departments || []).map(d => d.id).filter(id => seenOrder.includes(id));
    // Append any deptIds seen in students but not present in departments
    seenOrder.forEach(id => { if(!deptIdsInOrder.includes(id)) deptIdsInOrder.push(id); });

    // unassigned = students without departmentId
    const unassignedList = (students || []).filter(s => !s.departmentId);

    // sort items in each group
    Object.keys(map).forEach(k => map[k].sort((a,b)=> (a.name||"").localeCompare(b.name||"")) );

    return { groups: map, deptOrder: deptIdsInOrder, unassigned: unassignedList };
  }, [students, departments]);

  function deptName(id) {
    const d = (departments || []).find(x => x && x.id === id);
    return d ? d.name : id;
  }

  function handleChange(e){
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAdd(e){
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if(!form.name.trim() || !form.rollNo.trim()) return alert("Name and Roll No are required.");
    if(!form.departmentId) return alert("Please select a Department from the Departments page.");
    const payload = { ...form, id };
    const newList = editingId ? students.map(s => s.id === editingId ? { ...s, ...payload } : s) : [{ ...payload }, ...students];
    saveStudents(newList);
    setStudents(newList);
    setForm({ id: "", name:"", section:"", rollNo:"", departmentId:"" });
    setEditingId(null);
  }

  function handleEdit(s){
    setEditingId(s.id);
    setForm({ id: s.id, name: s.name, section: s.section, rollNo: s.rollNo, departmentId: s.departmentId || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id){
    if(!confirm("Delete this student?")) return;
    const newList = students.filter(s => s.id !== id);
    saveStudents(newList);
    setStudents(newList);
  }

  function toggleCollapse(id){
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Students</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-4 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Student name" />
          </div>
          <div className="col-md-2 mb-2">
            <input name="rollNo" value={form.rollNo} onChange={handleChange} className="form-control" placeholder="Roll No" />
          </div>
          <div className="col-md-2 mb-2">
            <input name="section" value={form.section} onChange={handleChange} className="form-control" placeholder="Section" />
          </div>

          <div className="col-md-2 mb-2">
            <div className="d-flex">
              <select name="departmentId" value={form.departmentId} onChange={handleChange} className="form-control">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ""}</option>)}
              </select>
            </div>
          </div>

          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Students</h5>

          {unassigned.length > 0 && (
            <div className="mb-4">
              <div className="mb-2"><strong>Unassigned Students</strong> <small className="text-muted">({unassigned.length})</small></div>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead><tr><th>Name</th><th>Roll No</th><th>Section</th><th>Department</th><th>Actions</th></tr></thead>
                  <tbody>
                    {unassigned.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.rollNo}</td>
                        <td>{s.section}</td>
                        <td></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(s)}>Assign Dept</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {deptOrder.map(deptId => (
            <div key={deptId} className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div><strong>Department: {deptId}</strong> <small className="text-muted">({groups[deptId] ? groups[deptId].length : 0})</small></div>
                <div>
                  <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => toggleCollapse(deptId)}>
                    {collapsed[deptId] ? "Expand" : "Collapse"}
                  </button>
                </div>
              </div>

              {!collapsed[deptId] && (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead><tr><th>Name</th><th>Roll No</th><th>Section</th><th>Department</th><th style={{width:140}}>Actions</th></tr></thead>
                    <tbody>
                      {(groups[deptId] || []).map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.rollNo}</td>
                          <td>{s.section}</td>
                          <td>{deptName(s.departmentId)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(s)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}