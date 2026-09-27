import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import "../../styles/pages/auth/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // =====================================================
    // LOGIN
    // =====================================================

    try {
      const response = await login(email, password);

      // ===================================================
      // VALID ROLE CHECK
      // ===================================================

      if (
        response.role !== "Administrator" &&
        response.role !== "Doctor" &&
        response.role !== "Receptionist"
      ) {
        toast.error("Your account does not have a valid system role.");
        return;
      }

      // ===================================================
      // SUCCESS MESSAGE
      // ===================================================

      toast.success(`Welcome back, ${response.fullName}!`);

      // ===================================================
      // ROLE-BASED NAVIGATION
      // ===================================================

      switch (response.role) {
        case "Administrator":
          navigate("/admin/dashboard", { replace: true });
          break;

        case "Doctor":
          navigate("/doctor/dashboard", { replace: true });
          break;

        case "Receptionist":
          navigate("/receptionist/dashboard", { replace: true });
          break;

        default:
          break;
      }
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Unable to sign in. Please check your email and password.";

      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smarthealth-login-page">
      {/* =====================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div className="smarthealth-login-background">
        <div className="smarthealth-login-orb smarthealth-login-orb-one"></div>
        <div className="smarthealth-login-orb smarthealth-login-orb-two"></div>
      </div>

      {/* =====================================================
          MAIN LOGIN CONTAINER
      ====================================================== */}

      <div className="smarthealth-login-container">
        {/* ===================================================
            LEFT BRAND PANEL
        ==================================================== */}

        <div className="smarthealth-login-brand-panel">
          {/* Brand */}

          <div className="smarthealth-login-brand">
            <div className="smarthealth-login-logo">
              <span>+</span>
            </div>

            <div className="smarthealth-login-brand-text">
              <h1>SmartHealthcare</h1>
              <p>Healthcare Management System</p>
            </div>
          </div>

          {/* Main Content */}

          <div className="smarthealth-login-brand-content">
            <span className="smarthealth-login-badge">SMART HEALTHCARE</span>

            <h2>
              Smarter Healthcare.
              <br />
              <span>Better Care.</span>
            </h2>

            <p>
              A unified platform designed to help healthcare teams manage
              appointments, medical records, billing, notifications, and
              healthcare operations efficiently.
            </p>
          </div>

          {/* Features */}

          <div className="smarthealth-login-features">
            <div className="smarthealth-login-feature">
              <div className="smarthealth-login-feature-icon">✓</div>

              <div className="smarthealth-login-feature-text">
                <strong>Secure Access</strong>
                <span>Role-based authentication</span>
              </div>
            </div>

            <div className="smarthealth-login-feature">
              <div className="smarthealth-login-feature-icon">✓</div>

              <div className="smarthealth-login-feature-text">
                <strong>Connected Care</strong>
                <span>Healthcare information in one place</span>
              </div>
            </div>

            <div className="smarthealth-login-feature">
              <div className="smarthealth-login-feature-icon">✓</div>

              <div className="smarthealth-login-feature-text">
                <strong>AI-Assisted</strong>
                <span>Intelligent healthcare assistance</span>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="smarthealth-login-brand-footer">
            <span>© 2026 SmartHealthcare</span>
            <span>Secure Healthcare Platform</span>
          </div>
        </div>

        {/* ===================================================
            RIGHT LOGIN PANEL
        ==================================================== */}

        <div className="smarthealth-login-form-panel">
          <div className="smarthealth-login-card">
            {/* =================================================
                MOBILE BRAND
            ================================================== */}

            <div className="smarthealth-login-mobile-brand">
              <div className="smarthealth-login-logo">
                <span>+</span>
              </div>

              <div className="smarthealth-login-brand-text">
                <h1>SmartHealthcare</h1>
                <p>Healthcare Management System</p>
              </div>
            </div>

            {/* =================================================
                LOGIN HEADER
            ================================================== */}

            <div className="smarthealth-login-header">
              <span className="smarthealth-login-welcome">WELCOME BACK</span>

              <h2>Sign in to your account</h2>

              <p>
                Enter your credentials to access the healthcare management
                system.
              </p>
            </div>

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form className="smarthealth-login-form" onSubmit={handleSubmit}>
              {/* =================================================
                  EMAIL
              ================================================== */}

              <div className="smarthealth-login-field">
                <label htmlFor="email">Email Address</label>

                <div className="smarthealth-login-input-wrapper">
                  <span className="smarthealth-login-input-icon">@</span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* =================================================
                  PASSWORD
              ================================================== */}

              <div className="smarthealth-login-field">
                <div className="smarthealth-login-label-row">
                  <label htmlFor="password">Password</label>

                  <span className="smarthealth-login-security-text">
                    Secure login
                  </span>
                </div>

                <div className="smarthealth-login-input-wrapper">
                  <span className="smarthealth-login-input-icon">*</span>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="smarthealth-login-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* =================================================
                  LOGIN BUTTON
              ================================================== */}

              <button
                type="submit"
                className="smarthealth-login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="smarthealth-login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="smarthealth-login-button-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                REGISTER LINK
            ================================================== */}

            <div className="smarthealth-login-register">
              <span>Don't have an account?</span>

              <Link to="/register">Create an account</Link>
            </div>

            {/* =================================================
                SECURITY INFORMATION
            ================================================== */}

            <div className="smarthealth-login-security">
              <div className="smarthealth-login-security-lock">🔒</div>

              <div>
                <strong>Secure & Protected</strong>

                <p>
                  Your account information is protected using secure
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
