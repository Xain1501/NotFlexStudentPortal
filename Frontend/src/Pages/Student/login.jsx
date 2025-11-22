import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Student/login.css";
import log from "../../assets/AXIS.png";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        form
      );

      const user = response.data.user;
      const token = response.data.token;

      // Save user and token
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Redirect based on role
      if (user.role === "student") {
        navigate("/");
      } else if (user.role === "faculty") {
        navigate("/faculty");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        setError("Unknown user role");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Network error. Backend may be offline.");
      }
    }
  };

  return (
    <div className="login-page">
      {/* Left side: form */}
      <div className="login-left">
        <div className="login-content">
          <div className="login-form-card">
            <h3 className="login-title"> Login</h3>

            {error && (
              <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
                className="login-input"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="login-input"
              />
              <button className="gradient-btn" type="submit">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: illustration */}
      <div className="login-right">
        <img src={log} alt="Login Visual" className="login-image" />
      </div>
    </div>
  );
}
