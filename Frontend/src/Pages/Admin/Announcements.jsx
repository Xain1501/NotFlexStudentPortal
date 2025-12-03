import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Modal } from "../../components/UI";
import { Megaphone, Plus, Trash2 } from "lucide-react";

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "all",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnnouncements();
      if (response.data.success) {
        setAnnouncements(response.data.data.announcements || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: "",
      content: "",
      target_audience: "all",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createAnnouncement(formData);
      if (response.data.success) {
        alert("Announcement created successfully");
        setShowModal(false);
        fetchAnnouncements();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create announcement");
    }
  };

  const handleDelete = async (announcementId) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await adminAPI.deleteAnnouncement(announcementId);
      if (response.data.success) {
        alert("Announcement deleted successfully");
        fetchAnnouncements();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete announcement");
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
    { header: "Title", key: "title" },
    {
      header: "Content",
      accessor: (row) => (
        <div className="max-w-md truncate" title={row.content}>
          {row.content}
        </div>
      ),
    },
    {
      header: "Target Audience",
      key: "target_audience",
    },
    {
      header: "Posted By",
      key: "posted_by_name",
    },
    {
      header: "Created At",
      accessor: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <button
          onClick={() => handleDelete(row.announcement_id)}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Megaphone className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Announcements Management
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Announcement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <Table columns={columns} data={announcements} />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create System Announcement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Content</label>
            <textarea
              required
              rows="4"
              className="input"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Target Audience</label>
            <select
              className="input"
              value={formData.target_audience}
              onChange={(e) =>
                setFormData({ ...formData, target_audience: e.target.value })
              }
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="faculty">Faculty Only</option>
            </select>
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
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
