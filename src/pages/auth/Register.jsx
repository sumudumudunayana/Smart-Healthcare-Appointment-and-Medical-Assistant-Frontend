import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import "../../styles/pages/auth/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // =====================================================
    // REQUIRED FIELD VALIDATION
    // =====================================================

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // =====================================================
    // NAME VALIDATION
    // =====================================================

    if (fullName.length < 2) {
      toast.error("Please enter a valid full name.");
      return;
    }

    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    if (password.length < 6) {
      toast.error("Password must contain at least 6 characters.");
      return;
    }

    // =====================================================
    // PASSWORD CONFIRMATION
    // =====================================================

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // ===================================================
      // REGISTER WITH BACKEND
      // ===================================================

      await register(fullName, email, phone || null, password);

      // ===================================================
      // SUCCESS NOTIFICATION
      // ===================================================

      toast.success("Account created successfully! Redirecting to login...");

      // ===================================================
      // REDIRECT TO LOGIN
      // ===================================================

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Unable to create your account. Please try again.";

      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smarthealth-register-page">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="smarthealth-register-background">
        <div className="smarthealth-register-orb smarthealth-register-orb-one"></div>

        <div className="smarthealth-register-orb smarthealth-register-orb-two"></div>
      </div>

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="smarthealth-register-container">
        {/* ===================================================
            LEFT BRAND PANEL
        ==================================================== */}

        <div className="smarthealth-register-brand-panel">
          {/* Brand */}

          <div className="smarthealth-register-brand">
            <div className="smarthealth-register-logo">
              <span>+</span>
            </div>

            <div className="smarthealth-register-brand-text">
              <h1>SmartHealthcare</h1>

              <p>Healthcare Management System</p>
            </div>
          </div>

          {/* Main Content */}

          <div className="smarthealth-register-brand-content">
            <span className="smarthealth-register-badge">
              JOIN SMART HEALTHCARE
            </span>

            <h2>
              Your Healthcare.
              <br />
              <span>Connected.</span>
            </h2>

            <p>
              Create your account and access a secure healthcare management
              platform designed to connect healthcare teams and improve everyday
              operations.
            </p>
          </div>

          {/* Features */}

          <div className="smarthealth-register-features">
            <div className="smarthealth-register-feature">
              <div className="smarthealth-register-feature-icon">✓</div>

              <div className="smarthealth-register-feature-text">
                <strong>Secure Account</strong>

                <span>Your information is protected</span>
              </div>
            </div>

            <div className="smarthealth-register-feature">
              <div className="smarthealth-register-feature-icon">✓</div>

              <div className="smarthealth-register-feature-text">
                <strong>Easy Access</strong>

                <span>Simple and convenient healthcare management</span>
              </div>
            </div>

            <div className="smarthealth-register-feature">
              <div className="smarthealth-register-feature-icon">✓</div>

              <div className="smarthealth-register-feature-text">
                <strong>Connected Healthcare</strong>

                <span>Everything designed around better care</span>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="smarthealth-register-brand-footer">
            <span>© 2026 SmartHealthcare</span>

            <span>Secure Healthcare Platform</span>
          </div>
        </div>

        {/* ===================================================
            RIGHT REGISTER PANEL
        ==================================================== */}

        <div className="smarthealth-register-form-panel">
          <div className="smarthealth-register-card">
            {/* =================================================
                MOBILE BRAND
            ================================================== */}

            <div className="smarthealth-register-mobile-brand">
              <div className="smarthealth-register-logo">
                <span>+</span>
              </div>

              <div className="smarthealth-register-brand-text">
                <h1>SmartHealthcare</h1>

                <p>Healthcare Management System</p>
              </div>
            </div>

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="smarthealth-register-header">
              <span className="smarthealth-register-welcome">GET STARTED</span>

              <h2>Create your account</h2>

              <p>Register your account to get started with SmartHealthcare.</p>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <form className="smarthealth-register-form" onSubmit={handleSubmit}>
              {/* =================================================
                  FULL NAME
              ================================================== */}

              <div className="smarthealth-register-field">
                <label htmlFor="fullName">Full Name</label>

                <div className="smarthealth-register-input-wrapper">
                  <span className="smarthealth-register-input-icon">👤</span>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* =================================================
                  EMAIL + PHONE
              ================================================== */}

              <div className="smarthealth-register-fields-row">
                {/* Email */}

                <div className="smarthealth-register-field">
                  <label htmlFor="email">Email Address</label>

                  <div className="smarthealth-register-input-wrapper">
                    <span className="smarthealth-register-input-icon">@</span>

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

                {/* Phone */}

                <div className="smarthealth-register-field">
                  <label htmlFor="phone">
                    Phone Number
                    <span className="smarthealth-register-optional">
                      Optional
                    </span>
                  </label>

                  <div className="smarthealth-register-input-wrapper">
                    <span className="smarthealth-register-input-icon">☎</span>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      autoComplete="tel"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  PASSWORD + CONFIRM PASSWORD
              ================================================== */}

              <div className="smarthealth-register-fields-row">
                {/* Password */}

                <div className="smarthealth-register-field">
                  <label htmlFor="password">Password</label>

                  <div className="smarthealth-register-input-wrapper">
                    <span className="smarthealth-register-input-icon">*</span>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="smarthealth-register-password-toggle"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}

                <div className="smarthealth-register-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>

                  <div className="smarthealth-register-input-wrapper">
                    <span className="smarthealth-register-input-icon">*</span>

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="smarthealth-register-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {/* =================================================
                  PASSWORD INFORMATION
              ================================================== */}

              <div className="smarthealth-register-password-info">
                <span className="smarthealth-register-password-info-icon">
                  ✓
                </span>

                <span>Password must contain at least 6 characters.</span>
              </div>

              {/* =================================================
                  REGISTER BUTTON
              ================================================== */}

              <button
                type="submit"
                className="smarthealth-register-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="smarthealth-register-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="smarthealth-register-button-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                LOGIN LINK
            ================================================== */}

            <div className="smarthealth-register-login">
              <span>Already have an account?</span>

              <Link to="/login">Sign in</Link>
            </div>

            {/* =================================================
                SECURITY
            ================================================== */}

            <div className="smarthealth-register-security">
              <div className="smarthealth-register-security-icon">🔒</div>

              <div>
                <strong>Your information is secure</strong>

                <p>
                  We use secure authentication to protect your account
                  information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
