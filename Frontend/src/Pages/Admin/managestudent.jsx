import React, { useEffect, useState } from "react";
import { fetchAllUsers, deleteUser } from "./api.jsx"; // if fetchAllUsers name differs use getAllUsers from src/api/admin.js

export default function ManageStudent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchAllUsers();
        if (mounted) setUsers(res || []);
      } catch (err) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(id) {
    try {
      await deleteUser(id);
      setUsers((s) => s.filter((u) => u.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.message || err));
    }
  }

  if (loading) return <div>Loading students...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Students</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} ({u.email})
            <button onClick={() => handleDelete(u.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
