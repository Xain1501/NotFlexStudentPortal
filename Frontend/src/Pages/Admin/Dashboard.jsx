import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, StatCard, LoadingSpinner } from "../../components/UI";
import { Users, BookOpen, DollarSign, UserCheck } from "lucide-react";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const admin = data?.admin;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome, {admin?.name || "Administrator"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.total_students || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Faculty"
          value={stats.total_faculty || 0}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="Total Courses"
          value={stats.total_courses || 0}
          icon={BookOpen}
          color="warning"
        />
        <StatCard
          title="Pending Fees"
          value={stats.pending_fees || 0}
          icon={DollarSign}
          color="danger"
        />
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary">Manage Students</button>
          <button className="btn btn-primary">Manage Faculty</button>
          <button className="btn btn-primary">Manage Courses</button>
          <button className="btn btn-secondary">View Fee Records</button>
          <button className="btn btn-secondary">Approve Leaves</button>
          <button className="btn btn-secondary">System Reports</button>
        </div>
      </Card>

      {/* System Info */}
      <div className="mt-6">
        <Card title="System Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {(stats.total_students || 0) + (stats.total_faculty || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">System Status</p>
              <p className="font-medium text-green-600">Online</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
