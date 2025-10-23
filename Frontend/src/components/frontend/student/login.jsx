import { useState } from "react";
import "./login.css";
import log from "../Assets/AXIS.png"; // your image

export default function LoginPage({ userType = "Student" }) {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="login-page">
      {/* Left side: form */}
      <div className="login-left">
        <div className="login-content">
          <div className="login-form-card">
            <h3 className="login-title"> Login</h3>
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

      {/* Right side: gradient background with image */}
      <div className="login-right">
        <img src= {log} alt="Login Visual" className="login-image" />
      </div>
    </div>
  );
}
