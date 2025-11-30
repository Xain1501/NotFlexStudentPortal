import React, { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { getMarks } from "./api";
import "bootstrap/dist/css/bootstrap.min.css";

import "../Student/marks.css";

/*
  Marks page
  - Header with "Marks"
  - Courses list (left column on desktop, accordion on mobile)
  - Clicking a course shows marks breakdown for that course (right column on desktop)
*/

const courses = [
  {
    code: "CS301",
    name: "Data Structures",
    marks: [
      { title: "Assignment 1", score: 18, outOf: 20 },
      { title: "Quiz 1", score: 8, outOf: 10 },
      { title: "Midterm", score: 42, outOf: 60 },
      { title: "Assignment 2", score: 17, outOf: 20 },
      { title: "Final", score: 78, outOf: 100 },
    ],
  },
  {
    code: "CS302",
    name: "Operating Systems",
    marks: [
      { title: "Lab", score: 45, outOf: 50 },
      { title: "Quiz 1", score: 9, outOf: 10 },
      { title: "Midterm", score: 36, outOf: 60 },
      { title: "Final", score: 72, outOf: 100 },
    ],
  },
  {
    code: "CS303",
    name: "Databases",
    marks: [
      { title: "Assignment", score: 19, outOf: 20 },
      { title: "Quiz", score: 10, outOf: 10 },
      { title: "Project", score: 45, outOf: 50 },
      { title: "Final", score: 85, outOf: 100 },
    ],
  },
];

function calcTotal(marks) {
  const obtained = marks.reduce((s, m) => s + m.score, 0);
  const total = marks.reduce((s, m) => s + m.outOf, 0);
  const pct = total ? Math.round((obtained / total) * 100) : 0;
  return { obtained, total, pct };
}

export default function MarksPage() {
  const [selectedCode, setSelectedCode] = useState(courses[0].code);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        await getMarks();
      } catch (e) {
        if (mounted) setErr(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading marks...</div>;
  if (err) return <div>Error: {err}</div>;

  const selectedCourse = courses.find((c) => c.code === selectedCode);

  return (
    <div className="marks-page my-4">
      {/* Header */}

      <div className="marks-header">
        <h1 className="marks-title text-center">Marks</h1>
      </div>

      {/* Desktop / tablet layout: left = courses, right = marks */}
      <div className="row gx-4 gy-3 align-items-start">
        {/* Courses list (desktop) */}
        <div className="col-md-4 d-flex">
          <div className="card w-100 d-flex flex-column">
            <div className="card-body d-flex flex-column p-3">
              <h5 className="card-title text-center mb-3">Enrolled Courses</h5>
              <div className="list-group flex-grow-1">
                {courses.map((course) => (
                  <button
                    type="button"
                    key={course.code}
                    className={
                      "list-group-item list-group-item-action d-flex justify-content-between align-items-start " +
                      (selectedCode === course.code ? "active" : "")
                    }
                    onClick={() => setSelectedCode(course.code)}
                  >
                    <div>
                      <div className="fw-bold text-start">{course.code}</div>
                      <small className="text-muted">{course.name}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Marks detail (desktop) */}
        <div className="col-md-8 d-flex">
          <div className="card w-100 d-flex flex-column">
            <div className="card-body d-flex flex-column p-4">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div>
                  <h5 className="card-title mb-0">
                    {selectedCourse.code} — {selectedCourse.name}
                  </h5>
                  <small className="text-muted">Marks breakdown</small>
                </div>
                <div className="text-end">
                  {(() => {
                    const total = calcTotal(selectedCourse.marks);
                    return (
                      <>
                        <div className="fs-6 fw-semibold">
                          {total.obtained} / {total.total}
                        </div>
                        <div className="text-muted">{total.pct}%</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="marks-list flex-grow-1">
                {selectedCourse.marks.map((m, idx) => {
                  const pct = Math.round((m.score / m.outOf) * 100);
                  return (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between">
                        <div className="fw-medium">{m.title}</div>
                        <div>
                          <strong>{m.score}</strong> / {m.outOf}{" "}
                          <small className="text-muted">({pct}%)</small>
                        </div>
                      </div>
                      <div className="progress mt-2" style={{ height: "8px" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${pct}%` }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: accordion view (only visible on small screens) */}
      <div className="d-md-none mt-4">
        <div className="accordion" id="coursesAccordion">
          {courses.map((course, i) => {
            const total = calcTotal(course.marks);
            return (
              <div className="accordion-item" key={course.code}>
                <h2 className="accordion-header" id={`heading-${i}`}>
                  <button
                    className={"accordion-button collapsed"}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse-${i}`}
                    aria-expanded="false"
                    aria-controls={`collapse-${i}`}
                  >
                    <div className="me-3">
                      <div className="fw-bold">{course.code}</div>
                      <small className="text-muted">{course.name}</small>
                    </div>
                    <div className="ms-auto text-end">
                      <div>
                        {total.obtained} / {total.total}
                      </div>
                      <small className="text-muted">{total.pct}%</small>
                    </div>
                  </button>
                </h2>
                <div
                  id={`collapse-${i}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading-${i}`}
                  data-bs-parent="#coursesAccordion"
                >
                  <div className="accordion-body">
                    {course.marks.map((m, idx) => {
                      const pct = Math.round((m.score / m.outOf) * 100);
                      return (
                        <div key={idx} className="mb-3">
                          <div className="d-flex justify-content-between">
                            <div className="fw-medium">{m.title}</div>
                            <div>
                              <strong>{m.score}</strong> / {m.outOf}{" "}
                              <small className="text-muted">({pct}%)</small>
                            </div>
                          </div>
                          <div
                            className="progress mt-2"
                            style={{ height: "8px" }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${pct}%` }}
                              aria-valuenow={pct}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm">
                        Download Report
                      </button>
                      <button className="btn btn-primary btn-sm">
                        Request Re-evaluation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}