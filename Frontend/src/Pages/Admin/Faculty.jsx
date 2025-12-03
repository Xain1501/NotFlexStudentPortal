import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Card, Table, LoadingSpinner, Badge, Modal } from "../../components/UI";
import { UserCheck, Plus, Edit, Trash2, Search } from "lucide-react";

export const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    cnic: "",
    dept_id: "",
    designation: "lecturer",
    office_location: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facultyRes, deptsRes] = await Promise.all([
        adminAPI.getAllFaculty(),
        adminAPI.getDepartments?.() ||
          Promise.resolve({
            data: { success: true, data: { departments: [] } },
          }),
      ]);

      if (facultyRes.data.success) {
        setFaculty(facultyRes.data.data.faculty || []);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data?.departments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFaculty(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      cnic: "",
      dept_id: departments[0]?.dept_id || "",
      designation: "lecturer",
      office_location: "",
    });
    setShowModal(true);
  };

  const handleEdit = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      first_name: fac.first_name,
      last_name: fac.last_name,
      email: fac.email,
      phone: fac.phone || "",
      cnic: fac.cnic || "",
      dept_id: fac.dept_id,
      designation: fac.designation || "lecturer",
      office_location: fac.office_location || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        const response = await adminAPI.updateFaculty(
          editingFaculty.faculty_id,
          formData
        );
        if (response.data.success) {
          alert("Faculty member updated successfully");
          setShowModal(false);
          fetchData();
        }
      } else {
        const response = await adminAPI.createFaculty(formData);
        if (response.data.success) {
          let message = "Faculty member created successfully";
          if (response.data.generated_password) {
            message += `\n\nGenerated Credentials:\nUsername: ${
              response.data.username || response.data.faculty_code
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

  const handleDelete = async (facultyId) => {
    if (
      !confirm(
        "Are you sure you want to delete this faculty member? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await adminAPI.deleteFaculty(facultyId);
      if (response.data.success) {
        alert("Faculty member deleted successfully");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete faculty");
    }
  };

  const handleToggleStatus = async (facultyId) => {
    try {
      const response = await adminAPI.toggleFacultyStatus(facultyId);
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

  const filteredFaculty = faculty.filter(
    (f) =>
      f.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.faculty_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Faculty Code", key: "faculty_code" },
    {
      header: "Name",
      accessor: (row) => `${row.first_name} ${row.last_name}`,
    },
    { header: "Email", key: "email" },
    { header: "Department", key: "dept_name" },
    {
      header: "Designation",
      accessor: (row) => (
        <Badge variant="info">{row.designation || "lecturer"}</Badge>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "active" ? "success" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Teaching Sections",
      key: "teaching_sections",
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
            onClick={() => handleToggleStatus(row.faculty_id)}
            className="text-yellow-600 hover:text-yellow-800"
            title="Toggle Status"
          >
            {row.status === "active" ? "❌" : "✅"}
          </button>
          <button
            onClick={() => handleDelete(row.faculty_id)}
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
          <UserCheck className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Faculty Management
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Faculty
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
              placeholder="Search faculty..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table columns={columns} data={filteredFaculty} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFaculty ? "Edit Faculty" : "Create New Faculty"}
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
                value={formData.dept_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dept_id: parseInt(e.target.value),
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
              <label className="label">Designation</label>
              <select
                required
                className="input"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
              >
                <option value="lecturer">Lecturer</option>
                <option value="assistant_professor">Assistant Professor</option>
                <option value="associate_professor">Associate Professor</option>
                <option value="professor">Professor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Office Location</label>
            <input
              type="text"
              className="input"
              value={formData.office_location}
              onChange={(e) =>
                setFormData({ ...formData, office_location: e.target.value })
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
              {editingFaculty ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
