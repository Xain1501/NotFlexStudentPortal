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
  const [form, setForm] = useState({
    id: "",
    name: "",
    code: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);

  // For courses within a department
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    section: "",
  });
  const [editDeptId, setEditDeptId] = useState(null); // Which department is in "add course" mode
  const [editCourseIdx, setEditCourseIdx] = useState(-1);

  // Load data from localStorage on mount
  useEffect(() => {
    setDepartments(loadDepts());
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Department name is required.");
    if (!form.code.trim()) return alert("Department code is required.");

    let newList;
    if (editingId) {
      newList = departments.map((d) =>
        d.id === editingId ? { ...d, ...form } : d
      );
    } else {
      const newDept = { ...form, id: Date.now().toString(), courses: [] };
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
    const newList = departments.filter((d) => d.id !== id);
    saveDepts(newList);
    setDepartments(newList);
  }

  // Course management
  function handleCourseChange(e) {
    const { name, value } = e.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddCourse(deptId) {
    if (!courseForm.name.trim()) return alert("Course Name required.");
    if (!courseForm.code.trim()) return alert("Course Code required.");
    const newDepartments = departments.map((d) =>
      d.id !== deptId
        ? d
        : {
            ...d,
            courses: [
              ...(d.courses || []),
              {
                name: courseForm.name,
                code: courseForm.code,
                section: courseForm.section || "",
              },
            ],
          }
    );
    saveDepts(newDepartments);
    setDepartments(newDepartments);
    setEditDeptId(null);
    setCourseForm({ name: "", code: "", section: "" });
    setEditCourseIdx(-1);
  }

  function handleDeleteCourse(deptId, idx) {
    if (!window.confirm("Delete this course?")) return;
    const newDepartments = departments.map((d) =>
      d.id !== deptId
        ? d
        : {
            ...d,
            courses: (d.courses || []).filter((_, cidx) => cidx !== idx),
          }
    );
    saveDepts(newDepartments);
    setDepartments(newDepartments);
  }

  // Update course
  function handleEditCourse(deptId, idx) {
    setEditDeptId(deptId);
    setEditCourseIdx(idx);
    const course = departments.find((d) => d.id === deptId).courses[idx];
    setCourseForm({
      name: course.name,
      code: course.code,
      section: course.section,
    });
  }
  function handleSaveCourseEdit(deptId, idx) {
    if (!courseForm.name.trim() || !courseForm.code.trim()) {
      return alert("Course Name and Code required.");
    }
    const newDepartments = departments.map((d) =>
      d.id !== deptId
        ? d
        : {
            ...d,
            courses: d.courses.map((c, i) =>
              i !== idx ? c : { ...courseForm }
            ),
          }
    );
    saveDepts(newDepartments);
    setDepartments(newDepartments);
    setEditDeptId(null);
    setCourseForm({ name: "", code: "", section: "" });
    setEditCourseIdx(-1);
  }

  function handleCancelCourseEdit() {
    setEditDeptId(null);
    setEditCourseIdx(-1);
    setCourseForm({ name: "", code: "", section: "" });
  }

  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  const totalPages = Math.max(
    1,
    Math.ceil((departments || []).length / PAGE_SIZE)
  );
  const visibleDepartments = paginate(departments, page);

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Departments</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-3 mb-2">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Department Name"
            />
          </div>
          <div className="col-md-2 mb-2">
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className="form-control"
              placeholder="Code"
            />
          </div>
          <div className="col-md-5 mb-2">
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-control"
              placeholder="Description"
            />
          </div>
          <div className="col-md-2 mb-2 d-grid">
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Departments</h5>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Courses</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDepartments.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.code}</td>
                    <td>
                      <ul className="list-unstyled mb-2">
                        {(d.courses || []).map((c, idx) => (
                          <li key={idx} className="mb-1">
                            {editDeptId === d.id && editCourseIdx === idx ? (
                              <div className="d-flex align-items-center mb-1">
                                <input
                                  name="code"
                                  value={courseForm.code}
                                  onChange={handleCourseChange}
                                  className="form-control me-2"
                                  placeholder="Code"
                                  style={{ maxWidth: 80 }}
                                />
                                <input
                                  name="name"
                                  value={courseForm.name}
                                  onChange={handleCourseChange}
                                  className="form-control me-2"
                                  placeholder="Name"
                                  style={{ maxWidth: 120 }}
                                />

                                <button
                                  className="btn btn-success btn-sm me-1"
                                  onClick={() =>
                                    handleSaveCourseEdit(d.id, idx)
                                  }
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={handleCancelCourseEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <span
                                    className="me-2"
                                    style={{ minWidth: 60 }}
                                  >
                                    <b>{c.code}</b>
                                  </span>
                                  <span className="me-2">{c.name}</span>
                                  {c.section && (
                                    <span className="me-2">
                                      Sec: {c.section}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <button
                                    className="btn btn-outline-primary btn-sm me-1"
                                    onClick={() => handleEditCourse(d.id, idx)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() =>
                                      handleDeleteCourse(d.id, idx)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                      {/* Add course form for this department */}
                      {editDeptId === d.id && editCourseIdx === -1 ? (
                        <div className="d-flex align-items-center">
                          <input
                            name="code"
                            value={courseForm.code}
                            onChange={handleCourseChange}
                            className="form-control me-2"
                            placeholder="Code"
                            style={{ maxWidth: 80 }}
                          />
                          <input
                            name="name"
                            value={courseForm.name}
                            onChange={handleCourseChange}
                            className="form-control me-2"
                            placeholder="Name"
                            style={{ maxWidth: 120 }}
                          />

                          <button
                            className="btn btn-success btn-sm me-1"
                            onClick={() => handleAddCourse(d.id)}
                          >
                            Add
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleCancelCourseEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => {
                            setEditDeptId(d.id);
                            setEditCourseIdx(-1);
                            setCourseForm({ name: "", code: "", section: "" });
                          }}
                        >
                          + Add Course
                        </button>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(d.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="d-flex align-items-center gap-2 mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="small text-muted">
                Page {page} of {totalPages}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
