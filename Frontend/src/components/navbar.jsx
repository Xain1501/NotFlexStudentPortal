import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { NavLink, Outlet } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  return (
    <div className="student-page">
      {/* Top Menu */}
      <nav className="menu-bar">
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/transcript">Transcript</NavLink>
          </li>
          <li>
            <NavLink to="/marks">Marks</NavLink>
          </li>
          <li>
            <NavLink to="/attendance">Attendance</NavLink>
          </li>
          <li>
            <NavLink to="/timetable">Timetable</NavLink>
          </li>
          <li>
            <NavLink to="/fee">Fee Detail</NavLink>
          </li>
          <li>
            <NavLink to="/courses">Course Registration</NavLink>
          </li>
        </ul>
      </nav>

      <div className="student-content">
        <Outlet />
      </div>
    </div>
  );
}
