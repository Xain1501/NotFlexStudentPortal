import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

/*
  Student management page (client-side demo).
  - Uses localStorage key "students" for persistence.
  - Supports Create, Read, Update, Delete.
  - Keeps UI simple and uses Bootstrap classes already in your app.
*/

const STUDENTS_KEY = "students_store";

function loadStudents() {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveStudents(list) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
}

export default function ManageStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", section: "", rollNo: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const data = loadStudents();
    // provide demo data if empty
    if (!data.length) {
      const demo = [
        { id: "1", name: "Madiha Aslam", section: "A", rollNo: "23k-0846" },
        { id: "2", name: "Ali Khan", section: "B", rollNo: "23k-0123" },
      ];
      saveStudents(demo);
      setStudents(demo);
      return;
    }
    setStudents(data);
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if (!form.name.trim() || !form.rollNo.trim()) return alert("Name and Roll No are required.");
    const newList = editingId
      ? students.map(s => (s.id === editingId ? { ...s, ...form, id } : s))
      : [{ ...form, id }, ...students];
    setStudents(newList);
    saveStudents(newList);
    setForm({ id: "", name: "", section: "", rollNo: "" });
    setEditingId(null);
  }

  function handleEdit(s) {
    setEditingId(s.id);
    setForm({ id: s.id, name: s.name, section: s.section, rollNo: s.rollNo });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    const newList = students.filter(s => s.id !== id);
    setStudents(newList);
    saveStudents(newList);
  }

  return (
    <main className="container admin-main">
        <h2 className="page-title text-center my-4">Manage Students</h2>
      

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-4 mb-2">
            <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Student name" />
          </div>
          <div className="col-md-3 mb-2">
            <input name="rollNo" value={form.rollNo} onChange={handleChange} className="form-control" placeholder="Roll No" />
          </div>
          <div className="col-md-3 mb-2">
            <input name="section" value={form.section} onChange={handleChange} className="form-control" placeholder="Section" />
          </div>
          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">{editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Students</h5>
          {students.length ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Section</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.rollNo}</td>
                      <td>{s.section}</td>
                      <td className="action btn">
                        <button className="btn btn-sm btn-outline-primary " onClick={() => handleEdit(s)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>No students found.</p>}
        </div>
      </div>
    
    </main>
  );
}