// src/pages/admin/ManageStudents.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

import {
  fetchStudents,
  createStudent,
  updateStudent,
  removeStudent,
  fetchDepartments,
} from "../../api/admin";

const PAGE_SIZE = 10;

function normalize(v) {
  return v == null ? "" : String(v).trim();
}
function normalizeKey(v) {
  return normalize(v).toLowerCase();
}
function makeIdFromName(name) {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .map((p) => p[0])
    .slice(0, 4)
    .join("")
    .toUpperCase();
}
function buildDepartmentsFromNames(names, existing = []) {
  const out = existing.slice();
  const existingIds = new Set(out.map((d) => normalizeKey(d.id)));
  const existingNames = new Set(out.map((d) => normalizeKey(d.name)));
  names.forEach((rawName) => {
    const name = normalize(rawName);
    if (!name) return;
    if (existingNames.has(normalizeKey(name))) return;
    let candidate = makeIdFromName(name);
    let id = candidate;
    let counter = 1;
    while (
      existingIds.has(normalizeKey(id)) ||
      out.some((d) => normalizeKey(d.id) === normalizeKey(id))
    ) {
      id = `${candidate}${counter++}`;
    }
    out.push({ id, name, code: id, description: "" });
    existingIds.add(normalizeKey(id));
    existingNames.add(normalizeKey(name));
  });
  return out;
}
function buildDeptLookup(depts = []) {
  const map = new Map();
  (depts || []).forEach((d) => {
    if (!d) return;
    if (d.id) map.set(normalizeKey(d.id), d.id);
    if (d.name) map.set(normalizeKey(d.name), d.id);
    if (d.code) map.set(normalizeKey(d.code), d.id);
  });
  return map; // normalized-string -> deptId
}

