/**
 * ../Admin/api.jsx
 *
 * Lightweight admin API wrapper for the Admin module components.
 * - Tries to call real HTTP endpoints under /api/admin/* if available.
 * - If the network call fails or endpoints are not present, falls back to a localStorage-backed demo mode.
 *
 * Usage (named exports):
 *  import {
 *    getAdmin,
 *    fetchFacultyLeaves,
 *    approveLeaveRequest,
 *    rejectLeaveRequest,
 *    fetchFacultyList,
 *    fetchCourses,
 *    fetchStudents,
 *    dropStudentFromCourse,
 *    assignStudentToCourse,
 *    fetchStudentFees,
 *    updateStudentFee
 *  } from '../Admin/api';
 *
 * Replace or wire the endpoints (URL paths) below to point to your real backend.
 */

const API_BASE = "/api/admin"; // change to your backend base path if needed

/* Helper: try real fetch (no demo fallback) */
async function tryFetch(path, options = {}) {
  // attach auth token automatically if present
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("token");
  options = { ...options, headers: { ...(options.headers || {}) } };
  if (token && !options.headers.Authorization) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  // ensure that for JSON bodies the content-type header is present
  if (options.body && !options.headers["Content-Type"]) {
    options.headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    // bubble up a helpful error (caller can catch)
    const text = await res.text().catch(() => "");
    const message = text || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  // attempt to parse json; if none, return null
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? await res.json() : null;
}

/* ---------- Admin API functions ---------- */

/* Admin summary / dashboard data */
export async function getAdmin() {
  return tryFetch("/admin", {});
}

// compatibility alias
export async function fetchAdminDashboard() {
  return getAdmin();
}

/* Faculty leaves (pending/all) */
export async function fetchFacultyLeaves() {
  return tryFetch("/leaves", {});
}

export async function approveLeaveRequest(id) {
  return tryFetch(`/leaves/${id}/approve`, { method: "POST" });
}

export async function rejectLeaveRequest(id) {
  return tryFetch(`/leaves/${id}/reject`, { method: "POST" });
}

/* Faculty list */
export async function fetchFacultyList() {
  return tryFetch("/faculty", {});
}

/* Courses & Students */
export async function fetchCourses() {
  return tryFetch("/courses", {});
}

export async function fetchStudents() {
  return tryFetch("/students", {});
}

/* Delete a student (used by Admin manage student UI) */
export async function deleteUser(identifier) {
  const roll = typeof identifier === "string" ? identifier : identifier?.roll;
  if (!roll) throw new Error("deleteUser requires a student roll");
  return tryFetch(`/students/${encodeURIComponent(roll)}`, {
    method: "DELETE",
  });
}

/* Drop a student from a course */
export async function dropStudentFromCourse({ courseId, roll }) {
  return tryFetch(`/courses/${courseId}/drop`, {
    method: "POST",
    body: JSON.stringify({ roll }),
  });
}

/* Assign / enroll a student to a course */
export async function assignStudentToCourse({ courseId, roll }) {
  return tryFetch(`/courses/${courseId}/assign`, {
    method: "POST",
    body: JSON.stringify({ roll }),
  });
}

/* Fees */
export async function fetchStudentFees() {
  return tryFetch("/fees", {});
}

export async function updateStudentFee({ roll, fee }) {
  return tryFetch(`/fees/${encodeURIComponent(roll)}`, {
    method: "PUT",
    body: JSON.stringify({ fee }),
  });
}

/* Login function — store token on success to let tryFetch attach it */
export async function login(credentials) {
  const data = await tryFetch("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  // assume backend returns { token, user } — store token for subsequent requests
  if (data && data.token) {
    localStorage.setItem("auth_token", data.token);
  }
  return data;
}

/* Fetch all users (admin list) — added to fix managestudent.jsx import */
export async function fetchAllUsers() {
  // endpoint: GET /api/admin/users
  return tryFetch("/users", {});
}

/**
 * Backend API endpoints summary:
 *
 * - `GET /admin`: Admin dashboard summary
 * - `GET /leaves`: List all leaves (faculty)
 * - `POST /leaves/{id}/approve`: Approve a leave request
 * - `POST /leaves/{id}/reject`: Reject a leave request
 * - `GET /faculty`: List all faculty members
 * - `GET /courses`: List all courses
 * - `GET /students`: List all students
 * - `DELETE /students/{roll}`: Delete a student
 * - `POST /courses/{courseId}/drop`: Drop a student from a course
 * - `POST /courses/{courseId}/assign`: Assign a student to a course
 * - `GET /fees`: Get all student fees
 * - `PUT /fees/{roll}`: Update a student's fee
 * - `POST /login`: Authenticate and login
 */
