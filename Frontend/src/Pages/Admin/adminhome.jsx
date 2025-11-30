import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminDashboard } from "./api.jsx";
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

const ANNOUNCEMENTS_KEY = "globalAnnouncements";

function ensureIdForAnn(a) {
  // create a stable-appearing unique id
  return (
    a.id ||
    `${new Date(a.createdAt || Date.now()).getTime()}-${Math.floor(
      Math.random() * 100000
    )}`
  );
}

// load announcements from localStorage and ensure every item has an id
function loadGlobalAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    let mutated = false;
    const normalized = (arr || []).map((item) => {
      if (!item.id) {
        mutated = true;
        return { ...item, id: ensureIdForAnn(item) };
      }
      return item;
    });
    // If we added ids for older announcements, persist the normalized array
    if (mutated) {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch (e) {
    console.error("Failed to load/normalize announcements", e);
    return [];
  }
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [viewDays] = useState(7); // admin timeframe selector
  const [globalAnns, setGlobalAnns] = useState([]);
  const [newAnnText, setNewAnnText] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load admin profile + dashboard from backend (single request)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchAdminDashboard();
        if (!mounted) return;
        setData(res);
        // if backend returns admin/profile as part of dashboard, use it
        if (res && res.admin) setAdmin(res.admin);
        else if (res && res.profile) setAdmin(res.profile);
        else {
          // keep fallback demo admin if none provided
          setAdmin({
            name: "Admin User",
            email: "admin@uni.edu",
            department: "Academic Affairs",
            contact: "03001234567",
            announcements: [],
          });
        }
      } catch (err) {
        if (mounted) setError(err.message || String(err));
        // ensure fallback admin on error
        if (mounted) {
          setAdmin({
            name: "Admin User",
            email: "admin@uni.edu",
            department: "Academic Affairs",
            contact: "03001234567",
            announcements: [],
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  // helper to load announcements from storage and apply timeframe filter
  const refreshAnnouncements = useCallback(() => {
    const all = loadGlobalAnnouncements();
    if (!viewDays || viewDays <= 0) {
      setGlobalAnns(all);
      return;
    }
    const cutoff = Date.now() - viewDays * 24 * 60 * 60 * 1000;
    setGlobalAnns(all.filter((a) => new Date(a.createdAt).getTime() >= cutoff));
  }, [viewDays]);

  useEffect(() => {
    refreshAnnouncements();
    window.addEventListener("storage", refreshAnnouncements);
    window.addEventListener("globalAnnouncementsUpdated", refreshAnnouncements);
    return () => {
      window.removeEventListener("storage", refreshAnnouncements);
      window.removeEventListener(
        "globalAnnouncementsUpdated",
        refreshAnnouncements
      );
    };
  }, [refreshAnnouncements]);

  if (!admin) return <div className="text-center py-5">Loading...</div>;
  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  // only show announcements authored by this admin
  const myGlobalAnns = globalAnns.filter((a) => a.author === admin.name);

  // Post an announcement with a given target ('students' or 'faculty')
  function postAnnouncement(target) {
    const text = (newAnnText || "").trim();
    if (!text) {
      alert("Please write an announcement before posting.");
      return;
    }

    const ann = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`, // unique id
      target, // 'students' or 'faculty'
      author: admin.name,
      text,
      createdAt: new Date().toISOString(),
    };

    try {
      const all = loadGlobalAnnouncements();
      all.unshift(ann);
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));
      // notify other tabs/components
      window.dispatchEvent(new Event("globalAnnouncementsUpdated"));
      // refresh local view
      refreshAnnouncements();
      setNewAnnText("");
      alert(`Announcement posted to ${target}.`);
    } catch (e) {
      console.error("Failed to save announcement", e);
      alert("Failed to post announcement.");
    }
  }

  // Delete an announcement by id (only admin's own announcements are listed here)
  function deleteAnnouncement(id) {
    if (!id) {
      // defensive fallback - try to remove by createdAt if id absent
      alert("Unable to delete: announcement id missing.");
      return;
    }
    if (
      !window.confirm("Delete this announcement? This action cannot be undone.")
    )
      return;

    try {
      const all = loadGlobalAnnouncements();
      const remaining = all.filter((a) => a.id !== id);
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new Event("globalAnnouncementsUpdated"));
      // Update local state immediately
      refreshAnnouncements();
      alert("Announcement deleted.");
    } catch (e) {
      console.error("Failed to delete announcement", e);
      alert("Failed to delete announcement.");
    }
  }

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Home</h2>

      {/* First row: Personal Details + Announcements */}
      <div className="row mb-3 justify-content-center admin-top-row">
        <div className="col-lg-5 col-md-6 mb-3">
          <div className="card info-card">
            <div className="card-body">
              <h5 className="card-title accent text-center">
                Personal Details
              </h5>
              <div className="card-content text-left mt-3">
                <p>
                  <strong>Name:</strong> {admin.name}
                </p>
                <p>
                  <strong>Department:</strong> {admin.department}
                </p>
                <p>
                  <strong>Contact:</strong> {admin.contact}
                </p>
                <p>
                  <strong>Email:</strong> {admin.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5 col-md-6 mb-3">
          <div className="card info-card">
            <div className="card-body">
              <h5 className="card-title accent text-center">Announcements</h5>

              <div className="card-content text-left mt-3 mb-3">
                {myGlobalAnns && myGlobalAnns.length > 0 ? (
                  <div>
                    {myGlobalAnns.map((ann) => (
                      <div
                        key={ann.id}
                        className="admin-ann-item"
                        style={{ position: "relative", paddingRight: 120 }}
                      >
                        <div className="admin-ann-meta">
                          <strong>[{ann.target}]</strong> — {ann.author}
                        </div>
                        <div
                          className="admin-ann-text"
                          style={{ marginTop: 6 }}
                        >
                          {ann.text}
                        </div>
                        <div
                          className="admin-ann-time"
                          style={{ marginTop: 6 }}
                        >
                          {new Date(ann.createdAt).toLocaleString()}
                        </div>

                        {/* Delete button (visible to admin who authored the post) */}
                        <div style={{ position: "absolute", right: 8, top: 8 }}>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteAnnouncement(ann.id)}
                            title="Delete announcement"
                          >
                            Delete
                          </button>
                        </div>

                        <hr />
                      </div>
                    ))}
                  </div>
                ) : (
                  <em>No announcements</em>
                )}
              </div>

              {/* Composer: always visible textarea + two buttons underneath */}
              <div>
                <label htmlFor="newAnn" className="sr-only">
                  New announcement
                </label>
                <textarea
                  id="newAnn"
                  rows={3}
                  className="form-control mb-2"
                  placeholder="Write an announcement... (visible to selected audience)"
                  value={newAnnText}
                  onChange={(e) => setNewAnnText(e.target.value)}
                />
                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-success"
                    onClick={() => postAnnouncement("students")}
                  >
                    Post to Students
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => postAnnouncement("faculty")}
                  >
                    Post to Faculty
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: Manage Students */}
      <div className="row mb-3 justify-content-center">
        <div className="col-lg-10">
          <div className="card info-card">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent text-center">
                Student Management
              </h5>
              <div className="card-content text-left mt-3">
                <p>
                  Manage student records — create, view, edit and delete
                  students.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/admin/managestudent")}
                  >
                    Manage Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third row: Manage Faculty */}
      <div className="row mb-3 justify-content-center">
        <div className="col-lg-10">
          <div className="card info-card">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent text-center">
                Faculty Management
              </h5>
              <div className="card-content text-left mt-3">
                <p>
                  Manage faculty records — create, view, edit and delete faculty
                  members.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/admin/managefaculty")}
                  >
                    Manage Faculty
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug: Raw dashboard data (remove in production) */}
      <div style={{ display: "none" }}>
        <h2>Admin Dashboard</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </main>
  );
}
