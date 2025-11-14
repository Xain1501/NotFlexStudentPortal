import React, { useEffect, useState } from "react";
import { getAdmin } from "../Admin/api"; // keep your existing API or mock fallback
import { useNavigate } from "react-router-dom";
import "./adminhome.css";

const ANNOUNCEMENTS_KEY = "globalAnnouncements";
function loadGlobalAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [viewDays, setViewDays] = useState(7); // admin timeframe selector
  const [globalAnns, setGlobalAnns] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        if (typeof getAdmin === "function") {
          const resp = await getAdmin();
          // ensure no dummy announcements
          if (resp && resp.announcements) resp.announcements = resp.announcements || [];
          setAdmin(resp);
          return;
        }
      } catch (err) {
        console.warn("getAdmin failed, using demo data", err);
      }
      setAdmin({
        name: "Admin User",
        email: "admin@uni.edu",
        department: "Academic Affairs",
        contact: "03001234567",
        announcements: [],
      });
    })();
  }, []);

  // load global announcements and apply timeframe filter
  useEffect(() => {
    function loadAndFilter() {
      const all = loadGlobalAnnouncements();
      if (!viewDays || viewDays <= 0) {
        setGlobalAnns(all);
        return;
      }
      const cutoff = Date.now() - viewDays * 24 * 60 * 60 * 1000;
      setGlobalAnns(all.filter(a => new Date(a.createdAt).getTime() >= cutoff));
    }
    loadAndFilter();
    window.addEventListener("storage", loadAndFilter);
    window.addEventListener("globalAnnouncementsUpdated", loadAndFilter);
    return () => {
      window.removeEventListener("storage", loadAndFilter);
      window.removeEventListener("globalAnnouncementsUpdated", loadAndFilter);
    };
  }, [viewDays]);

  if (!admin) return <div className="text-center py-5">Loading...</div>;

  // Admin should only see announcements authored by the admin (do not show teacher announcements)
  const myGlobalAnns = globalAnns.filter(a => a.author === admin.name);

  return (
    <main className="container admin-main">
      <h2 className="page-title text-center my-4">Home</h2>

      {/* First row: two centered blocks (Personal Details + Announcements) */}
      <div className="row mb-3 justify-content-center admin-top-row">
        <div className="col-lg-5 col-md-6 mb-3">
          <div className="card info-card">
            <div className="card-body">
              <h5 className="card-title accent text-center">Personal Details</h5>
              <div className="card-content text-left mt-3">
                <p><strong>Name:</strong> {admin.name}</p>
                <p><strong>Department:</strong> {admin.department}</p>
                <p><strong>Contact:</strong> {admin.contact}</p>
                <p><strong>Email:</strong> {admin.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5 col-md-6 mb-3">
          <div className="card info-card">
            <div className="card-body">
              <h5 className="card-title accent text-center">Announcements</h5>

              <div className="card-content text-left mt-3">
                {myGlobalAnns && myGlobalAnns.length > 0 ? (
                  <div>
                    {myGlobalAnns.map((a, i) => (
                      <div key={i} className="admin-ann-item">
                        <div className="admin-ann-meta">
                          <strong>[{a.target}]</strong> — {a.author}
                        </div>
                        <div className="admin-ann-text">{a.text}</div>
                        <div className="admin-ann-time">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <em>No announcements</em>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: Manage Students (full-width card styled like other modules) */}
      <div className="row mb-3 justify-content-center">
        <div className="col-lg-10">
          <div className="card info-card">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent text-center">Student Management</h5>
              <div className="card-content text-left mt-3">
                <p>Manage student records — create, view, edit and delete students.</p>
                <div className="d-flex justify-content-center">
                  <button className="btn btn-primary" onClick={() => navigate("/admin/managestudent")}>
                    Manage Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third row: Manage Faculty (full-width card) */}
      <div className="row mb-3 justify-content-center">
        <div className="col-lg-10">
          <div className="card info-card">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title accent text-center">Faculty Management</h5>
              <div className="card-content text-left mt-3">
                <p>Manage faculty records — create, view, edit and delete faculty members.</p>
                <div className="d-flex justify-content-center">
                  <button className="btn btn-primary" onClick={() => navigate("/admin/managefaculty")}>
                    Manage Faculty
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}