export default function ManageStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    section: "",
    rollNo: "",
    departmentId: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [pageByGroup, setPageByGroup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch students & departments from API
  async function loadFromApi() {
    setLoading(true);
    setError("");
    try {
      // departments first (so we can normalize student dept ids)
      const deptRes = await fetchDepartments();
      let depts = [];
      if (deptRes && deptRes.success) {
        // some APIs use data.departments
        depts = deptRes.data?.departments || deptRes.data || [];
      }

      // if no departments returned but students have free-text dept names, we'll try to recover later
      const studRes = await fetchStudents();
      let studs = [];
      if (studRes && studRes.success) {
        studs = studRes.data?.students || studRes.data || [];
      }

      // if no depts but students contain free-text department names, build them
      if ((!depts || depts.length === 0) && studs && studs.length) {
        const nameSet = new Set();
        studs.forEach((s) => {
          const free = normalize(s.department || s.Department || "");
          if (free) nameSet.add(free);
        });
        const names = Array.from(nameSet);
        if (names.length) {
          depts = buildDepartmentsFromNames(names, depts);
          // NOTE: we are not saving departments to backend here — inform admin to create them persistently if needed
        }
      }

      setDepartments(depts);

      // lookup
      const lookup = buildDeptLookup(depts);

      // normalize students -> ensure departmentId is set
      const normalized = (studs || []).map((s) => {
        if (s.departmentId && lookup.has(normalizeKey(s.departmentId))) {
          return {
            ...s,
            departmentId: lookup.get(normalizeKey(s.departmentId)),
          };
        }
        const free = normalize(s.department || s.Department || "");
        if (free && lookup.has(normalizeKey(free))) {
          return {
            ...s,
            departmentId: lookup.get(normalizeKey(free)),
            department: undefined,
            Department: undefined,
          };
        }
        return { ...s, departmentId: s.departmentId || "" };
      });

      setStudents(normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to load students/departments from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFromApi();
  }, []);

  // grouping logic (same as your original)
  const { nestedGroups, deptOrder, unassignedNested } = useMemo(() => {
    const deptMap = {}; // deptId -> { section -> [students] }
    const seenOrder = new Set();

    (students || []).forEach((s) => {
      const deptId = s.departmentId || ""; // empty => unassigned
      const sectionRaw = normalize(s.section) || "(No section)";
      const containerId = deptId || "__unassigned__";
      if (!deptMap[containerId]) deptMap[containerId] = {};
      if (!deptMap[containerId][sectionRaw])
        deptMap[containerId][sectionRaw] = [];
      deptMap[containerId][sectionRaw].push(s);
      if (deptId) seenOrder.add(deptId);
    });

    const deptIdsInOrder = (departments || [])
      .map((d) => d.id)
      .filter((id) => seenOrder.has(id));
    Array.from(seenOrder).forEach((id) => {
      if (!deptIdsInOrder.includes(id)) deptIdsInOrder.push(id);
    });

    Object.keys(deptMap).forEach((container) => {
      const sections = Object.keys(deptMap[container]);
      sections.forEach((sec) =>
        deptMap[container][sec].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        )
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

  function deptName(id) {
    const d = (departments || []).find((x) => x && x.id === id);
    return d ? d.name : id;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    const id = editingId || Date.now().toString();
    if (!form.name.trim() || !form.rollNo.trim())
      return alert("Name and Roll No are required.");
    if (!form.departmentId)
      return alert("Please select a Department from the Departments page.");
    const payload = {
      // adapt fields to expected backend columns:
      student_code: form.rollNo,
      first_name: form.name.split(" ")[0] || form.name,
      last_name: form.name.split(" ").slice(1).join(" ") || "",
      section: form.section || "",
      department_id: form.departmentId,
    };

    try {
      setLoading(true);
      if (editingId) {
        // update
        const res = await updateStudent(editingId, payload);
        if (!res.success) throw new Error(res.message || "Update failed");
      } else {
        const res = await createStudent(payload);
        if (!res.success) throw new Error(res.message || "Create failed");
      }
      // refresh list from server
      await loadFromApi();
      setForm({ id: "", name: "", section: "", rollNo: "", departmentId: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(s) {
    setEditingId(s.id || s.student_id || s.enrollment_id || s._id);
    setForm({
      id: s.id || s.student_id || s.enrollment_id || s._id,
      name:
        `${s.first_name || ""}${s.last_name ? " " + s.last_name : ""}`.trim() ||
        s.name ||
        "",
      section: s.section || "",
      rollNo: s.student_code || s.rollNo || "",
      departmentId: s.departmentId || s.department_id || "",
      status: s.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    setError("");
    try {
      setLoading(true);
      const res = await removeStudent(id);
      if (!res.success) throw new Error(res.message || "Delete failed");
      await loadFromApi();
    } catch (err) {
      console.error(err);
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleCollapse(id) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
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
  function renderSectionTable(containerId, sectionName, items) {
    const key = makePageKey(containerId, sectionName);
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const current = pageByGroup[key] || 1;
    const visible = paginate(items, current);

    return (
      <div key={sectionName} className="mb-3">
        <div className="mb-2">
          <strong>Section: {sectionName}</strong>{" "}
          <small className="text-muted">({items.length})</small>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Section</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id || s.student_id || s._id}>
                  <td>
                    {s.first_name
                      ? `${s.first_name} ${s.last_name || ""}`
                      : s.name}
                  </td>
                  <td>{s.student_code || s.rollNo}</td>
                  <td>{s.section}</td>
                  <td>{deptName(s.departmentId || s.department_id)}</td>
                  <td>{s.status || "Active"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        handleDelete(s.id || s.student_id || s._id)
                      }
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
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() =>
                setGroupPage(containerId, sectionName, Math.max(1, current - 1))
              }
            >
              Prev
            </button>
            <div className="small text-muted">
              Page {current} of {totalPages}
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() =>
                setGroupPage(
                  containerId,
                  sectionName,
                  Math.min(totalPages, current + 1)
                )
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Manage Students</h2>

      <form onSubmit={handleAdd} className="mb-3">
        <div className="row gx-2">
          <div className="col-md-4 mb-2">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Student name"
            />
          </div>
          <div className="col-md-2 mb-2">
            <input
              name="rollNo"
              value={form.rollNo}
              onChange={handleChange}
              className="form-control"
              placeholder="Roll No"
            />
          </div>
          <div className="col-md-2 mb-2">
            <input
              name="section"
              value={form.section}
              onChange={handleChange}
              className="form-control"
              placeholder="Section"
            />
          </div>

          <div className="col-md-2 mb-2">
            <div className="d-flex">
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.code ? ` (${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-md-2 mb-2 d-grid">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <h5>Students</h5>

          {loading && <div className="text-muted mb-3">Loading...</div>}

          {Object.keys(unassignedNested).length > 0 && (
            <div className="mb-4">
              <div className="mb-2">
                <strong>Unassigned Students</strong>{" "}
                <small className="text-muted">
                  (
                  {Object.values(unassignedNested).reduce(
                    (acc, arr) => acc + arr.length,
                    0
                  )}
                  )
                </small>
              </div>
              {Object.keys(unassignedNested)
                .sort()
                .map((sectionName) =>
                  renderSectionTable(
                    "__unassigned__",
                    sectionName,
                    unassignedNested[sectionName]
                  )
                )}
            </div>
          )}

          {deptOrder.map((deptId) => {
            const sectionsMap = nestedGroups[deptId] || {};
            const totalCount = Object.values(sectionsMap).reduce(
              (acc, arr) => acc + arr.length,
              0
            );
            return (
              <div key={deptId} className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <strong>Department: {deptName(deptId)}</strong>{" "}
                    <small className="text-muted">({totalCount})</small>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => toggleCollapse(deptId)}
                    >
                      {collapsed[deptId] ? "Expand" : "Collapse"}
                    </button>
                  </div>
                </div>

                {!collapsed[deptId] && (
                  <>
                    {Object.keys(sectionsMap).length === 0 ? (
                      <div className="text-muted">
                        No students in this department.
                      </div>
                    ) : (
                      Object.keys(sectionsMap)
                        .sort()
                        .map((sectionName) =>
                          renderSectionTable(
                            deptId,
                            sectionName,
                            sectionsMap[sectionName]
                          )
                        )
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
