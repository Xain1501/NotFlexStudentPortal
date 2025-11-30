// Student API helper — uses shared client
import { fetchJson } from "../../api/client";

const base = "/student";

export function getStudentDashboard() {
  return fetchJson(base, "/dashboard", { method: "GET" });
}

export function getTranscript() {
  return fetchJson(base, "/transcript", { method: "GET" });
}

export function getMarks() {
  return fetchJson(base, "/marks", { method: "GET" });
}

export function getAttendance() {
  return fetchJson(base, "/attendance", { method: "GET" });
}

export function getFees() {
  return fetchJson(base, "/fees", { method: "GET" });
}

export function getEnrolledCourses() {
  return fetchJson(base, "/courses/enrolled", { method: "GET" });
}

export function getAnnouncements() {
  return fetchJson(base, "/announcements", { method: "GET" });
}

// payload should be { course_id: <id> } or full body required by your backend
export function enrollCourse(payload) {
  return fetchJson(base, "/courses/enroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function unenrollCourse(payload) {
  return fetchJson(base, "/courses/unenroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
