import React, { useState, useRef, useEffect } from "react";
import {
  Outlet,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./layout.css";

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false); // account dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile hamburger menu

  const menuRef = useRef(null);
  const mobileNavRef = useRef(null);

  function handleToggleMenu() {
    setMenuOpen((v) => !v);
  }

  function handleToggleMobile() {
    setMobileOpen((v) => !v);
  }

  function handleLogout(e) {
    e.preventDefault();
    // Clear all authentication data
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("token");
    } catch (err) {
      // ignore
    }
    setMenuOpen(false);
    setMobileOpen(false);
    navigate("/login");
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleDocumentClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        if (!e.target.closest(".mobile-hamburger-btn")) {
          setMobileOpen(false);
        }
      }
    }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Close menus on navigation (when route changes)
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location]);

  // ✅ FIXED: Correct navigation paths that match your route definitions
  const navLinks = (
    <>
      <NavLink
        to="/student"
        end
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        to="/student/transcript"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Transcript
      </NavLink>
      <NavLink
        to="/student/marks"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Marks
      </NavLink>
      <NavLink
        to="/student/attendance"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Attendance
      </NavLink>
      <NavLink
        to="/student/fees"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Fee Detail
      </NavLink>
      <NavLink
        to="/student/timetable"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Timetable
      </NavLink>
      <NavLink
        to="/student/course-registration"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Course Registration
      </NavLink>
    </>
  );

  return (
    <div className="admin-layout">
      <header className="admin-topbar d-flex align-items-center justify-content-between px-3">
        <div className="d-flex align-items-center position-relative">
          <button
            className={`btn btn-sm btn-light d-md-none me-2 mobile-hamburger-btn ${
              mobileOpen ? "active" : ""
            }`}
            type="button"
            aria-label="Toggle navigation"
            aria-controls="mobile-nav"
            aria-expanded={mobileOpen}
            onClick={handleToggleMobile}
          >
            ☰
          </button>

          <Link to="/student" className="brand ms-1">
            NotFlex
          </Link>

          {/* Mobile nav (shown only on small screens) */}
          <nav
            id="mobile-nav"
            ref={mobileNavRef}
            className={`student-topnav-mobile d-md-none ${
              mobileOpen ? "open" : ""
            }`}
            aria-hidden={!mobileOpen}
          >
            {navLinks}
          </nav>
        </div>

        <div className="d-flex align-items-center">
          {/* Desktop nav (hidden on small screens) */}
          <nav className="d-none d-md-flex student-topnav">{navLinks}</nav>

          <div className="ms-3 dropdown" ref={menuRef}>
            <button
              type="button"
              className="btn btn-sm btn-outline-light dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={handleToggleMenu}
            >
              Student
            </button>

            <ul
              className={`dropdown-menu dropdown-menu-end ${
                menuOpen ? "show" : ""
              }`}
              style={{ minWidth: 140 }}
            >
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="container my-4 flex-grow-1">
        <Outlet />
      </main>
      <footer className="footer text-center py-3">
        <small>University Portal — Student Module</small>
      </footer>
    </div>
  );
}