import React, { useEffect, useState } from 'react';
import "./adminhome.css";

/**
 * ApproveLeave page
 * Shows pending leave requests from faculty (demo data)
 * Approve/Reject actions
 */
export default function ApproveLeave() {
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);

  // DEMO DATA using applied_at (timestamp-style property)
  useEffect(() => {
    setLeaves([
      { id: 'L1', faculty: 'Dr. Aisha Khan', from: '2025-11-20', to: '2025-11-22', reason: 'Conference', applied_at: '2025-10-15T09:44:25', status: 'Pending' },
      { id: 'L2', faculty: 'Mr. Ali Raza', from: '2025-12-01', to: '2025-12-02', reason: 'Medical', applied_at: '2025-11-20T13:05:44', status: 'Pending' }
    ]);
    setLoading(false);
  }, []);

  async function doAction(id, action) {
    if (!window.confirm(`Are you sure you want to ${action} this leave?`)) return;
    setLeaves(prev => prev.map(l =>
      l.id === id ? { ...l, status: action === 'approve' ? 'Approved' : 'Rejected' } : l
    ));
  }

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Approve Faculty Leave</h3>
      <div className="card mt-4">
        <div className="card-body">
          {(!leaves || leaves.length === 0)
            ? <div><em>No leave requests</em></div>
            : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Faculty</th>
                      <th>Period</th>
                      <th>Reason</th>
                      <th>Applied at</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id}>
                        <td>{l.faculty}</td>
                        <td>{l.from} → {l.to}</td>
                        <td>{l.reason}</td>
                        <td>{l.applied_at}</td>
                        <td>{l.status}</td>
                        <td>
                          {l.status === 'Pending' ? (
                            <div className="btn-group">
                              <button className="btn btn-sm btn-success ms-2" onClick={() => doAction(l.id, 'approve')}>Approve</button>
                              <button className="btn btn-sm btn-danger ms-2" onClick={() => doAction(l.id, 'reject')}>Reject</button>
                            </div>
                          ) : <em>Processed</em>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}