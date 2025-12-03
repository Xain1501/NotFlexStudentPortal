import { useState, useEffect } from "react";
import { studentAPI, courseAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge, Modal } from "../../components/UI";
import { Plus, X } from "lucide-react";

export const StudentCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrolledRes, availableRes] = await Promise.all([
        studentAPI.getEnrolledCourses(),
        courseAPI.getAvailableCourses("Fall", "2024"),
      ]);

      if (enrolledRes.data.success) {
        setEnrolledCourses(enrolledRes.data.data.enrollments || []);
      }
      if (availableRes.data.success) {
        setAvailableCourses(availableRes.data.data.courses || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (sectionId) => {
    try {
      setEnrolling(true);
      const response = await studentAPI.enrollCourse(sectionId);
      if (response.data.success) {
        alert("Successfully enrolled in course!");
        setShowEnrollModal(false);
        fetchData();
      } else {
        alert(response.data.message || "Failed to enroll");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (sectionId) => {
    if (!confirm("Are you sure you want to unenroll from this course?")) {
      return;
    }

    try {
      const response = await studentAPI.unenrollCourse(sectionId);
      if (response.data.success) {
        alert("Successfully unenrolled from course");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unenroll from course");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrolledColumns = [
    { header: "Course Code", key: "course_code" },
    { header: "Course Name", key: "course_name" },
    { header: "Credits", key: "credits" },
    { header: "Section", key: "section_code" },
    { header: "Schedule", key: "schedule" },
    {
      header: "Status",
      accessor: (row) => <Badge variant="success">{row.status}</Badge>,
    },
    {
      header: "Actions",
      accessor: (row) => (
        <button
          onClick={() => handleUnenroll(row.section_id)}
          className="text-red-600 hover:text-red-800 flex items-center text-sm"
        >
          <X className="h-4 w-4 mr-1" />
          Drop
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Courses
        </h1>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Enroll in Course
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card title="Enrolled Courses">
        <Table columns={enrolledColumns} data={enrolledCourses} />
      </Card>

      {/* Enroll Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll in a Course"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {availableCourses.map((course) => {
              const isEnrolled = enrolledCourses.some(
                (ec) => ec.section_id === course.section_id
              );
              const seatsAvailable =
                course.max_capacity - (course.enrolled || 0);

              return (
                <div
                  key={course.section_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.course_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {course.course_code} • Section {course.section_code} •{" "}
                        {course.credits} Credits
                      </p>
                    </div>
                    <Badge variant={seatsAvailable > 0 ? "success" : "danger"}>
                      {seatsAvailable} seats left
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {course.semester} {course.year}
                    </span>
                    {isEnrolled ? (
                      <Badge variant="primary">Already Enrolled</Badge>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.section_id)}
                        disabled={enrolling || seatsAvailable <= 0}
                        className="btn btn-primary text-sm"
                      >
                        {enrolling ? "Enrolling..." : "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
