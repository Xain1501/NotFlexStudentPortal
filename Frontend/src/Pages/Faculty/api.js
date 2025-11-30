// small demo API layer (in-memory). Replace with real fetch/axios calls to your app.
import teacherData from "../Faculty/teacherData";
import { fetchJson } from "../../api/client";

// remove local fetchJson function (we use imported one).
const base = "/faculty";

export function getFacultyDashboard() {
  return fetchJson(base, "/dashboard", { method: "GET" });
}

export function applyLeave(payload) {
  return fetchJson(base, "/leave/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getLeaves() {
  return fetchJson(base, "/leaves", { method: "GET" });
}

export function getCourseStudents(sectionId) {
  return fetchJson(base, `/courses/${sectionId}/students`, { method: "GET" });
}

// keep the in-memory helpers below if you rely on them for mock data/testing
const delay = (ms = 200) => new Promise((res) => setTimeout(res, ms));

export async function getTeacher() {
  await delay();
  return JSON.parse(JSON.stringify(teacherData));
}

export async function saveAttendanceRecord(rec) {
  await delay();
  teacherData.attendanceRecords.push(rec);
  return { success: true };
}

export async function applyLeaveRequest(req) {
  await delay();
  teacherData.leaves.push({
    ...req,
    status: "Pending",
    appliedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function saveMarksRecord(rec) {
  await delay();
  teacherData.marksRecords.push(rec);
  return { success: true };
}
