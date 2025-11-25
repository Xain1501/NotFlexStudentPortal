import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Student/feedetail.css";

const FEE_STATUS_KEY = 'student_fee_status';

function getSemestersFromStorage() {
  try {
    const raw = localStorage.getItem(FEE_STATUS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      // Map to semester objects expected by UI
      return arr.map(r => ({
        id: r.roll, // unique student ID; replace with semester/feeId if you change your data shape
        label: r.name || r.roll,
        total: Number(r.fee) || Number(r.total) || 0,
        paid: r.status === 'Paid' ? (Number(r.fee) || Number(r.total) || 0) : 0,
        paymentDate: r.paymentDate || null,
        status: r.status
      }));
    }
  } catch {
    // fallback: your demo if no storage or first visit
    return [
      { id: "2023-fall", label: "Fall 2023", total: 50000, paid: 50000, paymentDate: "2023-09-12", status: 'Paid' },
      { id: "2024-spring", label: "Spring 2024", total: 48000, paid: 30000, paymentDate: "2024-02-15", status: 'Unpaid' },
      { id: "2024-fall", label: "Fall 2024", total: 52000, paid: 0, paymentDate: null, status: 'Unpaid' },
    ];
  }
  return [];
}

export default function FeeDetailPage() {
  const [semesters, setSemesters] = useState(getSemestersFromStorage());
  const [selectedId, setSelectedId] = useState(semesters[0]?.id);

  useEffect(() => {
    function handleStorageChange() {
      setSemesters(getSemestersFromStorage());
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const selected = semesters.find((s) => s.id === selectedId) ?? semesters[0];
  const due = (selected?.total || 0) - (selected?.paid || 0);
  const paidPercent = Math.round(((selected?.paid || 0) / (selected?.total || 1)) * 100);

  const currency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "pkr",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="fee-page my-4">
      <div className="fee-header">
        <h1 className="fee-title text-center">Fee Details</h1>
      </div>

      <div className="row gap-3 mt-4 fee-row">
        <div className="col-12 col-md-4">
          <div className="fee-card">
            <h5 className="card-title">Semesters / Students</h5>
            <ul className="list-unstyled semester-list">
              {semesters.map((s) => {
                const sDue = s.total - s.paid;
                const status = s.status || (sDue === 0 ? "Paid" : "Unpaid");
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
              <h5 className="card-title">{selected?.label} — Fee Summary</h5>
            </div>

            <div className="fee-summary mt-3">
              <div className="summary-row">
                <div>Total Fees</div>
                <div className="summary-value">{currency(selected?.total || 0)}</div>
              </div>
              <div className="summary-row">
                <div>Amount Paid</div>
                <div className="summary-value">{currency(selected?.paid || 0)}</div>
              </div>
              <div className="summary-row">
                <div>Amount Due</div>
                <div className={`summary-value ${due === 0 ? "paid" : "due"}`}>{currency(due)}</div>
              </div>
            </div>
            <hr />
          </div>
        </div>
      </div>
    </div>
  );
}