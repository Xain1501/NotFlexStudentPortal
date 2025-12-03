import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge } from "../../components/UI";
import { Calendar } from "lucide-react";

export const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAttendance();
      if (response.data.success) {
        setAttendance(response.data.data.courses || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
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

  const columns = [
    { header: "Course Code", key: "course_code" },
    { header: "Course Name", key: "course_name" },
    { header: "Total Classes", key: "total_classes" },
    { header: "Present", key: "present" },
    { header: "Absent", key: "absent" },
    {
      header: "Attendance %",
      accessor: (row) => {
        const percentage = row.attendance_percentage || 0;
        return (
          <span
            className={`font-medium ${
              percentage >= 75 ? "text-green-600" : "text-red-600"
            }`}
          >
            {percentage}%
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: (row) => {
        const percentage = row.attendance_percentage || 0;
        return (
          <Badge variant={percentage >= 75 ? "success" : "danger"}>
            {percentage >= 75 ? "Good" : "Low"}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Calendar className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Attendance
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Minimum 75% attendance is required for each
            course to be eligible for exams.
          </p>
        </div>
        <Table columns={columns} data={attendance} />
      </Card>
    </div>
  );
};
