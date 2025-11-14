import React, { useEffect, useState } from 'react';
import { getTeacher } from '../Faculty/api';
import "../Faculty/styles.css";

const ANNOUNCEMENTS_KEY = "globalAnnouncements";
function loadGlobalAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveGlobalAnnouncement(a) {
  try {
    const list = loadGlobalAnnouncements();
    list.unshift(a); // newest first
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("globalAnnouncementsUpdated"));
    try {
      window.dispatchEvent(new StorageEvent("storage", {
        key: ANNOUNCEMENTS_KEY,
        newValue: JSON.stringify(list)
      }));
    } catch (err) {}
  } catch (e) {
    console.error("Could not save announcement", e);
  }
}

export default function TeacherHome() {
  const [teacher, setTeacher] = useState(null);

  // UI state for posting announcements
  const [showForm, setShowForm] = useState(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [announcementText, setAnnouncementText] = useState("");

  // History of saved announcements (objects with courseCode, section, teacherName, text, createdAt, target, author)
  const [historyAnnouncements, setHistoryAnnouncements] = useState([]);

  useEffect(() => {
    let mounted = true;
    getTeacher().then(t => {
      if (!mounted) return;
      setTeacher(t);
      if (t && t.courses && t.courses.length) {
        setSelectedCourseCode(t.courses[0].code);
      }

      // load and filter global announcements relevant to this teacher and limit to last 2 days
      const all = loadGlobalAnnouncements();
      const teacherCourseCodes = new Set((t && t.courses) ? t.courses.map(c => c.code) : []);
      const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000; // last 2 days
      const filtered = all.filter(a =>
        // admin announcements targeted to faculty OR announcements targeting a course this teacher teaches OR authored by this teacher
        ((a.target && a.target === "faculty") ||
         (a.courseCode && teacherCourseCodes.has(a.courseCode)) ||
         (a.teacherName && a.teacherName === t.name)) &&
        new Date(a.createdAt).getTime() >= cutoff
      );
      setHistoryAnnouncements(filtered);
    });

    // on storage/custom event update historyAnnouncements
    function updateFromStorage() {
      const allNow = loadGlobalAnnouncements();
      if (!teacher) {
        setHistoryAnnouncements([]);
        return;
      }
      const teacherCourseCodes = new Set((teacher.courses || []).map(c => c.code));
      const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const filteredNow = allNow.filter(a =>
        ((a.target && a.target === "faculty") ||
         (a.courseCode && teacherCourseCodes.has(a.courseCode)) ||
         (a.teacherName && a.teacherName === teacher.name)) &&
        new Date(a.createdAt).getTime() >= cutoff
      );
      setHistoryAnnouncements(filteredNow);
    }

    window.addEventListener("storage", updateFromStorage);
    window.addEventListener("globalAnnouncementsUpdated", updateFromStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", updateFromStorage);
      window.removeEventListener("globalAnnouncementsUpdated", updateFromStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  function handlePostAnnouncement(e) {
    e.preventDefault();
    const text = (announcementText || "").trim();
    if (!text) return alert("Please enter announcement text.");

    const course = teacher.courses.find(c => c.code === selectedCourseCode) || {};
    const ann = {
      courseCode: selectedCourseCode,
      section: course.section || "",
      teacherName: teacher.name,
      text,
      createdAt: new Date().toISOString(),
      target: "students", // teacher announcements naturally target students of that course
      author: teacher.name,
    };

    saveGlobalAnnouncement(ann);

    // update historyAnnouncements so teacher sees it in history immediately (respecting 2-day cutoff)
    setHistoryAnnouncements(prev => [ann, ...prev].filter(a => new Date(a.createdAt).getTime() >= Date.now() - 2 * 24 * 60 * 60 * 1000));

    // update local teacher announcements so teacher sees the text in the legacy list
    setTeacher(prev => ({
      ...prev,
      announcements: [text, ...(prev.announcements || [])]
    }));

    setAnnouncementText("");
    setShowForm(false);
    alert("Announcement posted to " + selectedCourseCode + (course.section ? ` - ${course.section}` : ""));
  }

  return (
    <>
      <header className="mt-4 text-center">
        <h2 className="page-title">Home</h2>
      </header>

      <div className="row align-items-stretch teacher-cards-row">
        <div className="col-md-4">
          <div className="card info-card text-center h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent">Personal Details</h5>
              <div className="card-content flex-grow-1">
                <p><strong>Name:</strong> {teacher.name}</p>
                <p><strong>Employee ID:</strong> {teacher.id}</p>
                <p><strong>Department:</strong> {teacher.department}</p>
                <p><strong>Contact:</strong> {teacher.contact}</p>
                <p><strong>Email:</strong> {teacher.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card info-card text-center h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent">Education</h5>
              <div className="card-content flex-grow-1">
                <p><strong>Bachelor:</strong> {teacher.education.bachelor}</p>
                <p><strong>Master:</strong> {teacher.education.master}</p>
                <p><strong>PhD:</strong> {teacher.education.phd || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card info-card text-center h-100">
            <div className="card-body d-flex flex-column">
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginBottom: 6 }}>
                <h5 className="card-title accent" style={{ margin: 0 }}>Announcements</h5>
              </div>

              <div className="card-content flex-grow-1" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setShowForm(s => !s)}
                    aria-expanded={showForm}
                  >
                    {showForm ? "Cancel" : "New Announcement"}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handlePostAnnouncement} style={{ textAlign: "left", marginBottom: 12 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Course / Section</label>
                    <select
                      value={selectedCourseCode}
                      onChange={(e) => setSelectedCourseCode(e.target.value)}
                      className="form-select form-select-sm"
                      aria-label="Select course"
                      style={{ marginBottom: 8 }}
                    >
                      {teacher.courses.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} {c.section ? ` - ${c.section}` : ""}
                        </option>
                      ))}
                    </select>

                    <label className="form-label" style={{ fontWeight: 600}}>Announcement</label>
                    <textarea
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      rows={3}
                      className="form-control form-control-sm"
                      placeholder="Write announcement for selected course/section..."
                      style={{ marginBottom: 8 }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm">Post</button>
                    </div>
                  </form>
                )}

                <div style={{ width: "100%", textAlign: "left" }}>
                  {historyAnnouncements.length ? (
                    <div className="announcement-list" style={{ marginBottom: 12 }}>
                      {historyAnnouncements.map((a, i) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #eee" }}>
                          <div style={{ fontWeight: 700 }}>
                            {a.courseCode ? `${a.courseCode}${a.section ? ` - ${a.section}` : ''} — ${a.author || a.teacherName}` : `[${a.target}] — ${a.author || a.teacherName}`}
                          </div>
                          <div style={{ fontSize: 14, marginTop: 6 }}>{a.text}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{new Date(a.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : <em>No announcements</em>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h5 className="text-center accent">Courses & Sections</h5>
          <div className="table-responsive">
            <table className="table table-bordered mt-3">
              <thead className="thead-light">
                <tr>
                  <th>Course Code</th>
                  <th>Name</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {teacher.courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}