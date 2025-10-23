import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./studentlogin.css";
import 'bootstrap/dist/css/bootstrap.min.css';


const studentDetails = {
  name: "Madiha Aslam",
  rollNo: "23k-0846",
  department: "Computer Science",
  year: "3rd Year",
  DOB: "25-08-2005",
  CNIC: "42101-1234567-8",
  contactno: "03001234567",
};

const PersonalDetails = {
  FatherName: "Muhammad Aslam",
  MotherName: "Deeba Aslam",
  Address: "123 Main St, Karachi",
  parent_contactno: "03001234567",
  email: "madiha.aslam@example.com",
  Nationality: "Pakistani",
};

const enrolledCourses = [
  { code: "CS301", name: "Data Structures", attendanceLeft: 3 },
  { code: "CS302", name: "Operating Systems", attendanceLeft: 2 },
  { code: "CS303", name: "Databases", attendanceLeft: 5 },
];

export default function StudentHome() {
  return (
    <div className="student-page">
      {/* Top Menu */}
      <nav className="menu-bar">
        <ul>
          <li>
            <Link to="/student">Home</Link>
          </li>
          <li>
            <Link to="/transcript">Transcript</Link>
          </li>
          <li>
            <Link to="/marks">Marks</Link>
          </li>
          <li>
            <Link to="/attendance">Attendance</Link>
          </li>
          <li>
            <Link to="/timetable">Timetable</Link>
          </li>
          <li>
            <Link to="/fee">Fee Detail</Link>
          </li>
          <li>
            <Link to="/courses">Course Registration</Link>
          </li>
        </ul>
      </nav>

      <div className="student-content">
        <Outlet />
      </div>

      {/* Current Page Content */}

 <div className="container mt-4">
        <div className="row gx-4 gy-3 align-items-stretch">
          <div className="col-md-4 d-flex">
            <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
              <h3 className="mb-3">Student Details</h3>
              <p className="mb-2"><strong>Name:</strong> {studentDetails.name}</p>
              <p className="mb-2"><strong>Roll No:</strong> {studentDetails.rollNo}</p>
              <p className="mb-2"><strong>Department:</strong> {studentDetails.department}</p>
              <p className="mb-2"><strong>Year:</strong> {studentDetails.year}</p>
              <p className="mb-2"><strong>CNIC NO:</strong> {studentDetails.CNIC}</p>
              <p className="mb-2"><strong>DOB:</strong> {studentDetails.DOB}</p>
              <p className="mb-2"><strong>Contact No:</strong> {studentDetails.contactno}</p>
            </section>
          </div>


        <div className="col-md-4 d-flex">
          {/* Personal Details */}
          <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
             
              <h3 className="mb-3">Personal Details</h3>
              <p className="mb-2"><strong>Father Name:</strong> {PersonalDetails.FatherName}</p>
              <p className="mb-2"><strong>Mother Name:</strong> {PersonalDetails.MotherName}</p>
              <p className="mb-2"><strong>Address:</strong> {PersonalDetails.Address}</p>
              <p className="mb-2"><strong>Parent Contact No:</strong> {PersonalDetails.parent_contactno}</p>
              <p className="mb-2"><strong>Email:</strong> {PersonalDetails.email}</p>
              <p className="mb-2"><strong>Nationality:</strong> {PersonalDetails.Nationality}</p>
            </section>
        
        </div>


        <div className="col-md-4 d-flex">
          {/* Announcements */}
            <section className="student-details-card d-flex flex-column h-100 p-4 text-center">
              <h3 className="mb-3">Announcements</h3>
              <p className="mb-2">kal chutte hai</p>
        </section>

        </div>
      </div>

      <div className="student-content mt-4">
        {/* Home Page Details */}
        
        <section className="courses-card d-flex flex-column h-100 p-4 text-center">
         
          <h3>Enrolled Courses</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Name</th>
                <th>Attendance Left</th>
              </tr>
            </thead>
            <tbody>
              {enrolledCourses.map((course) => (
                <tr key={course.code}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>
                    <button className="gradient-btn">
                      {course.attendanceLeft}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
   </div>
);
}
