import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/courseregistration.css";

export default function CourseRegistration() {
  const [courses, setCourses] = useState([
    { id: "CS301", name: "Data Structures", credits: 3, enrolled: false },
    { id: "CS302", name: "Operating Systems", credits: 3, enrolled: true },
    { id: "CS303", name: "Databases", credits: 3, enrolled: false },
    { id: "CS304", name: "Computer Networks", credits: 3, enrolled: false },
    { id: "CS305", name: "Software Engineering", credits: 2, enrolled: false },
  ]);

  const toggleEnroll = (courseId) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, enrolled: !c.enrolled } : c))
    );
  };

  const totalEnrolled = courses.filter((c) => c.enrolled).length;
  const totalCredits = courses
    .filter((c) => c.enrolled)
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="course-reg-page my-4">
      <h1 className="course-title text-center">Course Registration</h1>

      <div className="reg-container mt-4">
        <div className="reg-summary mb-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>Enrolled:</strong> {totalEnrolled} course{totalEnrolled !== 1 ? "s" : ""}
            {"  "}
            <span className="text-muted">({totalCredits} credits)</span>
          </div>
          
        </div>

        <div className="table-responsive">
          <table className="table course-table">
            <thead>
              <tr>
                <th className="text-start" scope="col">Course No</th>
                <th className="text-start" scope="col">Course Name</th>
                <th className="text-start" scope="col">Credit Hours</th>
                <th className="text-start" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className={c.enrolled ? "enrolled-row" : ""}>
                  <th className="text-start" scope="row">{c.id}</th>
                  <td className="text-start">{c.name}</td>
                  <td className="text-start">{c.credits}</td>
                  <td className="text-start">
                    <button
                      className={`btn btn-sm enroll-btn ${c.enrolled ? "btn-outline-danger" : "btn-primary"}`}
                      onClick={() => toggleEnroll(c.id)}
                    >
                      {c.enrolled ? "Unenroll" : "Enroll"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 d-flex justify-content-end">
          <button
            className="btn btn-success btn-sm"
            onClick={() =>
              alert(
                `Confirmed enrollment for ${totalEnrolled} course${totalEnrolled !== 1 ? "s" : ""} (${totalCredits} credits).`
              )
            }
            disabled={totalEnrolled === 0}
          >
            Confirm Registration
          </button>
        </div>
      </div>
    </div>
  );
}