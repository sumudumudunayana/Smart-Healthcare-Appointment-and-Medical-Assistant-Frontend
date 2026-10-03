import { NavLink } from "react-router-dom";

const DoctorSidebar = ({ onNavigate }) => {
  return (
    <div className="smarthealth-sidebar-menu">
      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MAIN</span>

        <NavLink
          to="/doctor/dashboard"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">⌂</span>

          <span className="smarthealth-sidebar-link-text">Dashboard</span>
        </NavLink>
      </div>

      {/* =====================================================
          MY WORK
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MY WORK</span>

        {/* My Profile */}

        <NavLink
          to="/doctor/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">◉</span>

          <span className="smarthealth-sidebar-link-text">My Profile</span>
        </NavLink>

        {/* My Schedule */}

        <NavLink
          to="/doctor/schedule"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">◷</span>

          <span className="smarthealth-sidebar-link-text">My Schedule</span>
        </NavLink>

        {/* Appointments */}

        <NavLink
          to="/doctor/appointments"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">▣</span>

          <span className="smarthealth-sidebar-link-text">Appointments</span>
        </NavLink>
      </div>

      {/* =====================================================
          MEDICAL
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MEDICAL</span>

        {/* Medical Records */}

        <NavLink
          to="/doctor/medical-records"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">▤</span>

          <span className="smarthealth-sidebar-link-text">Medical Records</span>
        </NavLink>

        {/* Prescriptions */}

        <NavLink
          to="/doctor/prescriptions"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">✚</span>

          <span className="smarthealth-sidebar-link-text">Prescriptions</span>
        </NavLink>

        {/* Lab Reports */}

        <NavLink
          to="/doctor/lab-reports"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">⚗</span>

          <span className="smarthealth-sidebar-link-text">Lab Reports</span>
        </NavLink>
      </div>

      {/* =====================================================
          INTELLIGENCE
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">INTELLIGENCE</span>

        <NavLink
          to="/doctor/ai"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">✨</span>

          <span className="smarthealth-sidebar-link-text">AI Assistant</span>
        </NavLink>
      </div>
    </div>
  );
};

export default DoctorSidebar;
