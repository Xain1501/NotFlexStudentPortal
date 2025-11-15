import React, { useEffect, useState } from 'react';
import { fetchStudentFees, updateStudentFee } from '../Admin/api';
import "./adminhome.css";

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
        

        console.log('fetchStudentFees -> raw data:', data);

        // Enhanced normalization to catch all fee variations
        const normalized = (data || []).map(r => {
          // Try multiple fee property names and ensure we get a valid number
          let feeValue = r.fee ?? r.fees ?? r.amount ?? r.totalFee ?? r.fee_amount ?? null;
          
          // If feeValue is still null/undefined, try to find any property that might contain fee
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
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Enhanced formatAmount function
  const formatAmount = (value) => {
    if (value == null || value === '' || value === undefined) return 'N/A';
    
    // If it's already a number, format it directly
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    // If it's a string, clean it and convert to number
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
      setRows(prev => prev.map(r => r.roll === roll ? { ...r, status: newStatus } : r));
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