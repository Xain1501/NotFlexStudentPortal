/**
 * Admin-specific API calls - Updated to match your fetchJson pattern
 */

import { fetchJson } from "../../api/client";

const base = "/admin";

export function getAdminDashboard() {
  return fetchJson(base, "/dashboard", { method: "GET" });
}

export function fetchAllUsers() {
  return fetchJson(base, "/users", { method: "GET" });
}

export function deleteUser(userId) {
  return fetchJson(base, `/users/${userId}`, { method: "DELETE" });
}

export function toggleUserStatus(userId) {
  return fetchJson(base, `/users/${userId}/toggle-status`, { method: "PUT" });
}

export function fetchAllStudents() {
  return fetchJson(base, "/students", { method: "GET" });
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

export function fetchAllFaculty() {
  return fetchJson(base, "/faculty", { method: "GET" });
}

export function createFaculty(payload) {
  return fetchJson(base, "/faculty", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAllCourseSections() {
  return fetchJson(base, "/course_sections", { method: "GET" });
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

export function fetchPendingLeaves() {
  return fetchJson(base, "/leaves/pending", { method: "GET" });
}

export function approveLeave(leaveId) {
  return fetchJson(base, `/leave/${leaveId}/approve`, { method: "POST" });
}

export function rejectLeave(leaveId) {
  return fetchJson(base, `/leave/${leaveId}/reject`, { method: "POST" });
}

export function fetchAllFees() {
  return fetchJson(base, "/fees", { method: "GET" });
}

export function markFeePaid(feeId) {
  return fetchJson(base, `/fees/${feeId}/mark-paid`, { method: "PUT" });
}

export function addFeeRecord(payload) {
  return fetchJson(base, "/fees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markFacultyAttendance(payload) {
  return fetchJson(base, "/faculty-attendance/mark", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getFacultyAttendance(date) {
  return fetchJson(base, `/faculty-attendance/${date}`, { method: "GET" });
}