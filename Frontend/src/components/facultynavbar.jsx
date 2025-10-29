import React from 'react';
import { NavLink } from 'react-router-dom';

export default function NavFaculty() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark topbar">
      <div className="container">
        <NavLink className="navbar-brand" to="/faculty">UniPortal</NavLink>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#facultyNav">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="facultyNav">
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <NavLink className={({ isActive }) => (isActive ? 'nav-link pill' : 'nav-link')} to="/faculty">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/faculty/attendance">Mark Attendance</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/faculty/leave">Apply Leave</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/faculty/marks">Student Marks</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/faculty/timetable">Timetable</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}