/**
 * admin.js
 *
 * Admin API wrapper - connects to Flask backend
 * All endpoints require JWT authentication
 */

import { fetchJson, apiRoot } from "./client";

const BASE = "/admin";

// Helper to use apiRequest pattern that exists in the code
async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${apiRoot()}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      return {
        success: false,
        message: err.message || JSON.stringify(err),
        data: null,
      };
    } catch {
      return { success: false, message: text || res.statusText, data: null };
    }
  }

  try {
    const data = JSON.parse(text);
    return { success: true, data, message: null };
  } catch {
    return { success: true, data: text, message: null };
  }
}

export function getAdminDashboard() {
  return fetchJson(BASE, "/dashboard", { method: "GET" });
}

export function getAllUsers() {
  return fetchJson(BASE, "/users", { method: "GET" });
}

export function deleteUser(userId) {
  return fetchJson(BASE, `/users/${userId}`, { method: "DELETE" });
}

export function toggleUserStatus(userId) {
  return fetchJson(BASE, `/users/${userId}/toggle-status`, { method: "PUT" });
}

export function getAnnouncements() {
  return fetchJson(BASE, "/announcements", { method: "GET" });
}

export function postAnnouncement(payload) {
  return fetchJson(BASE, "/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ========== AUTH FUNCTIONS ========== */

export async function adminLogin(username, password) {
  try {
    const response = await fetch(`${apiRoot()}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ========== STUDENT FUNCTIONS ========== */

/**
 * Fetch all students
 * Backend: GET /api/admin/students
 */
export async function fetchStudents() {
  const result = await apiRequest("/api/admin/students");
  if (result.success && result.data?.data?.students) {
    // Backend returns { success, data: { students: [...] } }
    const students = result.data.data.students.map((s) => ({
      ...s,
      id: s.student_id || s.id,
      departmentId: s.major_dept_id || s.dept_id || "",
      department_id: s.major_dept_id || s.dept_id || "",
      rollNo: s.student_code,
      student_code: s.student_code,
      first_name: s.first_name,
      last_name: s.last_name,
      name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
      section: s.section || "",
      status: s.status || "active",
    }));
    return { success: true, data: { students } };
  }
  return result;
}

/**
 * Create a new student
 * Backend: POST /api/admin/students
 */
export async function createStudent(payload) {
  const backendPayload = {
    student_code: payload.student_code,
    first_name: payload.first_name,
    last_name: payload.last_name || "",
    email: payload.email || `${payload.student_code}@student.edu`,
    major_dept_id: payload.department_id || payload.major_dept_id,
    current_semester: payload.current_semester || 1,
    phone: payload.phone || "",
    cnic: payload.cnic || "",
    date_of_birth: payload.date_of_birth || null,
  };

  return apiRequest("/api/admin/students", {
    method: "POST",
    body: JSON.stringify(backendPayload),
  });
}

/**
 * Update an existing student
 * Backend: PUT /api/admin/students/:id
 */
export async function updateStudent(id, payload) {
  const backendPayload = {
    first_name: payload.first_name,
    last_name: payload.last_name || "",
    major_dept_id: payload.department_id || payload.major_dept_id,
    current_semester: payload.current_semester,
    phone: payload.phone,
    status: payload.status || "active",
  };

  return apiRequest(`/api/admin/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(backendPayload),
  });
}

/**
 * Remove/delete a student
 * Backend: DELETE /api/admin/students/:id
 */
export async function removeStudent(id) {
  return apiRequest(`/api/admin/students/${id}`, {
    method: "DELETE",
  });
}

/* ========== DEPARTMENT FUNCTIONS ========== */

/**
 * Fetch all departments
 * Backend: GET /api/admin/departments
 */
export async function fetchDepartments() {
  const result = await apiRequest("/api/admin/departments");
  if (result.success && result.data?.data?.departments) {
    const departments = result.data.data.departments.map((d) => ({
      id: d.dept_id || d.id,
      name: d.dept_name || d.name,
      code: d.dept_code || d.code || d.dept_id,
      description: d.description || "",
    }));
    return { success: true, data: { departments } };
  }
  return result;
}

/* ========== FACULTY FUNCTIONS ========== */

/**
 * Fetch all faculty
 * Backend: GET /api/admin/faculty
 */
export async function fetchFacultyList() {
  const result = await apiRequest("/api/admin/faculty");
  if (result.success && result.data?.data?.faculty) {
    return result.data.data.faculty;
  }
  return [];
}

export async function createFaculty(payload) {
  const backendPayload = {
    faculty_code: payload.faculty_code,
    first_name: payload.first_name,
    last_name: payload.last_name || "",
    email: payload.email || `${payload.faculty_code}@faculty.edu`,
    department_id: payload.department_id,
    phone: payload.phone || "",
    salary: payload.salary || 100000,
  };

  return apiRequest("/api/admin/faculty", {
    method: "POST",
    body: JSON.stringify(backendPayload),
  });
}

export async function updateFaculty(id, payload) {
  return apiRequest(`/api/admin/faculty/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removeFaculty(id) {
  return apiRequest(`/api/admin/faculty/${id}`, {
    method: "DELETE",
  });
}

/* ========== COURSE FUNCTIONS ========== */

export async function fetchCourses() {
  const result = await apiRequest("/api/courses/all");
  if (result.success && result.data?.data?.courses) {
    return result.data.data.courses;
  }
  return [];
}

/* ========== FEE FUNCTIONS ========== */

export async function fetchStudentFees() {
  const result = await apiRequest("/api/admin/fees");
  if (result.success && result.data?.data?.fees) {
    return result.data.data.fees;
  }
  return [];
}

export async function createFee(payload) {
  return apiRequest("/api/admin/fees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function markFeePaid(feeId) {
  return apiRequest(`/api/admin/fees/${feeId}/mark-paid`, {
    method: "PUT",
  });
}

export async function removeFee(id) {
  return apiRequest(`/api/admin/fees/${id}`, {
    method: "DELETE",
  });
}

/* ========== DASHBOARD ========== */

export async function getAdmin() {
  const result = await apiRequest("/api/admin/dashboard");
  if (result.success && result.data?.data) {
    return result.data.data;
  }
  return null;
}

/* ========== LEAVE MANAGEMENT ========== */

export async function fetchFacultyLeaves() {
  const result = await apiRequest("/api/admin/leaves");
  if (result.success && result.data?.data?.leaves) {
    return result.data.data.leaves;
  }
  return [];
}

export async function approveLeaveRequest(id) {
  return apiRequest(`/api/admin/leaves/${id}/approve`, {
    method: "PUT",
  });
}

export async function rejectLeaveRequest(id) {
  return apiRequest(`/api/admin/leaves/${id}/reject`, {
    method: "PUT",
  });
}

/* ========== FACULTY ATTENDANCE ========== */

export async function save(payload) {
  return apiRequest("/api/admin/faculty-attendance/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetch(date) {
  const result = await apiRequest(`/api/admin/faculty-attendance/${date}`);
  if (result.success && result.data?.data?.attendance) {
    return result.data.data.attendance;
  }
  return [];
}

/* ========== ENROLLMENT FUNCTIONS ========== */
export async function dropStudentFromCourse({ courseId, studentId }) {
  return apiRequest("/api/admin/course-management/drop", {
    method: "POST",
    body: JSON.stringify({ 
      enrollment_id: courseId,
      student_id: studentId 
    }),
  });
}
export async function assignStudentToCourse({ courseId, studentId }) {
  return apiRequest("/api/admin/course-management/enroll", {
    method: "POST",
    body: JSON.stringify({
      student_id: studentId,
      section_id: courseId,
    }),
  });
}

/* ========== LEGACY FUNCTIONS (backward compatibility) ========== */

export async function getStudents(token) {
  if (token) localStorage.setItem("token", token);
  return fetchStudents();
}

export async function addStudent(token, studentData) {
  if (token) localStorage.setItem("token", token);
  return createStudent(studentData);
}

export async function deleteStudent(token, id) {
  if (token) localStorage.setItem("token", token);
  return removeStudent(id);
}

export async function updateStudentFee({ fee }) { // Remove 'roll'
  return apiRequest(`/api/admin/fees/student`, { // Adjust endpoint if needed
    method: "PUT", 
    body: JSON.stringify({ amount: fee }),
  });
}
