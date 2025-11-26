import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/courseregistration.css";

const REG_KEY = "course_registrations";

function loadRegistrations() {
  try {
    const raw = localStorage.getItem(REG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadRegistrations error:", e);
    return [];
  }
}
function saveRegistrations(list) {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(list));
    // notify other tabs + same-tab listeners
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("course_registrations_updated"));
  } catch (e) {
    console.error("saveRegistrations error:", e);
  }
}

export default function CourseRegistration() {
  const [courses, setCourses] = useState([
    { id: "CS301", name: "Data Structures", credits: 3 },
    { id: "CS302", name: "Operating Systems", credits: 3 },
    { id: "CS303", name: "Databases", credits: 3 },
    { id: "CS304", name: "Computer Networks", credits: 3 },
    { id: "CS305", name: "Software Engineering", credits: 2 },
  ]);

  // current student fields (simple form in this UI)
  const [studentRoll, setStudentRoll] = useState("");
  const [studentName, setStudentName] = useState("");

  // local map of enrolled course ids for the current student
  const [enrolledSet, setEnrolledSet] = useState(new Set());

  useEffect(() => {
    // on mount (or when studentRoll changes), set enrolled flags from localStorage for this roll
    const onRegsChanged = () => {
      const regs = loadRegistrations();
      if (!studentRoll) {
        setEnrolledSet(new Set());
        return;
      }
      const enrolledIds = regs
        .filter((r) => String(r.student?.roll) === String(studentRoll))
        .map((r) => r.courseId);
      setEnrolledSet(new Set(enrolledIds));
    };

    onRegsChanged();
    window.addEventListener("storage", onRegsChanged);
    window.addEventListener("course_registrations_updated", onRegsChanged);
    return () => {
      window.removeEventListener("storage", onRegsChanged);
      window.removeEventListener("course_registrations_updated", onRegsChanged);
    };
  }, [studentRoll]);

  const toggleEnroll = (courseId) => {
    if (!studentRoll || !studentName) {
      return alert("Enter your Roll and Name before enrolling.");
    }
    const regs = loadRegistrations();
    const idx = regs.findIndex(
      (r) => r.courseId === courseId && String(r.student?.roll) === String(studentRoll)
    );

    if (idx === -1) {
      // enroll
      const newReg = {
        courseId,
        student: { roll: studentRoll, name: studentName },
        enrolledAt: new Date().toISOString(),
      };
      const updated = [newReg, ...regs];
      saveRegistrations(updated);
      setEnrolledSet((prev) => new Set(prev).add(courseId));
    } else {
      // unenroll
      const updated = regs.filter(
        (r) => !(r.courseId === courseId && String(r.student?.roll) === String(studentRoll))
      );
      saveRegistrations(updated);
      setEnrolledSet((prev) => {
        const s = new Set(prev);
        s.delete(courseId);
        return s;
      });
    }
  };

  const totalEnrolled = courses.filter((c) => enrolledSet.has(c.id)).length;
  const totalCredits = courses
    .filter((c) => enrolledSet.has(c.id))
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="course-reg-page my-4">
      <h1 className="course-title text-center">Course Registration</h1>

      <div className="reg-container mt-4">
        {/* Student info */}
        <div className="mb-3 row gx-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Your Roll (e.g. S1001)"
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Your Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div className="col-md-5 text-end">
            <strong>Enrolled:</strong> {totalEnrolled}{" "}
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
              {courses.map((c) => {
                const enrolled = enrolledSet.has(c.id);
                return (
                  <tr key={c.id} className={enrolled ? "enrolled-row" : ""}>
                    <th className="text-start" scope="row">{c.id}</th>
                    <td className="text-start">{c.name}</td>
                    <td className="text-start">{c.credits}</td>
                    <td className="text-start">
                      {enrolled ? (
                        <span className="badge bg-success">Enrolled</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary enroll-btn"
                          onClick={() => toggleEnroll(c.id)}
                        >
                          Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 d-flex justify-content-end">
          <button
            className="btn btn-success btn-sm"
            onClick={() =>
              alert(
                `Confirmed enrollment for ${totalEnrolled} course${
                  totalEnrolled !== 1 ? "s" : ""
                } (${totalCredits} credits).`
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