import { useState, useEffect } from "react";
import { facultyAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge, Modal } from "../../components/UI";
import { FileText, Plus } from "lucide-react";

export const FacultyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getLeaves();
      if (response.data.success) {
        setLeaves(response.data.data.leaves || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load leave applications"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      leave_type: "casual",
      start_date: "",
      end_date: "",
      reason: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await facultyAPI.applyLeave(formData);
      if (response.data.success) {
        alert("Leave application submitted successfully");
        setShowModal(false);
        fetchLeaves();
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to submit leave application"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const columns = [
    { header: "Leave Type", key: "leave_type" },
    {
      header: "Start Date",
      accessor: (row) => new Date(row.start_date).toLocaleDateString(),
    },
    {
      header: "End Date",
      accessor: (row) => new Date(row.end_date).toLocaleDateString(),
    },
    {
      header: "Days",
      accessor: (row) => {
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return days;
      },
    },
    {
      header: "Reason",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.reason}>
          {row.reason}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "approved"
              ? "success"
              : row.status === "rejected"
              ? "danger"
              : "warning"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Applied On",
      accessor: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Leave Applications
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Apply for Leave
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <Table columns={columns} data={leaves} />
      </Card>

      {/* Application Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select
              required
              className="input"
              value={formData.leave_type}
              onChange={(e) =>
                setFormData({ ...formData, leave_type: e.target.value })
              }
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                required
                className="input"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                required
                className="input"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Reason</label>
            <textarea
              required
              rows="4"
              className="input"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
