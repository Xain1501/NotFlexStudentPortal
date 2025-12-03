import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Card, LoadingSpinner } from "../../components/UI";
import { Award } from "lucide-react";

export const StudentTranscript = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getTranscript();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transcript");
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

  const semesters = data?.semesters || [];
  const cgpa = data?.cgpa || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Award className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Academic Transcript
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* CGPA Card */}
      <Card className="mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Cumulative Grade Point Average
          </p>
          <p className="text-5xl font-bold text-primary-600">
            {cgpa.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">out of 4.00</p>
        </div>
      </Card>

      {/* Semester Records */}
      <div className="space-y-6">
        {semesters.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No transcript records available
            </p>
          </Card>
        ) : (
          semesters.map((semester, idx) => (
            <Card key={idx} title={semester.semester}>
              <div className="mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Semester GPA:
                </span>
                <span className="ml-2 text-xl font-bold text-primary-600">
                  {(semester.sgpa || 0).toFixed(2)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Course Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Credits
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Grade Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {semester.courses && semester.courses.length > 0 ? (
                      semester.courses.map((course, courseIdx) => (
                        <tr key={courseIdx}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {course.course_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {course.course_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {course.credits}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`font-medium ${
                                ["A", "B"].includes(course.final_grade)
                                  ? "text-green-600"
                                  : ["C", "D"].includes(course.final_grade)
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {course.final_grade || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {course.grade_points || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No courses recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
