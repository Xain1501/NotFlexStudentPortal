import { useState, useEffect } from "react";
import { facultyAPI } from "../../services/api";
import { Card, StatCard, LoadingSpinner, Badge } from "../../components/UI";
import { BookOpen, Calendar, Users, Bell } from "lucide-react";

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getDashboard();
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

  const faculty = data?.faculty;
  const courses = data?.teaching_courses || [];
  const announcements = data?.announcements || { admin: [], faculty: [] };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {faculty?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {faculty?.department} • {faculty?.employee_id}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Teaching Courses"
          value={courses.length}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Total Students"
          value={courses.reduce(
            (sum, c) => sum + (c.enrolled_students || 0),
            0
          )}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Status"
          value={faculty?.status || "Active"}
          icon={Calendar}
          color="success"
        />
        <StatCard
          title="Announcements"
          value={announcements.faculty?.length || 0}
          icon={Bell}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teaching Courses */}
        <div className="lg:col-span-2">
          <Card title="Teaching Courses">
            <div className="space-y-4">
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No assigned courses
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
                          {course.course_code} • Section {course.section_code}
                        </p>
                      </div>
                      <Badge variant="primary">{course.credits} Credits</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Schedule:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.schedule || "TBA"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Room:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.room || "TBA"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Semester:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.semester} {course.year}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Capacity:
                        </span>
                        <span className="ml-2 font-medium">
                          {course.max_capacity}
                        </span>
                      </div>
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
