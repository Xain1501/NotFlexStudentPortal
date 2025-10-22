import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./transcript.css";

export default function MarksPage() {
  return (
      
    <div className="transcript-page my-4">
      {/* Large gradient heading block */}
      <div className="transcript-header rounded shadow-sm mb-4">
        <h1 className="transcript-title mb-0">Transcript</h1>
      </div>

      {/* Meta row: semester, SGPA, CGPA */}
       <div className="transcript-meta d-flex flex-row justify-content-between align-items-center gap-3 mb-3 flex-nowrap">
      <div className="meta-item d-flex text-start">
          <div className="meta-label">Semester: </div>
          <div className="meta-value">Fall(2023)</div>
        </div>

        <div className="meta-item d-flex text-center">
          <div className="meta-label">Semester GPA: </div>
          <div className="meta-value">3.8</div>
        </div>

        <div className="meta-item d-flex text-end">
          <div className="meta-label">CGPA: </div>
          <div className="meta-value">3.7</div>
        </div>
      </div>

    
    
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Course No</th>
      <th scope="col">Course Name</th>
      <th scope="col">Credit Hours</th>
      <th scope="col">GPA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1</th>
      <td>DB</td>
      <td>3</td>
      <td>3.5</td>
    </tr>
    <tr>
      <th scope="row">2</th>
      <td>CN</td>
      <td>3</td>
      <td>4.0</td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td>SDA</td>
      <td>3</td>
      <td>4.0</td>
    </tr>
  </tbody>
</table>
</div>
  );
}