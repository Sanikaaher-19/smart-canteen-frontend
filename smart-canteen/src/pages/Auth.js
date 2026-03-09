import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Auth.css";

export default function Auth({ onLogin = () => {} }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        await API.post("/api/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "CUSTOMER",
        });
        setIsSignup(false);
        setForm({ name: "", email: "", password: "", role: "CUSTOMER" });
        setSuccessMessage("Registration successful! Please log in.");
      } else {
        const res = await API.post("/api/auth/login", {
          email: form.email,
          password: form.password,
          role: form.role,
        });

        const token = res.data?.token ?? res.data?.data?.token;
        if (token) localStorage.setItem("token", token);
        localStorage.setItem("role", form.role.toUpperCase());
        // Updated: store email lowercase and trimmed for tracking/filtering
        localStorage.setItem("userEmail", form.email.trim().toLowerCase());

        const userRole = form.role.toUpperCase();
        onLogin(userRole);

        if (userRole === "KITCHEN_STAFF") {
          navigate("/kitchen");
        } else if (userRole === "ADMIN") {
          navigate("/admin/analytics");
        } else {
          navigate("/menu");
        }
      }
    } catch (err) {
      setError(err?.response?.data || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-shell">
        <div className="stall-hero" aria-hidden="true">
          <img src="/images/canteenlight.png" alt="" className="stall-image" />
        </div>

        <div className="auth-box">
          <div className="auth-card-top">
            <h2>
              Canteen Bite<br />
              <span>Log-in/sign-up</span>
            </h2>
          </div>

          <div className="tabs">
            <span
              className={!isSignup ? "active" : ""}
              onClick={() => {
                setIsSignup(false);
                setError(null);
                setSuccessMessage("");
              }}
            >
              Log In
            </span>
            <span
              className={isSignup ? "active" : ""}
              onClick={() => {
                setIsSignup(true);
                setError(null);
                setSuccessMessage("");
              }}
            >
              Sign Up
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-field">
                <span>Full Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </label>

            {!isSignup && (
              <label className="auth-field">
                <span>Continue As</span>
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="CUSTOMER">Customer</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
            )}

            {error && (
              <div className="auth-error">
                {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
              </div>
            )}
            {successMessage && <div className="auth-success">{successMessage}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


