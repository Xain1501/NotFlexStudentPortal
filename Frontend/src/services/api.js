import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post("/api/auth/login", { username, password }),
  register: (data) => api.post("/api/auth/register", data),
  getMe: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

// Student API
export const studentAPI = {
  getDashboard: () => api.get("/api/student/dashboard"),
  getTranscript: () => api.get("/api/student/transcript"),
  getMarks: () => api.get("/api/student/marks"),
  getAttendance: () => api.get("/api/student/attendance"),
  getFees: () => api.get("/api/student/fees"),
  getEnrolledCourses: () => api.get("/api/student/courses/enrolled"),
  enrollCourse: (sectionId) =>
    api.post("/api/student/courses/enroll", { section_id: sectionId }),
  unenrollCourse: (sectionId) =>
    api.post("/api/student/courses/unenroll", { section_id: sectionId }),
  getAnnouncements: () => api.get("/api/student/announcements"),
};

// Faculty API
export const facultyAPI = {
  getDashboard: () => api.get("/api/faculty/dashboard"),
  getCourses: () => api.get("/api/faculty/courses"),
  applyLeave: (data) => api.post("/api/faculty/leave/apply", data),
  getLeaves: () => api.get("/api/faculty/leaves"),
  getAnnouncements: () => api.get("/api/faculty/announcements"),
  createAnnouncement: (data) => api.post("/api/faculty/announcements", data),
  deleteAnnouncement: (announcementId) =>
    api.delete(`/api/faculty/announcements/${announcementId}`),
  getCourseStudents: (sectionId) =>
    api.get(`/api/faculty/courses/${sectionId}/students`),
  getCourseAttendance: (sectionId, date) =>
    api.get(`/api/faculty/courses/${sectionId}/attendance`, {
      params: { date },
    }),
  markAttendance: (data) => api.post("/api/faculty/attendance/mark", data),
  markBulkAttendance: (attendanceData) =>
    api.post("/api/faculty/attendance/mark-bulk", {
      attendance: attendanceData,
    }),
  uploadMarks: (data) => api.post("/api/faculty/marks/upload", data),
};

// Course API
export const courseAPI = {
  getAvailableCourses: (semester, year) =>
    api.get("/api/courses/available", { params: { semester, year } }),
  checkSeats: (sectionId) =>
    api.get("/api/courses/check-seats", { params: { section_id: sectionId } }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get("/api/admin/dashboard"),

  // Users
  getAllUsers: () => api.get("/api/admin/users"),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  toggleUserStatus: (userId) =>
    api.put(`/api/admin/users/${userId}/toggle-status`),

  // Students
  getAllStudents: () => api.get("/api/admin/students"),
  getStudent: (studentId) => api.get(`/api/admin/students/${studentId}`),
  createStudent: (data) => api.post("/api/admin/students", data),
  updateStudent: (studentId, data) =>
    api.put(`/api/admin/students/${studentId}`, data),
  deleteStudent: (studentId) => api.delete(`/api/admin/students/${studentId}`),
  toggleStudentStatus: (studentId) =>
    api.put(`/api/admin/students/${studentId}/toggle-status`),

  // Faculty
  getAllFaculty: () => api.get("/api/admin/faculty"),
  getFaculty: (facultyId) => api.get(`/api/admin/faculty/${facultyId}`),
  createFaculty: (data) => api.post("/api/admin/faculty", data),
  updateFaculty: (facultyId, data) =>
    api.put(`/api/admin/faculty/${facultyId}`, data),
  deleteFaculty: (facultyId) => api.delete(`/api/admin/faculty/${facultyId}`),
  toggleFacultyStatus: (facultyId) =>
    api.put(`/api/admin/faculty/${facultyId}/toggle-status`),

  // Departments
  getDepartments: () => api.get("/api/admin/departments"),

  // Courses
  getAllCourseSections: () => api.get("/api/admin/course_sections"),
  createCourse: (data) => api.post("/api/admin/courses", data),
  createCourseSection: (data) => api.post("/api/admin/course_sections", data),
  updateCourseSection: (sectionId, data) =>
    api.put(`/api/admin/course_sections/${sectionId}`, data),

  // Enrollment
  enrollStudent: (studentId, sectionId) =>
    api.post("/api/admin/enroll-student", {
      student_id: studentId,
      section_id: sectionId,
    }),
  dropStudent: (enrollmentId) =>
    api.post("/api/admin/drop-student", { enrollment_id: enrollmentId }),

  // Fees
  getAllFees: () => api.get("/api/admin/fees"),
  addFeeRecord: (data) => api.post("/api/admin/fees", data),
  markFeePaid: (feeId) => api.put(`/api/admin/fees/${feeId}/mark-paid`),

  // Leaves
  getAllLeaves: () => api.get("/api/admin/leaves"),
  getPendingLeaves: () => api.get("/api/admin/leaves/pending"),
  approveLeave: (leaveId) => api.post(`/api/admin/leave/${leaveId}/approve`),
  rejectLeave: (leaveId, data) =>
    api.post(`/api/admin/leave/${leaveId}/reject`, data),

  // Announcements
  getAnnouncements: () => api.get("/api/admin/announcements"),
  createAnnouncement: (data) => api.post("/api/admin/announcements", data),
  deleteAnnouncement: (announcementId) =>
    api.delete(`/api/admin/announcements/${announcementId}`),

  // Attendance
  getFacultyAttendance: (date) =>
    api.get(`/api/admin/faculty-attendance/${date}`),
  markFacultyAttendance: (data) =>
    api.post("/api/admin/faculty-attendance/mark", data),
  markBulkFacultyAttendance: (attendanceData) =>
    api.post("/api/admin/faculty-attendance/mark-bulk", {
      attendance: attendanceData,
    }),
  markStudentAttendance: (data) =>
    api.post("/api/admin/student-attendance/mark", data),
  uploadMarks: (enrollmentId, marks) =>
    api.post("/api/admin/marks/upload", { enrollment_id: enrollmentId, marks }),
};

export default api;
