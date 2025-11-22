import React, { useEffect, useState } from "react";
import "./adminhome.css";

const DEPTS_KEY = "departments_store";
const PAGE_SIZE = 10;

// LocalStorage helpers
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
  } catch (e) {
    console.error("saveDepts error:", e);
  }
}

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", code: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);

  // Load data from localStorage
  useEffect(() => {
    setDepartments(loadDepts());
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Department name is required.");
    if (!form.code.trim()) return alert("Department code is required.");

    let newList;
    if (editingId) {
      newList = departments.map(d => (d.id === editingId ? { ...d, ...form } : d));
    } else {
      const newDept = { ...form, id: Date.now().toString() };
      newList = [newDept, ...departments];
    }

    saveDepts(newList);
    setDepartments(newList);
    setForm({ id: "", name: "", code: "", description: "" });
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({ ...item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this department?")) return;
    const newList = departments.filter(d => d.id !== id);
    saveDepts(newList);
    setDepartments(newList);
  }

  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil((departments || []).length / PAGE_SIZE));
  const visibleDepartments = paginate(departments, page);

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Departments</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-3 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Department Name" />
          </div>
          <div className="col-md-2 mb-2">
            <input name="code" value={form.code} onChange={handleChange} className="form-control" placeholder="Code" />
          </div>
          <div className="col-md-5 mb-2">
            <input name="description" value={form.description} onChange={handleChange} className="form-control" placeholder="Description" />
          </div>
          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Departments</h5>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead><tr><th>Name</th><th>Code</th><th>Description</th><th style={{width:140}}>Actions</th></tr></thead>
              <tbody>
                {visibleDepartments.map(d => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.code}</td>
                    <td>{d.description}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(d)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="d-flex align-items-center gap-2 mt-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <div className="small text-muted">Page {page} of {totalPages}</div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
