import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

/*
  Faculty management page (client-side demo).
  - Uses localStorage key "faculty_store" for persistence.
  - Supports Create, Read, Update, Delete.
*/

const FACULTY_KEY = "faculty_store";

function loadFaculty() {
  try {
    const raw = localStorage.getItem(FACULTY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveFaculty(list) {
  localStorage.setItem(FACULTY_KEY, JSON.stringify(list));
}

export default function ManageFaculty() {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", department: "", employeeId: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const data = loadFaculty();
    if (!data.length) {
      const demo = [
        { id: "f1", name: "Dr. Aisha Khan", department: "Computer Science", employeeId: "T2025-09" },
      ];
      saveFaculty(demo);
      setFaculty(demo);
      return;
    }
    setFaculty(data);
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if (!form.name.trim()) return alert("Name is required.");
    const newList = editingId
      ? faculty.map(s => (s.id === editingId ? { ...s, ...form, id } : s))
      : [{ ...form, id }, ...faculty];
    setFaculty(newList);
    saveFaculty(newList);
    setForm({ id: "", name: "", department: "", employeeId: "" });
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({ id: item.id, name: item.name, department: item.department, employeeId: item.employeeId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this faculty member?")) return;
    const newList = faculty.filter(f => f.id !== id);
    setFaculty(newList);
    saveFaculty(newList);
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="page-title text-center my-4">Manage Faculty</h2>
      </div>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-4 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Faculty name" />
          </div>
          <div className="col-md-3 mb-2">
            <input name="employeeId" value={form.employeeId} onChange={handleChange} className="form-control" placeholder="Employee ID" />
          </div>
          <div className="col-md-3 mb-2">
            <input name="department" value={form.department} onChange={handleChange} className="form-control" placeholder="Department" />
          </div>
          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Faculty Members</h5>
          {faculty.length ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td>
                      <td>{f.employeeId}</td>
                      <td>{f.department}</td>
                      <td className="action btn">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(f)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f.id)}>Delete</button>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>No faculty found.</p>}
        </div>
      </div>
    </div>
  );
}