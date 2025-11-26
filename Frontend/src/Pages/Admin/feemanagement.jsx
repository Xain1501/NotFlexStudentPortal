import React, { useEffect, useState } from 'react';
import { fetchStudentFees, updateStudentFee } from '../Admin/api';
import "./adminhome.css";

// Key for localStorage sync
const FEE_STATUS_KEY = 'student_fee_status';

export default function FeeManagement() {
  const [rows, setRows] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Demo admin detection
        const roleFromStorage = typeof window !== 'undefined' && localStorage.getItem('role');
        setIsAdmin(roleFromStorage ? roleFromStorage === 'admin' : true);

        let data;
        if (typeof fetchStudentFees === 'function') {
          data = await fetchStudentFees();
        }
        // You can add demo data here if needed

        // Enhanced normalization to catch all fee variations
        const normalized = (data || []).map(r => {
          let feeValue = r.fee ?? r.fees ?? r.amount ?? r.totalFee ?? r.fee_amount ?? null;
          if (feeValue == null) {
            const possibleFeeProps = Object.keys(r).filter(key => 
              key.toLowerCase().includes('fee') || 
              key.toLowerCase().includes('amount')
            );
            if (possibleFeeProps.length > 0) {
              feeValue = r[possibleFeeProps[0]];
            }
          }
          return {
            ...r,
            fee: feeValue,
            status: r.status ?? 'Unpaid'
          };
        });

        setRows(normalized);
        // Save initial status to localStorage for student sync
        localStorage.setItem(FEE_STATUS_KEY, JSON.stringify(normalized));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const formatAmount = (value) => {
    if (value == null || value === '' || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    const raw = String(value);
    const cleaned = raw.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  async function saveStatus(roll, newStatus) {
    try {
      if (!isAdmin) return alert('Only admins can change status');
      if (typeof updateStudentFee === 'function') {
        await updateStudentFee({ roll, status: newStatus });
      }
      setRows(prev => {
        const updated = prev.map(r => r.roll === roll ? { ...r, status: newStatus } : r);
        // Sync with localStorage
        localStorage.setItem(FEE_STATUS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        return updated;
      });
      alert('Status updated to ' + newStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  }

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Manage Student Fees</h3>
      <div className="card mt-3">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.roll}>
                    <td>{r.roll}</td>
                    <td>{r.name}</td>
                    <td><strong>PKR {formatAmount(r.fee)}</strong></td>
                    <td>
                      <span className={r.status === 'Paid' ? 'text-success font-weight-bold' : 'text-danger font-weight-bold'}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {isAdmin ? (
                        <div>
                          {r.status === 'Unpaid' ? (
                            <button 
                              className="btn btn-sm btn-success mr-2" 
                              onClick={() => saveStatus(r.roll, 'Paid')}
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm btn-warning mr-2" 
                              onClick={() => saveStatus(r.roll, 'Unpaid')}
                            >
                              Mark as Unpaid
                            </button>
                          )}
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline-secondary" disabled>Not allowed</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="text-center">No students found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}