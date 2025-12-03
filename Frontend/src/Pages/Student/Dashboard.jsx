import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Card, StatCard, LoadingSpinner, Badge } from "../../components/UI";
import { BookOpen, Calendar, TrendingUp, DollarSign, Bell } from "lucide-react";

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getDashboard();
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

  const student = data?.student;
  const courses = data?.enrolled_courses || [];
  const announcements = data?.announcements || { admin: [], faculty: [] };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {student?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {student?.department} • {student?.year}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Enrolled Courses"
          value={courses.length}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Avg Attendance"
          value={
            courses.length > 0
              ? `${Math.round(
                  courses.reduce(
                    (sum, c) => sum + (c.attendance_percentage || 0),
                    0
                  ) / courses.length
                )}%`
              : "N/A"
          }
          icon={Calendar}
          color="success"
        />
        <StatCard
          title="Status"
          value={student?.status || "Active"}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Fee Status"
          value="View Details"
          icon={DollarSign}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2">
          <Card title="Enrolled Courses">
            <div className="space-y-4">
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No enrolled courses
                </p>
              ) : (
                courses.map((course, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {course.course_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {course.course_code} • {course.credits} Credits
                        </p>
                      </div>
                      <Badge
                        variant={
                          course.status === "enrolled" ? "success" : "default"
                        }
                      >
                        {course.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Section:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.section_code}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Schedule:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.schedule || "TBA"}
                        </span>
                      </div>
                      {course.attendance_percentage !== undefined && (
                        <div className="col-span-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Attendance:
                          </span>
                          <span
                            className={`ml-2 font-medium ${
                              course.attendance_percentage >= 75
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {course.attendance_percentage}%
                          </span>
                          {course.attendance_left !== undefined && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({course.attendance_left} leaves left)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Announcements */}
        <div>
          <Card
            title={
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Announcements
              </div>
            }
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Admin Announcements */}
              {announcements.admin?.map((ann, idx) => (
                <div
                  key={`admin-${idx}`}
                  className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      {ann.title}
                    </h4>
                    <Badge variant="primary">Admin</Badge>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                    {ann.message}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}

              {/* Faculty Announcements */}
              {announcements.faculty?.map((ann, idx) => (
                <div
                  key={`faculty-${idx}`}
                  className="p-3 bg-green-50 dark:bg-green-900 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm text-green-900 dark:text-green-100">
                      {ann.title}
                    </h4>
                    <Badge variant="success">{ann.course_code}</Badge>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                    {ann.message}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                    {ann.faculty_name} •{" "}
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}

              {announcements.admin?.length === 0 &&
                announcements.faculty?.length === 0 && (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    No announcements
                  </p>
                )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
