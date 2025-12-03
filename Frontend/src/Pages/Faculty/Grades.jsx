import { useState, useEffect } from "react";
import { facultyAPI } from "../../services/api";
import { Card, LoadingSpinner, Modal } from "../../components/UI";
import { Award, Upload } from "lucide-react";

export const FacultyGrades = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [examType, setExamType] = useState("midterm");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getCourses();
      if (response.data.success) {
        setCourses(response.data.data.courses || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setShowModal(true);
    try {
      const response = await facultyAPI.getCourseStudents(course.section_id);
      if (response.data.success) {
        const studentList = response.data.data.students || [];
        setStudents(studentList);
        // Initialize marks
        const initialMarks = {};
        studentList.forEach((s) => {
          initialMarks[s.student_id] = "";
        });
        setMarks(initialMarks);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load students");
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarks({
      ...marks,
      [studentId]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const marksData = Object.entries(marks)
        .filter(([_, mark]) => mark !== "")
        .map(([student_id, mark]) => ({
          student_id: parseInt(student_id),
          marks: parseFloat(mark),
          exam_type: examType,
        }));

      if (marksData.length === 0) {
        alert("Please enter at least one mark");
        return;
      }

      const response = await facultyAPI.uploadMarks({
        section_id: selectedCourse.section_id,
        marks: marksData,
      });

      if (response.data.success) {
        alert("Marks uploaded successfully");
        setShowModal(false);
        setSelectedCourse(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload marks");
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
      <div className="flex items-center mb-6">
        <Award className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Upload Grades
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <h2 className="text-xl font-semibold mb-4">Select a Course</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.section_id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md cursor-pointer transition-all"
              onClick={() => handleSelectCourse(course)}
            >
              <h3 className="font-semibold text-lg">{course.course_name}</h3>
              <p className="text-sm text-gray-600">
                {course.course_code} - Section {course.section_number}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {course.enrolled_students || 0} students enrolled
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Marks Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          selectedCourse
            ? `${selectedCourse.course_name} - Section ${selectedCourse.section_number}`
            : "Upload Marks"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Exam Type</label>
            <select
              className="input"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              required
            >
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Student Code
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id} className="border-t">
                    <td className="px-4 py-2 text-sm">
                      {student.student_code}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="input text-center w-24"
                        value={marks[student.student_id] || ""}
                        onChange={(e) =>
                          handleMarkChange(student.student_id, e.target.value)
                        }
                        placeholder="0-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Marks
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
