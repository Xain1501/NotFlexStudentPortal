import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge, Modal } from "../../components/UI";
import { Users, Plus, Edit, Trash2, Search } from "lucide-react";

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    cnic: "",
    major_dept_id: "",
    current_semester: 1,
    date_of_birth: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, deptsRes] = await Promise.all([
        adminAPI.getAllStudents(),
        adminAPI.getDepartments?.() ||
          Promise.resolve({
            data: { success: true, data: { departments: [] } },
          }),
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data.students || []);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data?.departments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStudent(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      cnic: "",
      major_dept_id: departments[0]?.dept_id || "",
      current_semester: 1,
      date_of_birth: "",
    });
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || "",
      cnic: student.cnic || "",
      major_dept_id: student.major_dept_id,
      current_semester: student.current_semester,
      date_of_birth: student.date_of_birth || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const response = await adminAPI.updateStudent(
          editingStudent.student_id,
          formData
        );
        if (response.data.success) {
          alert("Student updated successfully");
          setShowModal(false);
          fetchData();
        }
      } else {
        const response = await adminAPI.createStudent(formData);
        if (response.data.success) {
          let message = "Student created successfully";
          if (response.data.generated_password) {
            message += `\n\nGenerated Credentials:\nUsername: ${
              response.data.username || response.data.student_code
            }\nPassword: ${
              response.data.generated_password
            }\n\nPlease save these credentials!`;
          }
          alert(message);
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (studentId) => {
    if (
      !confirm(
        "Are you sure you want to delete this student? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await adminAPI.deleteStudent(studentId);
      if (response.data.success) {
        alert("Student deleted successfully");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student");
    }
  };

  const handleToggleStatus = async (studentId) => {
    try {
      const response = await adminAPI.toggleStudentStatus(studentId);
      if (response.data.success) {
        alert(response.data.message);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredStudents = students.filter(
    (s) =>
      s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Student Code", key: "student_code" },
    {
      header: "Name",
      accessor: (row) => `${row.first_name} ${row.last_name}`,
    },
    { header: "Email", key: "email" },
    { header: "Department", key: "dept_name" },
    { header: "Semester", key: "current_semester" },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "active" ? "success" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Enrolled Courses",
      key: "enrolled_courses",
    },
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
          <button
            onClick={() => handleToggleStatus(row.student_id)}
            className="text-yellow-600 hover:text-yellow-800"
            title="Toggle Status"
          >
            {row.status === "active" ? "❌" : "✅"}
          </button>
          <button
            onClick={() => handleDelete(row.student_id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Management
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Student
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table columns={columns} data={filteredStudents} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? "Edit Student" : "Create New Student"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                type="text"
                required
                className="input"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                type="text"
                required
                className="input"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                type="text"
                className="input"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">CNIC</label>
              <input
                type="text"
                className="input"
                value={formData.cnic}
                onChange={(e) =>
                  setFormData({ ...formData, cnic: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department</label>
              <select
                required
                className="input"
                value={formData.major_dept_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    major_dept_id: parseInt(e.target.value),
                  })
                }
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Current Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                className="input"
                value={formData.current_semester}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_semester: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              className="input"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
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
              {editingStudent ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
