import React, { useEffect, useState, useMemo } from "react";
import "./adminhome.css";

const PAGE_SIZE = 10;
const DEPTS_KEY = "departments_store";
const STUDENTS_KEY = "students_store";

// localStorage helpers for departments (already used by ManageDepartments)
function loadDeptsFromLocal() {
  try {
    const raw = localStorage.getItem(DEPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadDeptsFromLocal error:", e);
    return [];
  }
}

// localStorage helpers for students (offline dummy storage)
function loadStudentsFromLocal() {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadStudentsFromLocal error:", e);
    return [];
  }
}
function saveStudentsToLocal(list) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
    // dispatch storage-like event so other components can optionally listen
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("saveStudentsToLocal error:", e);
  }
}

// small id generator for local students
function nextStudentId(list) {
  const max = (list || []).reduce((m, s) => {
    const id = Number(s.student_id || s.id) || 0;
    return id > m ? id : m;
  }, 0);
  return String(max + 1);
}

function normalize(v) {
  return v == null ? "" : String(v).trim();
}

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    id: "",
    student_code: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    cnic: "",
    enrollment_date: "",
    section: "",
    departmentId: "",
    current_semester: 1,
    status: "active",
  });
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [pageByGroup, setPageByGroup] = useState({}); // paging per section (container::section)
  const [loading, setLoading] = useState(false);

  // Load local departments & students on mount and listen for department updates
  useEffect(() => {
    // load departments from ManageDepartments localStorage
    const localDepts = loadDeptsFromLocal();
    setDepartments(localDepts);

    // load students from local storage (dummy data)
    let locals = loadStudentsFromLocal();
    // If empty, seed with an example so UI is not blank (optional)
    if (!locals || locals.length === 0) {
      locals = [
        {
          student_id: "1",
          student_code: "S1001",
          first_name: "Ali",
          last_name: "Khan",
          date_of_birth: "",
          phone: "",
          cnic: "",
          enrollment_date: "",
          section: "A",
          departmentId: (localDepts[0] && localDepts[0].id) || "",
          current_semester: 1,
          status: "active",
        },
        {
          student_id: "2",
          student_code: "S1002",
          first_name: "Sara",
          last_name: "Ahmad",
          date_of_birth: "",
          phone: "",
          cnic: "",
          enrollment_date: "",
          section: "A",
          departmentId: (localDepts[0] && localDepts[0].id) || "",
          current_semester: 1,
          status: "active",
        },
      ];
      saveStudentsToLocal(locals);
    }
    setStudents(locals);

    // update departments when ManageDepartments saves
    const onDeptsChanged = () => {
      const d = loadDeptsFromLocal();
      setDepartments(d || []);
    };
    window.addEventListener("storage", onDeptsChanged);
    window.addEventListener("departments_updated", onDeptsChanged);

    return () => {
      window.removeEventListener("storage", onDeptsChanged);
      window.removeEventListener("departments_updated", onDeptsChanged);
    };
  }, []);

  // Local CRUD helpers (operate on localStorage)
  function createLocalStudent(payload) {
    const list = loadStudentsFromLocal();
    const id = nextStudentId(list);
    const student = { student_id: id, ...payload };
    list.unshift(student);
    saveStudentsToLocal(list);
    setStudents(list);
    return student;
  }
  function updateLocalStudent(id, payload) {
    const list = loadStudentsFromLocal().map((s) =>
      String(s.student_id || s.id) === String(id) ? { ...s, ...payload } : s
    );
    saveStudentsToLocal(list);
    setStudents(list);
  }
  function removeLocalStudent(id) {
    const list = loadStudentsFromLocal().filter((s) => String(s.student_id || s.id) !== String(id));
    saveStudentsToLocal(list);
    setStudents(list);
  }

  // grouping: department -> section -> students (sorted by semester then name)
  const { nestedGroups, deptOrder, unassignedNested } = useMemo(() => {
    const deptMap = {};
    const seenOrder = new Set();

    (students || []).forEach((s) => {
      const deptId = s.departmentId || "";
      const sectionRaw = normalize(s.section) || "(No section)";
      const containerId = deptId || "__unassigned__";
      if (!deptMap[containerId]) deptMap[containerId] = {};
      if (!deptMap[containerId][sectionRaw]) deptMap[containerId][sectionRaw] = [];
      deptMap[containerId][sectionRaw].push(s);
      if (deptId) seenOrder.add(deptId);
    });

    const deptIdsInOrder = (departments || []).map((d) => d.id).filter((id) => seenOrder.has(id));
    Array.from(seenOrder).forEach((id) => {
      if (!deptIdsInOrder.includes(id)) deptIdsInOrder.push(id);
    });

    Object.keys(deptMap).forEach((container) => {
      const sections = Object.keys(deptMap[container]);
      sections.forEach((sec) =>
        deptMap[container][sec].sort((a, b) => {
          const sa = Number(a.current_semester) || 0;
          const sb = Number(b.current_semester) || 0;
          if (sa !== sb) return sa - sb;
          const na = `${(a.first_name || "")} ${(a.last_name || "")}`.trim();
          const nb = `${(b.first_name || "")} ${(b.last_name || "")}`.trim();
          return na.localeCompare(nb);
        })
      );
    });

    const unassigned = deptMap["__unassigned__"] || {};
    const nested = {};
    deptIdsInOrder.forEach((id) => {
      nested[id] = deptMap[id] || {};
    });

    return {
      nestedGroups: nested,
      deptOrder: deptIdsInOrder,
      unassignedNested: unassigned,
    };
  }, [students, departments]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.student_code.trim()) return alert("First name and Student Code (Roll No) are required.");
    if (!form.departmentId) return alert("Please select a Department from Manage Departments.");

    const payload = {
      student_code: form.student_code,
      first_name: form.first_name,
      last_name: form.last_name || "",
      date_of_birth: form.date_of_birth || null,
      phone: form.phone || "",
      cnic: form.cnic || "",
      enrollment_date: form.enrollment_date || null,
      section: form.section || "",
      departmentId: form.departmentId,
      current_semester: Number(form.current_semester) || 1,
      status: form.status || "active",
    };

    try {
      setLoading(true);
      if (editingId) {
        updateLocalStudent(editingId, payload);
      } else {
        createLocalStudent(payload);
      }

      // reset form
      setForm({
        id: "",
        student_code: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        phone: "",
        cnic: "",
        enrollment_date: "",
        section: "",
        departmentId: "",
        current_semester: 1,
        status: "active",
      });
      setEditingId(null);
    } catch (err) {
      console.error("Save error (local):", err);
      alert("Save failed locally. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(s) {
    setEditingId(s.student_id || s.id || "");
    setForm({
      id: s.student_id || s.id || "",
      student_code: s.student_code || "",
      first_name: s.first_name || "",
      last_name: s.last_name || "",
      date_of_birth: s.date_of_birth || "",
      phone: s.phone || "",
      cnic: s.cnic || "",
      enrollment_date: s.enrollment_date || "",
      section: s.section || "",
      departmentId: s.departmentId || s.department_id || "",
      current_semester: s.current_semester || s.currentSemester || 1,
      status: s.status || "active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    removeLocalStudent(id);
  }

  function makePageKey(containerId, section) {
    const sec = section || "(No section)";
    return `${containerId}::${sec}`;
  }
  function setGroupPage(containerId, section, page) {
    const key = makePageKey(containerId, section);
    setPageByGroup((prev) => ({ ...prev, [key]: page }));
  }
  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  // Render per-section table with pagination: when section has > PAGE_SIZE, we page so 11th goes to page 2
  function renderSectionTable(containerId, sectionName, items) {
    const sorted = (items || []).slice(); // already sorted in useMemo
    const key = makePageKey(containerId, sectionName);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const current = pageByGroup[key] || 1;
    const visible = paginate(sorted, current);

    return (
      <div key={sectionName} className="mb-3">
        <div className="mb-2">
          <strong>Section: {sectionName}</strong>{" "}
          <small className="text-muted">({sorted.length})</small>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rollno</th>
                <th>Section</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.student_id || s.id}>
                  <td>{`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.name}</td>
                  <td>{s.student_code}</td>
                  <td>{s.section}</td>
                  <td>{(departments.find(d => String(d.id) === String(s.departmentId)) || {}).name || ""}</td>
                  <td>{s.current_semester || s.currentSemester || 1}</td>
                  <td>{s.status || "active"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.student_id || s.id)}>Delete</button>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted">No students on this page</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setGroupPage(containerId, sectionName, Math.max(1, current - 1))}>Prev</button>
            <div className="small text-muted">Page {current} of {totalPages}</div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setGroupPage(containerId, sectionName, Math.min(totalPages, current + 1))}>Next</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Students (Local / Dummy mode)</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2 align-items-center">
          <div className="col-md-3 mb-2">
            <input name="student_code" value={form.student_code} onChange={handleChange} className="form-control" placeholder="Student Code / Roll No" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="first_name" value={form.first_name} onChange={handleChange} className="form-control" placeholder="First name" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="last_name" value={form.last_name} onChange={handleChange} className="form-control" placeholder="Last name" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="form-control" placeholder="Date of birth" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="phone" value={form.phone} onChange={handleChange} className="form-control" placeholder="Phone" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="cnic" value={form.cnic} onChange={handleChange} className="form-control" placeholder="CNIC" />
          </div>

          <div className="col-md-3 mb-2">
            <input name="enrollment_date" type="date" value={form.enrollment_date} onChange={handleChange} className="form-control" placeholder="Enrollment date" />
          </div>

          <div className="col-md-2 mb-2">
            <input name="section" value={form.section} onChange={handleChange} className="form-control" placeholder="Section" />
          </div>

          <div className="col-md-2 mb-2">
            <input name="current_semester" type="number" value={form.current_semester} onChange={handleChange} className="form-control" placeholder="Semester" min="1" />
          </div>

          <div className="col-md-3 mb-2">
            <select name="departmentId" value={form.departmentId} onChange={handleChange} className="form-control">
              <option value="">Select Department</option>
              {(departments || []).map((d) => (
                <option key={d.id ?? d.code ?? d.name} value={d.id ?? d.code ?? d.name}>
                  {d.name ?? d.id ?? d.code}{d.code ? ` (${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2 mb-2">
            <select name="status" value={form.status} onChange={handleChange} className="form-control">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="col-md-1 mb-2 d-grid">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Add"}</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Students</h5>

          {Object.keys(unassignedNested).length > 0 && (
            <div className="mb-4">
              <div className="mb-2"><strong>Unassigned Students</strong> <small className="text-muted">({Object.values(unassignedNested).reduce((acc, arr) => acc + arr.length, 0)})</small></div>
              {Object.keys(unassignedNested).sort().map((sectionName) => renderSectionTable("__unassigned__", sectionName, unassignedNested[sectionName]))}
            </div>
          )}

          {(deptOrder || []).map((deptId) => {
            const sectionsMap = nestedGroups[deptId] || {};
            const totalCount = Object.values(sectionsMap).reduce((acc, arr) => acc + arr.length, 0);
            return (
              <div key={deptId} className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div><strong>Department: {(departments.find(d => String(d.id) === String(deptId)) || {}).name || deptId}</strong> <small className="text-muted">({totalCount})</small></div>
                  <div><button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => setCollapsed((p)=>({...p, [deptId]: !p[deptId]}))}>{collapsed[deptId] ? "Expand" : "Collapse"}</button></div>
                </div>

                {!collapsed[deptId] && (
                  <>
                    {Object.keys(sectionsMap).length === 0 ? (
                      <div className="text-muted">No students in this department.</div>
                    ) : (
                      Object.keys(sectionsMap).sort().map((sectionName) => renderSectionTable(deptId, sectionName, sectionsMap[sectionName]))
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}