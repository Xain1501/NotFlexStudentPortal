import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/transcript.css";

export default function MarksPage() {
  const [semester] = useState("Fall");
  const [year] = useState("2023");
  const [semesterGPA] = useState(3.8);
  const [cgpa] = useState(3.7);
  const [courses] = useState([
    { no: 1, name: "DB", credits: 3, gpa: 3.5 },
    { no: 2, name: "CN", credits: 3, gpa: 4.0 },
    { no: 3, name: "SDA", credits: 3, gpa: 4.0 },
  ]);

  // Helper to dynamically import jspdf with fallback
  const loadJsPDF = async () => {
    try {
      // normal import (works when package.json "exports" allows it)
      const mod = await import("jspdf");
      return mod;
    } catch (err1) {
      console.warn("Import 'jspdf' failed, trying UMD path:", err1);
      // fallback to UMD build - Vite can often resolve this path
      try {
        const mod2 = await import("jspdf/dist/jspdf.umd.min.js");
        return mod2;
      } catch (err2) {
        console.error("Import fallback for jspdf failed:", err2);
        throw err2;
      }
    }
  };

  const loadAutoTable = async () => {
    try {
      return await import("jspdf-autotable");
    } catch (err) {
      console.warn("Import 'jspdf-autotable' failed:", err);
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // dynamically load libraries (client only)
      const jspdfModule = await loadJsPDF();
      const autotableModule = await loadAutoTable();

      // normalize jsPDF constructor export shapes
      const jsPDFCtor = jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule;
      if (typeof jsPDFCtor !== "function") {
        console.error("Unexpected jspdf export shape:", jspdfModule);
        throw new Error("Could not obtain jsPDF constructor.");
      }

      const autoTable = autotableModule.default ?? autotableModule;

      // create pdf and add content
      const pdf = new jsPDFCtor("p", "mm", "a4");
      pdf.setFontSize(18);
      pdf.text("Transcript", pdf.internal.pageSize.getWidth() / 2, 20, { align: "center" });

      pdf.setFontSize(11);
      const leftX = 14;
      let y = 30;
      pdf.text(`Semester: ${semester} (${year})`, leftX, y);
      pdf.text(`Semester GPA: ${semesterGPA}`, pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
      pdf.text(`CGPA: ${cgpa}`, pdf.internal.pageSize.getWidth() - 14, y, { align: "right" });

      y += 10;

      const head = [["Course No", "Course Name", "Credit Hours", "GPA"]];
      const body = courses.map((c) => [String(c.no), c.name, String(c.credits), String(c.gpa)]);

      if (typeof autoTable === "function") {
        // call as function autoTable(pdf, opts)
        autoTable(pdf, {
          head,
          body,
          startY: y,
          margin: { left: 14, right: 14 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
        });
      } else if (typeof pdf.autoTable === "function") {
        pdf.autoTable({
          head,
          body,
          startY: y,
          margin: { left: 14, right: 14 },
          styles: { fontSize: 10 },
        });
      } else {
        // final fallback: draw a simple table
        let posY = y;
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.setFontSize(10);
        pdf.text("Course No", 16, posY);
        pdf.text("Course Name", 40, posY);
        pdf.text("Credit Hours", pageWidth - 60, posY);
        pdf.text("GPA", pageWidth - 30, posY);
        posY += 8;
        courses.forEach((c) => {
          pdf.text(String(c.no), 16, posY);
          pdf.text(String(c.name), 40, posY);
          pdf.text(String(c.credits), pageWidth - 60, posY);
          pdf.text(String(c.gpa), pageWidth - 30, posY);
          posY += 8;
          if (posY > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            posY = 20;
          }
        });
      }

      pdf.save(`transcript-${semester}-${year}.pdf`);
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("Could not create PDF. Check console for details.");
    }
  };

  return (
    <div className="transcript-page my-4">
      <div className="transcript-header">
        <button type="button" className="btn btn-primary download-btn" onClick={handleDownloadPDF}>
          Download
        </button>
        <h1 className="transcript-title text-center">Transcript</h1>
      </div>

      <div className="transcript-meta d-flex flex-row justify-content-between align-items-center gap-3 mb-3 flex-nowrap">
        <div className="meta-item d-flex text-start align-items-center">
          <div className="meta-label">Semester:</div>
          <div className="meta-value">{semester} ({year})</div>
        </div>

        <div className="meta-item d-flex text-center align-items-center">
          <div className="meta-label">Semester GPA:</div>
          <div className="meta-value">{semesterGPA}</div>
        </div>

        <div className="meta-item d-flex text-end align-items-center">
          <div className="meta-label">CGPA:</div>
          <div className="meta-value">{cgpa}</div>
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
          {courses.map((c) => (
            <tr key={c.no}>
              <th scope="row">{c.no}</th>
              <td>{c.name}</td>
              <td>{c.credits}</td>
              <td>{c.gpa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}