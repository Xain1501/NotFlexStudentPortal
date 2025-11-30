import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, testConnection } from "../../api/client";
import "./login.css"; 
import log from "../../assets/AXIS.png";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when typing
  };

  const testBackendConnection = async () => {
    try {
      setDebugInfo("Testing backend connection...");
      const result = await testConnection();
      setDebugInfo(`✅ Backend is running: ${JSON.stringify(result)}`);
      return true;
    } catch (err) {
      setDebugInfo(`❌ Backend connection failed: ${err.message}`);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDebugInfo("");

    try {
      console.log("🚀 Starting login process...");
      
      // Test backend first
      const isBackendRunning = await testBackendConnection();
      
      if (!isBackendRunning) {
        setError("Backend server is not running. Please start the Flask server on port 5000.");
        return;
      }

      console.log("🔑 Attempting login with:", form);
      const response = await login(form);
      
      console.log("✅ Login response:", response);

      if (response.success) {
        const user = response.data.user;
        const token = response.data.token;

        // Save user info (using your existing pattern)
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        
        // Also save individual items for easy access
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user_role", user.role);
        localStorage.setItem("user_id", user.user_id);
        localStorage.setItem("username", user.username);

        setDebugInfo(`🎉 Login successful! Role: ${user.role}`);
        console.log("🎉 Login successful! Role:", user.role);

        // Redirect based on role
        switch(user.role) {
          case "student":
            navigate("/student");
            break;
          case "faculty":
            navigate("/faculty");
            break;
          case "admin":
            navigate("/admin");
            break;
          default:
            setError("Unknown user role");
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      if (err.response) {
        setError(err.response.data?.message || "Login failed");
      } else {
        setError(err.message || "Network error. Backend may be offline.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left side: form */}
      <div className="login-left">
        <div className="login-content">
          <div className="login-form-card">
            <h3 className="login-title">Login</h3>

            {error && (
              <div style={{ 
                color: "red", 
                backgroundColor: "#ffe6e6",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "15px",
                border: "1px solid #ffcccc",
                textAlign: "center"
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
                disabled={loading}
                className="login-input"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="login-input"
              />
              <button 
                className="gradient-btn" 
                type="submit"
                disabled={loading}
                style={{ 
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: illustration */}
      <div className="login-right">
        <img src={log} alt="Login Visual" className="login-image" />
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div style={{ 
          position: "fixed",
          bottom: "10px",
          left: "10px",
          right: "10px",
          padding: "10px", 
          backgroundColor: "#f8f9fa", 
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          fontSize: "12px",
          whiteSpace: "pre-wrap",
          zIndex: 1000,
          maxWidth: "400px",
          margin: "0 auto"
        }}>
          <strong>Debug Info:</strong>
          {debugInfo}
        </div>
      )}
    </div>
  );
}