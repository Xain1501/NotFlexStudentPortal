import React, { useEffect, useState } from 'react';
import { getTeacher, applyLeaveRequest } from '../Faculty/api';

export default function Leave() {
  const [teacher, setTeacher] = useState(null);
  const [form, setForm] = useState({ from:'', to:'', type:'Casual', reason:'' });

  useEffect(() => { getTeacher().then(t => setTeacher(t)); }, []);

  function submit(e) {
    e.preventDefault();
    if (!form.from || !form.to || !form.reason) return alert('Fill required fields');
    applyLeaveRequest(form).then(() => {
      alert('Leave applied (demo). Replace with real backend.');
      // refresh local view
      getTeacher().then(t => setTeacher(t));
      setForm({ from:'', to:'', type:'Casual', reason:'' });
    });
  }

  if (!teacher) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      <h3 className="text-center page-title">Apply for Leave</h3>

      <div className="card mt-3">
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label>From</label>
                <input type="date" className="form-control" value={form.from} onChange={e => setForm({...form, from: e.target.value})} required />
              </div>
              <div className="form-group col-md-4">
                <label>To</label>
                <input type="date" className="form-control" value={form.to} onChange={e => setForm({...form, to: e.target.value})} required />
              </div>
              <div className="form-group col-md-4">
                <label>Type</label>
                <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <textarea className="form-control" rows="3" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
            </div>

            <div className="text-right">
              <button className="btn btn-primary" type="submit">Apply</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h5 className="accent">Your Leave Requests</h5>
          <div className="table-responsive">
            <table className="table table-sm mt-2">
              <thead>
                <tr><th>Period</th><th>Type</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {teacher.leaves.length === 0 ? (
                  <tr><td colSpan="4"><em>No requests</em></td></tr>
                ) : teacher.leaves.map((l, i) => (
                  <tr key={i}>
                    <td>{l.from} → {l.to}</td>
                    <td>{l.type}</td>
                    <td>{l.reason}</td>
                    <td>{l.status}</td>
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