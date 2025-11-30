import React, { useEffect, useState } from "react";
import { getEnrolledCourses, enrollCourse, unenrollCourse } from "./api";

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

function saveRegistrations(regs) {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(regs));
  } catch (e) {
    console.error("saveRegistrations error:", e);
  }
}

export default function CourseRegistration() {
  const [courses, setCourses] = useState([]);
  const [localRegs, setLocalRegs] = useState(loadRegistrations());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getEnrolledCourses();
        if (!mounted) return;
        setCourses(Array.isArray(res) ? res : []);
      } catch (e) {
        if (mounted) setErr(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  async function doEnroll(courseId) {
    try {
      await enrollCourse({ course_id: courseId });
      const newRegs = [...localRegs, courseId];
      setLocalRegs(newRegs);
      saveRegistrations(newRegs);
      // re-fetch courses
      const res = await getEnrolledCourses();
      setCourses(Array.isArray(res) ? res : []);
    } catch (e) {
      alert("Enroll failed: " + (e.message || e));
    }
  }

  async function doUnenroll(courseId) {
    try {
      await unenrollCourse({ course_id: courseId });
      const newRegs = localRegs.filter((r) => r !== courseId);
      setLocalRegs(newRegs);
      saveRegistrations(newRegs);
      const res = await getEnrolledCourses();
      setCourses(Array.isArray(res) ? res : []);
    } catch (e) {
      alert("Unenroll failed: " + (e.message || e));
    }
  }

  if (loading) return <div>Loading courses...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div>
      <h2>Your Courses</h2>
      <ul>
        {courses.map((c) => (
          <li key={c.id || c.code || c.title}>
            {c.title || c.code || c.id}
            <button onClick={() => doUnenroll(c.id || c.code)}>Unenroll</button>
          </li>
        ))}
      </ul>
      <div>
        <button onClick={() => doEnroll(101)}>Enroll ID 101 (test)</button>
      </div>
    </div>
  );
}
