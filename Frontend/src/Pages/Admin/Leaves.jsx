import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge } from "../../components/UI";
import { FileText, CheckCircle, XCircle, Search } from "lucide-react";

export const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let response;
      if (filterStatus === "pending") {
        response = await adminAPI.getPendingLeaves();
      } else {
        response = await adminAPI.getAllLeaves();
      }

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

  const handleApprove = async (leaveId) => {
    if (!confirm("Approve this leave application?")) {
      return;
    }

    try {
      const response = await adminAPI.approveLeave(leaveId);
      if (response.data.success) {
        alert("Leave application approved successfully");
        fetchLeaves();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve leave");
    }
  };

  const handleReject = async (leaveId) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) {
      return; // User cancelled
    }

    try {
      const response = await adminAPI.rejectLeave(leaveId, { reason });
      if (response.data.success) {
        alert("Leave application rejected");
        fetchLeaves();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject leave");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredLeaves = leaves.filter(
    (leave) =>
      leave.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.applicant_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;

  const columns = [
    {
      header: "Applicant",
      accessor: (row) => (
        <div>
          <div className="font-medium">{row.applicant_name}</div>
          <div className="text-sm text-gray-500">{row.applicant_code}</div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: (row) => (
        <Badge variant={row.applicant_role === "faculty" ? "info" : "primary"}>
          {row.applicant_role}
        </Badge>
      ),
    },
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
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex space-x-2">
          {row.status === "pending" && (
            <>
              <button
                onClick={() => handleApprove(row.leave_id)}
                className="text-green-600 hover:text-green-800 flex items-center"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(row.leave_id)}
                className="text-red-600 hover:text-red-800 flex items-center"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <FileText className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Leave Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {pendingCount}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, or leave type..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="pending">Pending Only</option>
              <option value="all">All Leaves</option>
            </select>
          </div>
        </div>
        <Table columns={columns} data={filteredLeaves} />
      </Card>
    </div>
  );
};
