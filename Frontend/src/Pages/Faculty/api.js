// small demo API layer (in-memory). Replace with real fetch/axios calls to your backend.
import teacherData from '../Faculty/teacherData';

// simulate latency
const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export async function getTeacher() {
  await delay();
  // return a deep clone to avoid accidental mutation
  return JSON.parse(JSON.stringify(teacherData));
}

export async function saveAttendanceRecord(rec) {
  await delay();
  teacherData.attendanceRecords.push(rec);
  return { success: true };
}

export async function applyLeaveRequest(req) {
  await delay();
  teacherData.leaves.push({ ...req, status: 'Pending', appliedAt: new Date().toISOString() });
  return { success: true };
}

export async function saveMarksRecord(rec) {
  await delay();
  teacherData.marksRecords.push(rec);
  return { success: true };
}