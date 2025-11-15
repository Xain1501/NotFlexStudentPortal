import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

const STUDENTS_KEY = "students_store";
const DEPTS_KEY = "departments_store";
const PAGE_SIZE = 10;

function loadStudentsRaw() {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadStudentsRaw parse error", e);
    return [];
  }
}
function saveStudents(list) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("saveStudents write error", e);
  }
}
function loadDepts() {
  try {
    const raw = localStorage.getItem(DEPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadDepts parse error", e);
    return [];
  }
}
function saveDepts(list) {
  try {
    localStorage.setItem(DEPTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("saveDepts write error", e);
  }
}

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

// Create dept records from free-text names (avoid collisions with existing)
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

// Build lookup for matching by id/name/code
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
  // pagination per-section-per-department keyed by `${deptId}::${sectionKey}`
  const [pageByGroup, setPageByGroup] = useState({});
  // unassigned sections also use same grouping approach under deptId = "__unassigned__"

  function initLoadAndNormalize() {
    const rawDepts = loadDepts();
    const rawStudents = loadStudentsRaw();

    let depts = rawDepts || [];

    // If no departments but students have free-text department names, attempt recovery
    if ((!depts || depts.length === 0) && rawStudents && rawStudents.length) {
      const nameSet = new Set();
      rawStudents.forEach((s) => {
        const free = normalize(s.department || s.Department || "");
        if (free) nameSet.add(free);
      });
      const names = Array.from(nameSet);
      if (names.length) {
        depts = buildDepartmentsFromNames(names, depts);
        saveDepts(depts);
      }
    }

    setDepartments(depts);

    // build lookup
    const lookup = buildDeptLookup(depts);

    // Normalize students => set departmentId where possible
    let updated = 0;
    const normalized = (rawStudents || []).map((s) => {
      if (s.departmentId && lookup.has(normalizeKey(s.departmentId))) {
        return { ...s, departmentId: lookup.get(normalizeKey(s.departmentId)) };
      }
      const free = normalize(s.department || s.Department || "");
      if (free && lookup.has(normalizeKey(free))) {
        updated++;
        return {
          ...s,
          departmentId: lookup.get(normalizeKey(free)),
          department: undefined,
          Department: undefined,
        };
      }
      return { ...s, departmentId: s.departmentId || "" };
    });

    if (updated || JSON.stringify(normalized) !== JSON.stringify(rawStudents)) {
      saveStudents(normalized);
    }

    setStudents(normalized);
  }

  useEffect(() => {
    initLoadAndNormalize();

    // update when other parts of app change localStorage
    const handler = () => initLoadAndNormalize();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // grouping logic -> now nested by department -> section
  const { nestedGroups, deptOrder, unassignedNested } = useMemo(() => {
    const deptMap = {}; // deptId -> { section -> [students] }
    const seenOrder = new Set();

    (students || []).forEach((s) => {
      const deptId = s.departmentId || ""; // empty => unassigned
      const sectionRaw = normalize(s.section) || "(No section)";
      // decide group container
      const containerId = deptId || "__unassigned__";
      if (!deptMap[containerId]) deptMap[containerId] = {};
      if (!deptMap[containerId][sectionRaw])
        deptMap[containerId][sectionRaw] = [];
      deptMap[containerId][sectionRaw].push(s);
      if (deptId) seenOrder.add(deptId);
    });

    // ensure department order follows departments array where possible
    const deptIdsInOrder = (departments || [])
      .map((d) => d.id)
      .filter((id) => seenOrder.has(id));
    // append any other dept ids seen in students but not present in departments
    Array.from(seenOrder).forEach((id) => {
      if (!deptIdsInOrder.includes(id)) deptIdsInOrder.push(id);
    });

    // sort sections in each dept
    Object.keys(deptMap).forEach((container) => {
      const sections = Object.keys(deptMap[container]);
      sections.forEach((sec) =>
        deptMap[container][sec].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        )
      );
    });

    // build unassigned nested separately for clarity (container id "__unassigned__")
    const unassigned = deptMap["__unassigned__"] || {};

    // nestedGroups should have deptId keys (only real departments), mapping sections -> list
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

  function handleAdd(e) {
    e.preventDefault();
    const id = editingId || Date.now().toString();
    if (!form.name.trim() || !form.rollNo.trim())
      return alert("Name and Roll No are required.");
    if (!form.departmentId)
      return alert("Please select a Department from the Departments page.");
    const payload = { ...form, id, status: form.status || "Active" };
    const newList = editingId
      ? students.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
      : [{ ...payload }, ...students];
    saveStudents(newList);
    setStudents(newList);
    setForm({ id: "", name: "", section: "", rollNo: "", departmentId: "" });
    setEditingId(null);
  }

  function handleEdit(s) {
    setEditingId(s.id);
    setForm({
      id: s.id,
      name: s.name,
      section: s.section,
      rollNo: s.rollNo,
      departmentId: s.departmentId || "",
      status: s.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    const newList = students.filter((s) => s.id !== id);
    saveStudents(newList);
    setStudents(newList);
  }

  function toggleCollapse(id) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // page key helper: deptId may be "__unassigned__"
  function makePageKey(containerId, section) {
    const sec = section || "(No section)";
    return `${containerId}::${sec}`;
  }
  function setGroupPage(containerId, section, page) {
    const key = makePageKey(containerId, section);
    setPageByGroup((prev) => ({ ...prev, [key]: page }));
  }

  // pagination helpers for slicing arrays
  function paginate(list, page) {
    const p = Math.max(1, page || 1);
    const start = (p - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }

  // render helper for a single section table
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
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.rollNo}</td>
                  <td>{s.section}</td>
                  <td>{deptName(s.departmentId)}</td>
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
                      onClick={() => handleDelete(s.id)}
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
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <h5>Students</h5>

          {/* Unassigned students grouped by section */}
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

          {/* Departments -> sections */}
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
