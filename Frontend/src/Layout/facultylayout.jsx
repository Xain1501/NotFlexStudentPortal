import React, { useState, useRef, useEffect } from "react";
import {
  Outlet,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./layout.css";

export default function FacultyLayout() {
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
    // replace this with your real logout logic (call API, clear context/redux, clear cookies, etc.)
    try {
      localStorage.removeItem("authToken");
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
        // allow clicks on the hamburger button itself
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

  const navLinks = (
    <>
      <NavLink
        to="/faculty"
        end
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        to="/faculty/attendance"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Mark Attendance
      </NavLink>
      <NavLink
        to="/faculty/leave"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Apply Leave
      </NavLink>
      <NavLink
        to="/faculty/marks"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Student Marks
      </NavLink>
      <NavLink
        to="/faculty/ "
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Faculty Attendance
      </NavLink>
      <NavLink
        to="/faculty/timetable"
        className="nav-link"
        onClick={() => setMobileOpen(false)}
      >
        Timetable
      </NavLink>
    </>
  );

  return (
    <div className="page-wrapper d-flex flex-column min-vh-100">
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

          <Link to="/faculty" className="brand ms-1">
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
          <nav className="d-none d-md-flex admin-topnav">{navLinks}</nav>

          <div className="ms-3 dropdown" ref={menuRef}>
            <button
              type="button"
              className="btn btn-sm btn-outline-light dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={handleToggleMenu}
            >
              Faculty
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
        <small>University Portal — Faculty Module</small>
      </footer>
    </div>
  );
}
