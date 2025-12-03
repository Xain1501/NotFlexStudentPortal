import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge, Modal } from "../../components/UI";
import { BookOpen, Plus, Edit, Users } from "lucide-react";

export const AdminCourses = () => {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    course_id: "",
    faculty_id: "",
    section_number: "",
    semester: "",
    year: new Date().getFullYear(),
    max_capacity: 40,
    schedule: "",
    room: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, coursesRes, deptsRes, facultyRes] = await Promise.all(
        [
          adminAPI.getAllCourseSections(),
          adminAPI.getCourses?.() ||
            Promise.resolve({ data: { success: true, data: { courses: [] } } }),
          adminAPI.getDepartments?.() ||
            Promise.resolve({
              data: { success: true, data: { departments: [] } },
            }),
          adminAPI.getAllFaculty(),
        ]
      );

      if (sectionsRes.data.success) {
        setSections(sectionsRes.data.data.sections || []);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data?.courses || []);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data?.departments || []);
      }
      if (facultyRes.data.success) {
        setFaculty(facultyRes.data.data?.faculty || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load course sections");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    setFormData({
      course_id: courses[0]?.course_id || "",
      faculty_id: faculty[0]?.faculty_id || "",
      section_number: "",
      semester: "fall",
      year: new Date().getFullYear(),
      max_capacity: 40,
      schedule: "",
      room: "",
    });
    setShowModal(true);
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      course_id: section.course_id,
      faculty_id: section.faculty_id,
      section_number: section.section_number,
      semester: section.semester,
      year: section.year,
      max_capacity: section.max_capacity,
      schedule: section.schedule || "",
      room: section.room || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        const response = await adminAPI.updateCourseSection(
          editingSection.section_id,
          formData
        );
        if (response.data.success) {
          alert("Section updated successfully");
          setShowModal(false);
          fetchData();
        }
      } else {
        const response = await adminAPI.createCourseSection(formData);
        if (response.data.success) {
          alert("Section created successfully");
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
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
    {
      header: "Course",
      accessor: (row) => `${row.course_code} - ${row.course_name}`,
    },
    { header: "Section", key: "section_number" },
    {
      header: "Faculty",
      accessor: (row) => `${row.faculty_first_name} ${row.faculty_last_name}`,
    },
    {
      header: "Semester",
      accessor: (row) => (
        <Badge variant="info">
          {row.semester} {row.year}
        </Badge>
      ),
    },
    {
      header: "Enrolled/Capacity",
      accessor: (row) => (
        <span
          className={
            row.enrolled_students >= row.max_capacity ? "text-red-600" : ""
          }
        >
          {row.enrolled_students || 0} / {row.max_capacity}
        </span>
      ),
    },
    { header: "Schedule", key: "schedule" },
    { header: "Room", key: "room" },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Course Sections Management
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Section
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <Table columns={columns} data={sections} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSection ? "Edit Section" : "Create New Section"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Course</label>
            <select
              required
              className="input"
              value={formData.course_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  course_id: parseInt(e.target.value),
                })
              }
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Faculty</label>
            <select
              required
              className="input"
              value={formData.faculty_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  faculty_id: parseInt(e.target.value),
                })
              }
            >
              <option value="">Select Faculty</option>
              {faculty
                .filter((f) => f.status === "active")
                .map((fac) => (
                  <option key={fac.faculty_id} value={fac.faculty_id}>
                    {fac.first_name} {fac.last_name} - {fac.designation}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Section Number</label>
              <input
                type="text"
                required
                className="input"
                value={formData.section_number}
                onChange={(e) =>
                  setFormData({ ...formData, section_number: e.target.value })
                }
                placeholder="e.g., A, B, 01"
              />
            </div>
            <div>
              <label className="label">Max Capacity</label>
              <input
                type="number"
                required
                min="1"
                className="input"
                value={formData.max_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_capacity: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Semester</label>
              <select
                required
                className="input"
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
              >
                <option value="fall">Fall</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                required
                min="2020"
                max="2030"
                className="input"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Schedule</label>
            <input
              type="text"
              className="input"
              value={formData.schedule}
              onChange={(e) =>
                setFormData({ ...formData, schedule: e.target.value })
              }
              placeholder="e.g., Mon/Wed 10:00-11:30"
            />
          </div>

          <div>
            <label className="label">Room</label>
            <input
              type="text"
              className="input"
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
              placeholder="e.g., Room 101"
            />
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
              {editingSection ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
