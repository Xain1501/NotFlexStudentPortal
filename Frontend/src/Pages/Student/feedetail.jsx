import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/feedetail.css";

/*
  FeeDetailPage with one-click PDF export (styled like your transcript PDF).
  - Dynamically imports jsPDF and jspdf-autotable (with UMD fallbacks) so it works with Vite.
  - Uses jspdf-autotable when available to render the breakdown table in the PDF.
  - Falls back to drawing a simple table if autotable isn't available.
*/

export default function FeeDetailPage() {
  const [semesters] = useState([
    {
      id: "2023-fall",
      label: "Fall 2023",
      total: 50000,
      paid: 50000,
      paymentDate: "2023-09-12",
      breakdown: [
        { name: "Tuition", amount: 40000 },
        { name: "Lab Fee", amount: 5000 },
        { name: "Miscellaneous", amount: 5000 },
      ],
    },
    {
      id: "2024-spring",
      label: "Spring 2024",
      total: 48000,
      paid: 30000,
      paymentDate: "2024-02-15",
      breakdown: [
        { name: "Tuition", amount: 38000 },
        { name: "Lab Fee", amount: 5000 },
        { name: "Student Services", amount: 5000 },
      ],
    },
    {
      id: "2024-fall",
      label: "Fall 2024",
      total: 52000,
      paid: 0,
      paymentDate: null,
      breakdown: [
        { name: "Tuition", amount: 42000 },
        { name: "Lab Fee", amount: 5000 },
        { name: "Sports Fee", amount: 5000 },
      ],
    },
  ]);

  const [selectedId, setSelectedId] = useState(semesters[0].id);
  const selected = semesters.find((s) => s.id === selectedId) ?? semesters[0];
  const due = selected.total - selected.paid;
  const paidPercent = Math.round((selected.paid / selected.total) * 100);

  const currency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "pkr",
      maximumFractionDigits: 0,
    }).format(n);

  // Try to dynamically import jspdf, with UMD fallback for Vite environments
  const loadJsPDF = async () => {
    try {
      const mod = await import("jspdf");
      return mod;
    } catch (err) {
      // fallback to UMD bundle (Vite sometimes resolves this better)
      try {
        const mod2 = await import("jspdf/dist/jspdf.umd.min.js");
        return mod2;
      } catch (err2) {
        console.error("Could not import jspdf:", err, err2);
        throw err2;
      }
    }
  };

  // Try dynamic import of jspdf-autotable. Return null on failure (we'll fallback).
  const loadAutoTable = async () => {
    try {
      const mod = await import("jspdf-autotable");
      return mod;
    } catch (err) {
      try {
        // sometimes plugin augments jspdf prototype and doesn't export well; return null to fallback
        return null;
      } catch {
        return null;
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const jspdfModule = await loadJsPDF();
      const autotableModule = await loadAutoTable();

      const jsPDFCtor = jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule;
      if (typeof jsPDFCtor !== "function") {
        throw new Error("jsPDF constructor not found on imported module.");
      }

      const autoTable = autotableModule?.default ?? autotableModule ?? null;
      const pdf = new jsPDFCtor("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Title (centered)
      pdf.setFontSize(18);
      pdf.text("Fee Receipt", pageWidth / 2, y, { align: "center" });

      // Meta row (semester, date, status)
      pdf.setFontSize(11);
      y += 8;
      const statusText = due === 0 ? "Paid" : selected.paid === 0 ? "Unpaid" : "Partially Paid";
      pdf.text(`Semester: ${selected.label}`, margin, y);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: "right" });
      y += 8;
      pdf.text(`Status: ${statusText}`, margin, y);

      // Draw a thin separator line
      y += 6;
      pdf.setDrawColor(230);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Summary box: total, paid, due, progress bar
      const boxHeight = 28;
      const boxX = margin;
      const boxW = pageWidth - margin * 2;
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(boxX, y, boxW, boxHeight, 2, 2, "F");

      pdf.setFontSize(10);
      pdf.setTextColor(80);
      pdf.text("Total Fees", boxX + 4, y + 8);
      pdf.text("Amount Paid", boxX + boxW / 3 + 4, y + 8);
      pdf.text("Amount Due", boxX + (boxW / 3) * 2 + 4, y + 8);

      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text(currency(selected.total), boxX + 4, y + 18);
      pdf.text(currency(selected.paid), boxX + boxW / 3 + 4, y + 18);
      pdf.text(currency(due), boxX + (boxW / 3) * 2 + 4, y + 18);

      // Progress bar (below the numbers)
      const progX = boxX + 4;
      const progY = y + boxHeight - 6;
      const progW = boxW - 8;
      const progH = 6;
      pdf.setFillColor(230, 230, 230);
      pdf.rect(progX, progY, progW, progH, "F");
      // filled portion
      pdf.setFillColor(85, 99, 247);
      const filled = Math.max(0, Math.min(100, paidPercent));
      pdf.rect(progX, progY, (progW * filled) / 100, progH, "F");

      y += boxHeight + 10;

      // Table heading
      pdf.setFontSize(13);
      pdf.text("Fee Breakdown", margin, y);
      y += 6;

      // Table: use autotable when available (clean layout & paging)
      const tableHead = [["Component", "Amount"]];
      const tableBody = selected.breakdown.map((b) => [b.name, currency(b.amount)]);

      if (typeof autoTable === "function") {
        // autotable as function (autoTable(pdf, opts))
        autoTable(pdf, {
          head: tableHead,
          body: tableBody,
          startY: y,
          margin: { left: margin, right: margin },
          styles: { fontSize: 11 },
          headStyles: { fillColor: [245, 245, 245], textColor: 30, fontStyle: "bold" },
          foot: [["Total", currency(selected.total)]],
          didDrawPage: function (data) {
            // optional: could add page header/footer here if multi-page
          },
        });
      } else if (typeof pdf.autoTable === "function") {
        // autotable augmented plugin
        pdf.autoTable({
          head: tableHead,
          body: tableBody,
          startY: y,
          margin: { left: margin, right: margin },
          styles: { fontSize: 11 },
          headStyles: { fillColor: [245, 245, 245], textColor: 30, fontStyle: "bold" },
          didDrawPage: function (data) {},
        });
        // add total manually after table if plugin didn't support foot in this shape
        const finalY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY || pdf.autoTableEndPosY || (y + 40) : y + 40;
        pdf.setFontSize(11);
        pdf.text("Total", pageWidth - margin - 40, finalY + 8, { align: "left" });
        pdf.text(currency(selected.total), pageWidth - margin, finalY + 8, { align: "right" });
      } else {
        // fallback: draw a simple table manually
        pdf.setFontSize(11);
        const rowHeight = 8;
        let posY = y + 4;
        pdf.text("Component", margin + 2, posY);
        pdf.text("Amount", pageWidth - margin - 2, posY, { align: "right" });
        posY += rowHeight;
        pdf.setDrawColor(240);
        selected.breakdown.forEach((b) => {
          pdf.text(b.name, margin + 2, posY);
          pdf.text(currency(b.amount), pageWidth - margin - 2, posY, { align: "right" });
          posY += rowHeight;
          if (posY > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            posY = 20;
          }
        });
        // total
        pdf.setFontSize(12);
        pdf.text("Total", margin + 2, posY + 6);
        pdf.text(currency(selected.total), pageWidth - margin - 2, posY + 6, { align: "right" });
      }

      // Save file
      const filename = `fee-receipt-${selected.id}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Could not create PDF. Check console for details.");
    }
  };

  return (
    <div className="fee-page my-4">
      <div className="fee-header">
        
        <h1 className="fee-title text-center">Fee Details</h1>
      </div>

      <div className="row gap-3 mt-4 fee-row">
        <div className="col-12 col-md-4">
          <div className="fee-card">
            <h5 className="card-title">Semesters</h5>
            <ul className="list-unstyled semester-list">
              {semesters.map((s) => {
                const sDue = s.total - s.paid;
                const status = sDue === 0 ? "Paid" : s.paid === 0 ? "Unpaid" : "Partially Paid";
                return (
                  <li
                    key={s.id}
                    className={`semester-item ${selectedId === s.id ? "active" : ""}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="sem-left">
                      <div className="sem-label text-start">{s.label}</div>
                      <div className="sem-sub text-start">Total: {currency(s.total)}</div>
                    </div>
                    <div className="sem-right">
                      <span className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="col-12 col-md-7">
          <div className="fee-card">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="card-title">{selected.label} — Fee Summary</h5>
              <div className="right-actions">
                <button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={handleDownloadPDF}>
                  Download PDF
                </button>
              </div>
            </div>

            <div className="fee-summary mt-3">
              <div className="summary-row">
                <div>Total Fees</div>
                <div className="summary-value">{currency(selected.total)}</div>
              </div>
              <div className="summary-row">
                <div>Amount Paid</div>
                <div className="summary-value">{currency(selected.paid)}</div>
              </div>
              <div className="summary-row">
                <div>Amount Due</div>
                <div className={`summary-value ${due === 0 ? "paid" : "due"}`}>{currency(due)}</div>
              </div>
            </div>

            <hr />

            <h6 className="mb-2">Fee Breakdown</h6>
            <div className="table-responsive">
              <table className="table fee-table">
                <thead>
                  <tr>
                    <th className="text-start">Component</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.breakdown.map((b, i) => (
                    <tr key={i}>
                      <td className="text-start">{b.name}</td>
                      <td className="text-end">{currency(b.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="text-start">Total</th>
                    <th className="text-end">{currency(selected.total)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}