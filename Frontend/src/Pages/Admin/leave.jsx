import React, { useEffect, useState } from 'react';
import { fetchFacultyLeaves, approveLeaveRequest, rejectLeaveRequest } from '../Admin/api';
import "./adminhome.css";

/**
 * ApproveLeave page
 * - Shows pending leave requests from faculty
 * - Approve / Reject with optional reason
 * - Replace API functions in ../Admin/api with real endpoints
 */
export default function ApproveLeave() {
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (typeof fetchFacultyLeaves === 'function') {
          const data = await fetchFacultyLeaves();
          setLeaves(data);
        } else {
          // demo fallback
          setLeaves([
            { id: 'L1', faculty: 'Dr. Aisha Khan', from: '2025-11-20', to: '2025-11-22', type: 'Casual', reason: 'Conference', status: 'Pending' },
            { id: 'L2', faculty: 'Mr. Ali Raza', from: '2025-12-01', to: '2025-12-02', type: 'Sick', reason: 'Medical', status: 'Pending' }
          ]);
        }
      } catch (err) {
        console.error(err);
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function doAction(id, action) {
    if (!window.confirm(`Are you sure you want to ${action} this leave?`)) return;
    try {
      // call backend if available
      if (action === 'approve' && typeof approveLeaveRequest === 'function') {
        await approveLeaveRequest(id);
      } else if (action === 'reject' && typeof rejectLeaveRequest === 'function') {
        await rejectLeaveRequest(id);
      }
      // update local view
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: action === 'approve' ? 'Approved' : 'Rejected' } : l));
    } catch (err) {
      console.error(err);
      alert('Action failed. Check console.');
    }
  }

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container admin-main">
      <h3 className="text-center page-title">Approve Faculty Leave</h3>
      <div className="card mt-3">
        <div className="card-body">
          {leaves.length === 0 ? <div><em>No leave requests</em></div> : (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr><th>Faculty</th><th>Period</th><th>Type</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td>{l.faculty}</td>
                      <td>{l.from} → {l.to}</td>
                      <td>{l.type}</td>
                      <td>{l.reason}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}