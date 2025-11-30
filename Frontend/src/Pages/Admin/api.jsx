/**
 * Admin-specific API calls - Complete with all exports
 */

import { fetchJson } from "../../api/client";

// FIX: Define base constant at the top
const base = "/admin";

/* ---------- DASHBOARD ---------- */
export function getAdminDashboard() {
  return fetchJson(base, "/dashboard", { method: "GET" });
}

export function fetchAdminDashboard() {
  return getAdminDashboard();
}

export function getAdminStats() {
  return getAdminDashboard();
}

/* ---------- USER MANAGEMENT ---------- */
export function fetchAllUsers() {
  return fetchJson(base, "/users", { method: "GET" });
}

export function getAllUsers() {
  return fetchAllUsers();
}

export function deleteUser(userId) {
  return fetchJson(base, `/users/${userId}`, { method: "DELETE" });
}

export function toggleUserStatus(userId) {
  return fetchJson(base, `/users/${userId}/toggle-status`, { method: "PUT" });
}

/* ---------- STUDENT MANAGEMENT ---------- */
export function fetchAllStudents() {
  return fetchJson(base, "/students", { method: "GET" });
}

export function getAllStudents() {
  return fetchAllStudents();
}

export function createStudent(payload) {
  return fetchJson(base, "/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(studentId, payload) {
  return fetchJson(base, `/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStudent(studentId) {
  return fetchJson(base, `/students/${studentId}`, { method: "DELETE" });
}

/* ---------- FACULTY MANAGEMENT ---------- */
export function fetchAllFaculty() {
  return fetchJson(base, "/faculty", { method: "GET" });
}

export function getAllFaculty() {
  return fetchAllFaculty();
}

export function createFaculty(payload) {
  return fetchJson(base, "/faculty", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFaculty(facultyId, payload) {
  return fetchJson(base, `/faculty/${facultyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteFaculty(facultyId) {
  return fetchJson(base, `/faculty/${facultyId}`, { method: "DELETE" });
}

/* ---------- COURSE MANAGEMENT ---------- */
export function fetchAllCourseSections() {
  return fetchJson(base, "/course_sections", { method: "GET" });
}

export function getAllCourses() {
  return fetchAllCourseSections();
}

export function getCourses() {
  return fetchAllCourseSections();
}

export function fetchCourses() {
  return fetchAllCourseSections();
}

export function createCourse(payload) {
  return fetchJson(base, "/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCourseSection(payload) {
  return fetchJson(base, "/course_sections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourseSection(sectionId, payload) {
  return fetchJson(base, `/course_sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourseSection(sectionId) {
  return fetchJson(base, `/course_sections/${sectionId}`, { method: "DELETE" });
}

/* ---------- LEAVE MANAGEMENT ---------- */
export function fetchPendingLeaves() {
  return fetchJson(base, "/leaves/pending", { method: "GET" });
}

export function getPendingLeaves() {
  return fetchPendingLeaves();
}

export function getAllLeaves() {
  return fetchJson(base, "/leaves", { method: "GET" });
}

export function fetchAllLeaves() {
  return getAllLeaves();
}

export function approveLeave(leaveId) {
  return fetchJson(base, `/leaves/${leaveId}/approve`, { method: "PUT" }); // FIXED: Changed to PUT
}

export function rejectLeave(leaveId) {
  return fetchJson(base, `/leaves/${leaveId}/reject`, { method: "PUT" }); // FIXED: Changed to PUT
}

/* ---------- FEE MANAGEMENT ---------- */
export function fetchAllFees() {
  return fetchJson(base, "/fees", { method: "GET" });
}

export function getAllFees() {
  return fetchAllFees();
}

export function getFees() {
  return fetchAllFees();
}

export function fetchStudentFees() {
  return fetchAllFees();
}

export function markFeePaid(feeId) {
  return fetchJson(base, `/fees/${feeId}/mark-paid`, { method: "PUT" });
}

export function updateFeeStatus(feeId) {
  return markFeePaid(feeId);
}

export function addFeeRecord(payload) {
  return fetchJson(base, "/fees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createFee(payload) {
  return addFeeRecord(payload);
}

// ADD MISSING FEE EXPORTS
export function updateStudentFee(feeId, payload) {
  return fetchJson(base, `/fees/${feeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getFeeBreakdown() {
  return fetchJson(base, "/fees/breakdown", { method: "GET" });
}

/* ---------- ATTENDANCE MANAGEMENT ---------- */
export function markFacultyAttendance(payload) {
  return fetchJson(base, "/faculty-attendance/mark", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getFacultyAttendance(date) {
  return fetchJson(base, `/faculty-attendance/${date}`, { method: "GET" });
}

export function fetchFacultyAttendance(date) {
  return getFacultyAttendance(date);
}

export function markBulkFacultyAttendance(payload) {
  return fetchJson(base, "/faculty-attendance/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- DEPARTMENT MANAGEMENT ---------- */
export function fetchAllDepartments() {
  return fetchJson(base, "/departments", { method: "GET" });
}

export function getAllDepartments() {
  return fetchAllDepartments();
}

export function getDepartments() {
  return fetchAllDepartments();
}

export function createDepartment(payload) {
  return fetchJson(base, "/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addDepartment(payload) {
  return createDepartment(payload);
}

export function updateDepartment(deptId, payload) {
  return fetchJson(base, `/departments/${deptId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDepartment(deptId) {
  return fetchJson(base, `/departments/${deptId}`, { method: "DELETE" });
}

/* ---------- COURSE REGISTRATION ---------- */
export function enrollStudent(payload) {
  return fetchJson(base, "/enroll-student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function dropStudent(payload) {
  return fetchJson(base, "/drop-student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminEnrollStudent(payload) {
  return enrollStudent(payload);
}

export function adminDropStudent(payload) {
  return dropStudent(payload);
}

// ADD MISSING COURSE MANAGEMENT EXPORTS
export function getStudentsWithEnrollments() {
  return fetchJson(base, "/course-management/students", { method: "GET" });
}

export function adminEnrollStudentInCourse(payload) {
  return fetchJson(base, "/course-management/enroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminDropStudentFromCourse(payload) {
  return fetchJson(base, "/course-management/drop", {
    method: "POST", 
    body: JSON.stringify(payload),
  });
}

/* ---------- ANNOUNCEMENTS ---------- */
export function createAnnouncement(payload) {
  return fetchJson(base, "/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAnnouncements() {
  return fetchJson(base, "/announcements", { method: "GET" });
}

export function deleteAnnouncement(announcementId) {
  return fetchJson(base, `/announcements/${announcementId}`, { method: "DELETE" });
}

/* ---------- STATUS TOGGLES ---------- */
export function toggleStudentStatus(studentId) {
  return fetchJson(base, `/students/${studentId}/toggle-status`, { 
    method: "PUT" 
  });
}

export function toggleFacultyStatus(facultyId) {
  return fetchJson(base, `/faculty/${facultyId}/toggle-status`, { 
    method: "PUT" 
  });
}