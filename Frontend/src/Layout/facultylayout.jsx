import React from 'react';
import { Outlet } from 'react-router-dom';
import NavFaculty from '../components/facultynavbar.jsx';

export default function FacultyLayout() {
  return (
    <div className="page-wrapper d-flex flex-column min-vh-100">
      <NavFaculty />
      <main className="container my-4 flex-grow-1">
        <Outlet />
      </main>
      <footer className="footer text-center py-3">
        <small>University Portal — Faculty Module</small>
      </footer>
    </div>
  );
}