import React, { useEffect, useState } from 'react';
import { getTeacher } from '../Faculty/api';
import "../Faculty/styles.css";

export default function TeacherHome() {
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    getTeacher().then(t => setTeacher(t));
  }, []);

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <header className="mt-4 text-center">
        <h2 className="page-title">Home</h2>
      </header>

      <div className="row">
        <div className="col-md-4">
          <div className="card info-card text-center">
            <div className="card-body">
              <h5 className="card-title accent">Personal Details</h5>
              <p><strong>Name:</strong> {teacher.name}</p>
              <p><strong>Employee ID:</strong> {teacher.id}</p>
              <p><strong>Department:</strong> {teacher.department}</p>
              <p><strong>Contact:</strong> {teacher.contact}</p>
              <p><strong>Email:</strong> {teacher.email}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card info-card text-center">
            <div className="card-body">
              <h5 className="card-title accent">Education</h5>
              <p><strong>Bachelor:</strong> {teacher.education.bachelor}</p>
              <p><strong>Master:</strong> {teacher.education.master}</p>
              <p><strong>PhD:</strong> {teacher.education.phd || '-'}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card info-card text-center">
            <div className="card-body">
              <h5 className="card-title accent">Announcements</h5>
              {teacher.announcements.length ? (
                <ul className="text-left pl-3">
                  {teacher.announcements.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : <em>No announcements</em>}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teacher.courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.section}</td>
                    <td>
                      <a className="btn btn-sm btn-outline-primary mr-2" href={`/attendance?course=${encodeURIComponent(c.id)}`}>Mark Attendance</a>
                      <a className="btn btn-sm btn-outline-success" href={`/marks?course=${encodeURIComponent(c.id)}`}>Marks</a>
                    </td>
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