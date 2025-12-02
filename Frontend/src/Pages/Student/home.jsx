import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./home.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { getStudentDashboard, getAnnouncements, getEnrolledCourses } from "./api";

const ANNOUNCEMENTS_KEY = "globalAnnouncements";

// FIXED: Proper API-first announcements loading
async function loadGlobalAnnouncements() {
  try {
    // FIRST: Try to get fresh data from API
    const response = await getAnnouncements();
    console.log('📢 API Announcements Response:', response);
    
    if (response.success && response.data) {
      const announcements = response.data.announcements || response.data;
      
      // Cache the fresh data in localStorage
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
      return announcements;
    }
    
    // If API fails, fallback to cached data
    console.warn('API failed, using cached announcements');
    const cached = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return cached ? JSON.parse(cached) : [];
    
  } catch (error) {
    console.error('❌ Failed to fetch announcements:', error);
    
    // Fallback to cached data
    const cached = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export default function StudentHome() {
  const [announcements, setAnnouncements] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: Fetch all data from APIs
  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        console.log('🔄 Fetching student data from APIs...');

        // Fetch all data in parallel
        const [dashboardResponse, announcementsResponse, coursesResponse] = await Promise.all([
          getStudentDashboard(),
          loadGlobalAnnouncements(),
          getEnrolledCourses()
        ]);

        console.log('📊 Dashboard API Response:', dashboardResponse);
        console.log('📢 Announcements API Response:', announcementsResponse);
        console.log('📚 Courses API Response:', coursesResponse);

        // Process dashboard data
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboard = dashboardResponse.data;
          setStudentData({
            firstname: dashboard.student?.name?.split(' ')[0] || 'N/A',
            lastname: dashboard.student?.name?.split(' ')[1] || 'N/A',
            DOB: dashboard.student?.date_of_birth || 'N/A',
            contactno: dashboard.student?.phone || 'N/A',
            CNIC: dashboard.student?.cnic || 'N/A',
            enrolleddate: dashboard.student?.enrollment_date || 'N/A',
            department: dashboard.student?.department || 'N/A',
            currentsemester: dashboard.student?.year || 'N/A',
            status: dashboard.student?.status || 'Active',
            email: dashboard.student?.email || 'N/A',
            roll_no: dashboard.student?.roll_no || 'N/A'
          });
        } else {
          throw new Error('Failed to load student dashboard');
        }

        // Process announcements
        if (announcementsResponse && Array.isArray(announcementsResponse)) {
          const studentCourseCodes = new Set(
            coursesResponse?.data?.enrollments?.map(c => c.course_code) || []
          );
          
          const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000; // last 2 days
          const filtered = announcementsResponse.filter(
            (a) =>
              ((a.target && a.target === "students") ||
                (a.courseCode && studentCourseCodes.has(a.courseCode))) &&
              new Date(a.createdAt).getTime() >= cutoff
          );
          setAnnouncements(filtered);
        }

        // Process enrolled courses
        if (coursesResponse.success && coursesResponse.data) {
          const courses = coursesResponse.data.enrollments || coursesResponse.data;
          const formattedCourses = courses.map(course => ({
            code: course.course_code,
            name: course.course_name,
            absentClasses: course.absent_classes || 0,
            totalClasses: course.total_classes || 0,
            allowedAbsences: Math.floor((course.total_classes || 48) * 0.25), // 25% allowed
            attendancePercentage: course.attendance_percentage || 0,
            attendanceLeft: course.attendance_left || 0
          }));
          setEnrolledCourses(formattedCourses);
        }

      } catch (err) {
        console.error('❌ Error fetching student data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();

    // Keep the storage listener for real-time updates
    function onStorage(e) {
      if (e.key === ANNOUNCEMENTS_KEY) {
        const cached = localStorage.getItem(ANNOUNCEMENTS_KEY);
        const announcementsData = cached ? JSON.parse(cached) : [];
        setAnnouncements(announcementsData);
      }
    }

    function onLocalUpdate() {
      const cached = localStorage.getItem(ANNOUNCEMENTS_KEY);
      const announcementsData = cached ? JSON.parse(cached) : [];
      setAnnouncements(announcementsData);
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("globalAnnouncementsUpdated", onLocalUpdate);
    
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("globalAnnouncementsUpdated", onLocalUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="student-page">
        <div className="container d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading student data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-page">
        <div className="container d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="alert alert-danger">
            <h4>Error Loading Data</h4>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="container d-flex flex-column align-items-center">
        <h1 className="dashboard-title text-center mb-4">Student Dashboard</h1>
        
        {/* Top row with 2 cards */}
        <div className="row w-100 justify-content-center mb-4">
          {/* Student Details Card */}
          <div className="col-md-5 d-flex mb-3">
            <section className="card-custom h-100 w-100">
              <h5 className="card-title accent text-center">Student Details</h5>
              <div className="card-content text-left mt-3">
                {studentData ? (
                  <>
                    <p><strong>First Name:</strong> {studentData.firstname}</p>
                    <p><strong>Last Name:</strong> {studentData.lastname}</p>
                    <p><strong>Roll No:</strong> {studentData.roll_no}</p>
                    <p><strong>Email:</strong> {studentData.email}</p>
                    <p><strong>DOB:</strong> {studentData.DOB}</p>
                    <p><strong>Contact No:</strong> {studentData.contactno}</p>
                    <p><strong>CNIC NO:</strong> {studentData.CNIC}</p>
                    <p><strong>Enrollment Date:</strong> {studentData.enrolleddate}</p>
                    <p><strong>Department:</strong> {studentData.department}</p>
                    <p><strong>Current Semester:</strong> {studentData.currentsemester}</p>
                    <p><strong>Status:</strong> {studentData.status}</p>
                  </>
                ) : (
                  <p>No student data available</p>
                )}
              </div>
            </section>
          </div>

          {/* Announcements Card */}
          <div className="col-md-5 d-flex mb-3">
            <section className="card-custom h-100 w-100">
              <h5 className="card-title accent text-center">Announcements</h5>
              <div className="card-content text-left mt-3">
                {announcements.length ? (
                  <div className="announcement-list">
                    {announcements.map((a, i) => (
                      <div key={i} className="announcement-item">
                        <div className="announcement-meta">
                          {a.courseCode
                            ? `${a.courseCode}${a.section ? ` - ${a.section}` : ''}`
                            : ``}
                          {a.author ? ` — ${a.author}` : ""}
                        </div>
                        <div className="announcement-text">{a.text || a.message}</div>
                        <div className="announcement-date">
                          {new Date(a.createdAt || a.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="announcement-empty">
                    No recent announcements for your courses.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Enrolled Courses Box */}
        <div className="row w-100 justify-content-center mb-3">
          <div className="col-md-10 mb-3">
            <section className="card-custom">
              <h3 className="card-title accent text-center">Enrolled Courses</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Name</th>
                      <th>Attendance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledCourses.map((course) => {
                      const attendanceLeft = course.attendanceLeft || 
                        (course.allowedAbsences - course.absentClasses);
                      const isLowAttendance = attendanceLeft <= 2;
                      
                      return (
                        <tr key={course.code}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>
                            <button className={`gradient-btn ${isLowAttendance ? 'btn-warning' : ''}`}>
                              {attendanceLeft}{' '}
                              <span style={{ fontSize: 12 }}>
                                of {course.allowedAbsences} allowed
                              </span>
                            </button>
                            <br />
                            <small>Attendance: {course.attendancePercentage}%</small>
                          </td>
                          <td>
                            {attendanceLeft <= 0 ? (
                              <span style={{ color: "red", fontSize: 14 }}>
                                ❌ Minimum required
                              </span>
                            ) : isLowAttendance ? (
                              <span style={{ color: "orange", fontSize: 14 }}>
                                ⚠️ Low attendance
                              </span>
                            ) : (
                              <span style={{ color: "green", fontSize: 14 }}>
                                ✅ Good standing
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <div className="student-content mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}