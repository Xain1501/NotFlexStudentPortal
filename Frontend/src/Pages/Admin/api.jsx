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
 *    saveFacultyAttendance,
 *    fetchFacultyAttendance,
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

const API_BASE = '/api/admin'; // change to your backend base path if needed
const DEMO_KEY = 'uni_admin_demo_v1';

/* Small helper to simulate latency for demo fallback */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Helper: try real fetch then fallback to demo */
async function tryFetch(path, options = {}, fallbackFn) {
  try {
    // attempt real backend call
    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    // fallback to demo function if provided
    if (typeof fallbackFn === 'function') {
      await delay(250); // make it feel realistic
      return fallbackFn();
    }
    throw err;
  }
}

/* Demo storage helpers */
function seededDemoData() {
  const stored = localStorage.getItem(DEMO_KEY);
  if (stored) return JSON.parse(stored);

  const demo = {
    admin: {
      name: 'Admin User',
      email: 'admin@uni.edu',
      department: 'Academic Affairs',
      contact: '03001234567',
      announcements: [
        'Exam timetable published next week.',
        'Faculty meeting on Friday 3pm in Conference Room B.'
      ]
    },
    faculty: [
      { id: 'F1', name: 'Dr. Aisha Khan' },
      { id: 'F2', name: 'Mr. Ali Raza' }
    ],
    leaves: [
      { id: 'L1', facultyId: 'F1', faculty: 'Dr. Aisha Khan', from: '2025-11-20', to: '2025-11-22', type: 'Casual', reason: 'Conference', status: 'Pending', appliedOn: '2025-11-02' },
      { id: 'L2', facultyId: 'F2', faculty: 'Mr. Ali Raza', from: '2025-12-01', to: '2025-12-02', type: 'Sick', reason: 'Medical', status: 'Pending', appliedOn: '2025-11-05' }
    ],
    facultyAttendance: [], // { id, date, session, present: ['F1', ...] }
    courses: [
      { id: 'CS301-A', code: 'CS301', name: 'Data Structures', section: 'A', students: [{ roll: 'S1', name: 'Ali' }, { roll: 'S2', name: 'Sara' }] },
      { id: 'CS302-B', code: 'CS302', name: 'Operating Systems', section: 'B', students: [{ roll: 'S3', name: 'Hassan' }] }
    ],
    students: [
      { roll: 'S1', name: 'Ali' }, { roll: 'S2', name: 'Sara' }, { roll: 'S3', name: 'Hassan' }, { roll: 'S4', name: 'Zara' }
    ],
    fees: [
      { roll: 'S1', name: 'Ali', fee: 20000 },
      { roll: 'S2', name: 'Sara', fee: 18000 },
      { roll: 'S3', name: 'Hassan', fee: 20000 }
    ]
  };

  localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
  return demo;
}

function readDemo() {
  return seededDemoData();
}
function writeDemo(data) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}

/* ---------- Admin API functions ---------- */

/* Admin summary / dashboard data */
export async function getAdmin() {
  return tryFetch('/admin', {}, () => {
    const d = readDemo();
    return {
      ...d.admin,
      courses: d.courses
    };
  });
}

/* Faculty leaves (pending/all) */
export async function fetchFacultyLeaves() {
  return tryFetch('/leaves', {}, () => {
    const d = readDemo();
    return d.leaves.slice().sort((a,b) => (b.appliedOn || '').localeCompare(a.appliedOn || ''));
  });
}

export async function approveLeaveRequest(id) {
  return tryFetch(`/leaves/${id}/approve`, { method: 'POST' }, () => {
    const d = readDemo();
    const idx = d.leaves.findIndex(l => l.id === id);
    if (idx >= 0) d.leaves[idx].status = 'Approved';
    writeDemo(d);
    return { ok: true };
  });
}

export async function rejectLeaveRequest(id) {
  return tryFetch(`/leaves/${id}/reject`, { method: 'POST' }, () => {
    const d = readDemo();
    const idx = d.leaves.findIndex(l => l.id === id);
    if (idx >= 0) d.leaves[idx].status = 'Rejected';
    writeDemo(d);
    return { ok: true };
  });
}

/* Faculty list */
export async function fetchFacultyList() {
  return tryFetch('/faculty', {}, () => {
    const d = readDemo();
    return d.faculty.slice();
  });
}

/* Faculty attendance */
export async function saveFacultyAttendance(payload) {
  // payload: { date, session, present: ['F1','F2'] }
  return tryFetch('/faculty-attendance', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }, () => {
    const d = readDemo();
    const rec = { id: `fa-${Date.now()}`, ...payload };
    d.facultyAttendance.unshift(rec);
    writeDemo(d);
    return rec;
  });
}

export async function fetchFacultyAttendance() {
  return tryFetch('/faculty-attendance', {}, () => {
    const d = readDemo();
    return d.facultyAttendance.slice();
  });
}

/* Courses & Students */
export async function fetchCourses() {
  return tryFetch('/courses', {}, () => {
    const d = readDemo();
    return d.courses.slice();
  });
}

export async function fetchStudents() {
  return tryFetch('/students', {}, () => {
    const d = readDemo();
    return d.students.slice();
  });
}

/* Drop a student from a course */
export async function dropStudentFromCourse({ courseId, roll }) {
  return tryFetch(`/courses/${courseId}/drop`, { method: 'POST', body: JSON.stringify({ roll }), headers: { 'Content-Type': 'application/json' } }, () => {
    const d = readDemo();
    const idx = d.courses.findIndex(c => c.id === courseId);
    if (idx >= 0) {
      d.courses[idx].students = (d.courses[idx].students || []).filter(s => s.roll !== roll);
      writeDemo(d);
      return { ok: true };
    }
    throw new Error('Course not found');
  });
}

/* Assign / enroll a student to a course */
export async function assignStudentToCourse({ courseId, roll }) {
  return tryFetch(`/courses/${courseId}/assign`, { method: 'POST', body: JSON.stringify({ roll }), headers: { 'Content-Type': 'application/json' } }, () => {
    const d = readDemo();
    const course = d.courses.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');
    const student = d.students.find(s => s.roll === roll) || { roll, name: roll };
    course.students = course.students || [];
    if (!course.students.find(s => s.roll === roll)) course.students.push(student);
    writeDemo(d);
    return { ok: true };
  });
}

/* Fees */
export async function fetchStudentFees() {
  return tryFetch('/fees', {}, () => {
    const d = readDemo();
    return d.fees.slice();
  });
}

export async function updateStudentFee({ roll, fee }) {
  return tryFetch(`/fees/${roll}`, { method: 'PUT', body: JSON.stringify({ fee }), headers: { 'Content-Type': 'application/json' } }, () => {
    const d = readDemo();
    const idx = d.fees.findIndex(f => f.roll === roll);
    if (idx >= 0) d.fees[idx].fee = fee;
    else d.fees.push({ roll, name: roll, fee });
    writeDemo(d);
    return { ok: true };
  });
}

/* Utility: reset demo data (for development) */
export function resetDemoData() {
  localStorage.removeItem(DEMO_KEY);
  return seededDemoData();
}

/* Expose demo read/write for debugging */
export function _readDemoForDebug() {
  return readDemo();
}