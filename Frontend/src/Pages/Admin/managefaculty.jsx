import React, { useEffect, useState, useMemo } from "react";
import "./adminhome.css";

const FACULTY_KEY = "faculty_store";
const DEPTS_KEY = "departments_store";
const PAGE_SIZE = 10;

// LocalStorage helpers
function loadFaculty() {
  try {
    const raw = localStorage.getItem(FACULTY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadFaculty error:", e);
    return [];
  }
}
function saveFaculty(list) {
  try {
    localStorage.setItem(FACULTY_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("saveFaculty error:", e);
  }
}
function loadDepts() {
  try {
    const raw = localStorage.getItem(DEPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadDepts error:", e);
    return [];
  }
}

export default function ManageFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", departmentId: "", employeeId: "" });
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [pageByDept, setPageByDept] = useState({});
  const [pageUnassigned, setPageUnassigned] = useState(1);

  useEffect(() => {
    function init() {
      const depts = loadDepts();
      setDepartments(depts);
      setFaculty(loadFaculty());
    }
    init();

    const handler = () => init();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Name is required.");
    if (!form.departmentId) return alert("Please select a Department.");

    const id = editingId || Date.now().toString();
    const payload = { ...form, id, status: form.status || "Active" };
    const newList = editingId
      ? faculty.map(f => f.id === editingId ? { ...f, ...payload } : f)
      : [payload, ...faculty];

    saveFaculty(newList);
    setFaculty(newList);
    setForm({ id: "", name: "", departmentId: "", employeeId: "" });
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({ ...item });
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

  const { groups, deptOrder, unassigned } = useMemo(() => {
    const map = {};
    const seenOrder = [];
    (faculty || []).forEach(f => {
      const deptId = f.departmentId || "";
      if (!deptId) return;
      if (!map[deptId]) seenOrder.push(deptId);
      map[deptId] = map[deptId] || [];
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
            <select name="departmentId" value={form.departmentId} onChange={handleChange} className="form-control">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-1 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

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
                  <thead><tr><th>Name</th><th>Employee ID</th><th>Department</th><th>Status</th><th style={{width:140}}>Actions</th></tr></thead>
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
    </main>
  );
}
