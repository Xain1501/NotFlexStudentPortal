import React, { useEffect, useState } from "react";
import { getFacultyDashboard } from "./api.js";

export default function FacultyHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getFacultyDashboard();
        if (mounted) setDashboard(res);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Faculty Dashboard</h2>
      <pre>{JSON.stringify(dashboard, null, 2)}</pre>
    </div>
  );
}
