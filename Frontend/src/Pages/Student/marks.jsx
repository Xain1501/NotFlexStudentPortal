import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Card, Table, LoadingSpinner } from "../../components/UI";

export const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMarks();
      if (response.data.success) {
        setMarks(response.data.data.courses || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load marks");
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        My Marks
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {marks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No marks available yet
            </p>
          </Card>
        ) : (
          marks.map((course, idx) => (
            <Card key={idx} title={`${course.code} - ${course.name}`}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Assessment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Marks Obtained
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Total Marks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {course.marks && course.marks.length > 0 ? (
                      course.marks.map((mark, markIdx) => (
                        <tr key={markIdx}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {mark.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {mark.score !== null ? mark.score : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {mark.outOf}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`font-medium ${
                                mark.score !== null &&
                                (mark.score / mark.outOf) * 100 >= 60
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {mark.score !== null
                                ? `${Math.round(
                                    (mark.score / mark.outOf) * 100
                                  )}%`
                                : "-"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No marks uploaded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {course.marks && course.marks.length > 0 && (
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                          {course.total_obtained || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                          100
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`font-bold ${
                              course.percentage >= 60
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {course.percentage}% ({course.grade})
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
