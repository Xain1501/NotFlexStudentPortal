import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge } from "../../components/UI";
import { DollarSign, Search, CheckCircle } from "lucide-react";

export const AdminFees = () => {
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchFeeRecords();
  }, []);

  const fetchFeeRecords = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllFees();
      if (response.data.success) {
        setFeeRecords(response.data.data.fees || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fee records");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (feeId) => {
    if (!confirm("Mark this fee as paid?")) {
      return;
    }

    try {
      const response = await adminAPI.markFeePaid(feeId);
      if (response.data.success) {
        alert("Fee marked as paid successfully");
        fetchFeeRecords();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark fee as paid");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredRecords = feeRecords.filter((record) => {
    const matchesSearch =
      record.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fee_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "paid" && record.status === "paid") ||
      (filterStatus === "pending" && record.status === "pending") ||
      (filterStatus === "overdue" && record.status === "overdue");

    return matchesSearch && matchesFilter;
  });

  const totalPending = feeRecords
    .filter((r) => r.status !== "paid")
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  const totalPaid = feeRecords
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  const columns = [
    { header: "Student Code", key: "student_code" },
    { header: "Student Name", key: "student_name" },
    { header: "Fee Type", key: "fee_type" },
    {
      header: "Amount",
      accessor: (row) => `PKR ${parseFloat(row.amount || 0).toLocaleString()}`,
    },
    {
      header: "Due Date",
      accessor: (row) =>
        row.due_date ? new Date(row.due_date).toLocaleDateString() : "N/A",
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "paid"
              ? "success"
              : row.status === "overdue"
              ? "danger"
              : "warning"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Paid Date",
      accessor: (row) =>
        row.paid_date ? new Date(row.paid_date).toLocaleDateString() : "-",
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div>
          {row.status !== "paid" && (
            <button
              onClick={() => handleMarkPaid(row.fee_id)}
              className="text-green-600 hover:text-green-800 flex items-center"
              title="Mark as Paid"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Paid
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <DollarSign className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fee Management
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
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                PKR {totalPending.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">
                PKR {totalPaid.toLocaleString()}
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
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">
                {feeRecords.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-blue-600" />
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
              placeholder="Search by student code, name, or fee type..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        <Table columns={columns} data={filteredRecords} />
      </Card>
    </div>
  );
};
