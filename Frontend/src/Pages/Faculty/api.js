/**
 * Faculty-specific API calls - Complete with all exports
 */

import { fetchJson } from "../../api/client";

const base = "/faculty";

/* ---------- DASHBOARD ---------- */
export function getFacultyDashboard() {
  return fetchJson(base, "/dashboard", { method: "GET" });
}

export function fetchFacultyDashboard() {
  return getFacultyDashboard();
}

export function getTeacher() {
  return fetchJson(base, "/me", { method: "GET" });
}

/* ---------- COURSES ---------- */
export function getTeachingCourses() {
  return fetchJson(base, "/courses", { method: "GET" });
}

export function getCourseStudents(sectionId) {
  return fetchJson(base, `/courses/${sectionId}/students`, { method: "GET" });
}

/* ---------- ATTENDANCE ---------- */
export function getCourseAttendance(sectionId, date = null) {
  const endpoint = date 
    ? `/courses/${sectionId}/attendance?date=${date}`
    : `/courses/${sectionId}/attendance`;
  return fetchJson(base, endpoint, { method: "GET" });
}

export function markAttendance(payload) {
  return fetchJson(base, "/attendance/mark", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markBulkAttendance(payload) {
  return fetchJson(base, "/attendance/mark-bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- GRADING ---------- */
export function uploadMarks(payload) {
  return fetchJson(base, "/marks/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- ANNOUNCEMENTS ---------- */
export function getFacultyAnnouncements() {
  return fetchJson(base, "/announcements", { method: "GET" });
}

export function createAnnouncement(payload) {
  return fetchJson(base, "/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- LEAVE MANAGEMENT ---------- */
export function applyForLeave(payload) {
  return fetchJson(base, "/leave/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Add the missing export
export function applyLeaveRequest(payload) {
  return applyForLeave(payload);
}

export function getMyLeaves() {
  return fetchJson(base, "/leaves", { method: "GET" });
}

/* ---------- TIMETABLE ---------- */
export function getTimetable() {
  return fetchJson(base, "/timetable", { method: "GET" });
}