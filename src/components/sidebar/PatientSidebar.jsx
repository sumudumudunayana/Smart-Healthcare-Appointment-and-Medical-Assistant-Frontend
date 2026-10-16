import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/sidebar/PatientSidebar.css";

const PatientSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getInitials = (fullName) => {
    if (!fullName) return "P";

    const nameParts = fullName.trim().split(/\s+/);

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getLinkClass = ({ isActive }) =>
    `smarthealth-patient-sidebar-link ${
      isActive ? "smarthealth-patient-sidebar-link-active" : ""
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="smarthealth-patient-sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`smarthealth-patient-sidebar ${
          isOpen ? "smarthealth-patient-sidebar-open" : ""
        }`}
      >
        {/* Header */}
        <div className="smarthealth-patient-sidebar-header">
          <div className="smarthealth-patient-sidebar-brand">
            <div className="smarthealth-patient-sidebar-logo">
              <span>+</span>
            </div>

            <div className="smarthealth-patient-sidebar-brand-text">
              <strong>SmartHealthcare</strong>
              <span>PATIENT PORTAL</span>
            </div>
          </div>

          <button
            type="button"
            className="smarthealth-patient-sidebar-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        {/* Patient Information */}
        <div className="smarthealth-patient-sidebar-user">
          <div className="smarthealth-patient-sidebar-avatar">
            {getInitials(user?.fullName)}
          </div>

          <div className="smarthealth-patient-sidebar-user-info">
            <strong>{user?.fullName || "Patient"}</strong>
            <span>Patient Account</span>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="smarthealth-patient-sidebar-navigation"
          aria-label="Patient navigation"
        >
          {/* Main */}
          <div className="smarthealth-patient-sidebar-section">
            <span className="smarthealth-patient-sidebar-section-title">
              MAIN
            </span>

            <NavLink
              to="/patient/dashboard"
              end
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">⌂</span>
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* AI Assistant */}
          <div className="smarthealth-patient-sidebar-section">
            <span className="smarthealth-patient-sidebar-section-title">
              AI ASSISTANT
            </span>

            <NavLink
              to="/patient/ai-assistant"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">✧</span>
              <span>AI Healthcare Assistant</span>
            </NavLink>
          </div>

          {/* Appointments */}
          <div className="smarthealth-patient-sidebar-section">
            <span className="smarthealth-patient-sidebar-section-title">
              APPOINTMENTS
            </span>

            <NavLink
              to="/patient/doctors"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">⚕</span>
              <span>Find Doctors</span>
            </NavLink>

            <NavLink
              to="/patient/book-appointment"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">＋</span>
              <span>Book Appointment</span>
            </NavLink>

            <NavLink
              to="/patient/appointments"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">▦</span>
              <span>My Appointments</span>
            </NavLink>
          </div>

          {/* Medical Information */}
          <div className="smarthealth-patient-sidebar-section">
            <span className="smarthealth-patient-sidebar-section-title">
              MY HEALTH
            </span>

            <NavLink
              to="/patient/medical-records"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">▤</span>
              <span>Medical Records</span>
            </NavLink>

            <NavLink
              to="/patient/prescriptions"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">✚</span>
              <span>Prescriptions</span>
            </NavLink>

            <NavLink
              to="/patient/lab-reports"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">▧</span>
              <span>Lab Reports</span>
            </NavLink>
          </div>

          {/* Account */}
          <div className="smarthealth-patient-sidebar-section">
            <span className="smarthealth-patient-sidebar-section-title">
              ACCOUNT
            </span>

            <NavLink
              to="/patient/profile"
              className={getLinkClass}
              onClick={onClose}
            >
              <span className="smarthealth-patient-sidebar-icon">◉</span>
              <span>My Profile</span>
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        <div className="smarthealth-patient-sidebar-footer">
          <span className="smarthealth-patient-sidebar-status-dot" />
          <span>Your health, our priority</span>
        </div>
      </aside>
    </>
  );
};

export default PatientSidebar;
