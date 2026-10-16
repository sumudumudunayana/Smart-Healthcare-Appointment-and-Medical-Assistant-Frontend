import { NavLink } from "react-router-dom";

const ReceptionistSidebar = ({ onNavigate }) => {
  return (
    <div className="smarthealth-sidebar-menu">
      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MAIN</span>

        <NavLink
          to="/receptionist/dashboard"
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
          PATIENTS & APPOINTMENTS
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">PATIENTS</span>

        <NavLink
          to="/receptionist/patients/add"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">+</span>
          <span className="smarthealth-sidebar-link-text">Add Patient</span>
        </NavLink>

        <NavLink
          to="/receptionist/patients"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">♙</span>
          <span className="smarthealth-sidebar-link-text">Manage Patients</span>
        </NavLink>

        {/* Create Appointment */}

        <NavLink
          to="/receptionist/appointments/create"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">＋</span>
          <span className="smarthealth-sidebar-link-text">
            Create Appointment
          </span>
        </NavLink>

        {/* Manage Appointments */}

        <NavLink
          to="/receptionist/appointments"
          end
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

        {/* Doctor Availability */}

        <NavLink
          to="/receptionist/availability"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">◷</span>
          <span className="smarthealth-sidebar-link-text">
            Doctor Availability
          </span>
        </NavLink>
      </div>

      {/* =====================================================
          BILLING
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">BILLING</span>

        <NavLink
          to="/receptionist/billing"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">▤</span>
          <span className="smarthealth-sidebar-link-text">Billing</span>
        </NavLink>

        <NavLink
          to="/receptionist/payments"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">$</span>
          <span className="smarthealth-sidebar-link-text">Payments</span>
        </NavLink>

        <NavLink
          to="/receptionist/insurance"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">◈</span>
          <span className="smarthealth-sidebar-link-text">Insurance</span>
        </NavLink>
      </div>

      {/* =====================================================
          COMMUNICATION
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">
          COMMUNICATION
        </span>

        <NavLink
          to="/receptionist/notifications"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">🔔</span>
          <span className="smarthealth-sidebar-link-text">Notifications</span>
        </NavLink>
      </div>

      {/* =====================================================
          AI AGENT HELP
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">
          AI AGENT HELP
        </span>

        <NavLink
          to="/receptionist/ai-billing"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">✦</span>
          <span className="smarthealth-sidebar-link-text">
            AI Billing Assistant
          </span>
        </NavLink>
      </div>
    </div>
  );
};

export default ReceptionistSidebar;