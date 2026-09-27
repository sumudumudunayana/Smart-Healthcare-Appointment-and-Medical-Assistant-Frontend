import { NavLink } from "react-router-dom";

const AdminSidebar = ({ onNavigate }) => {
  return (
    <div className="smarthealth-sidebar-menu">
      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MAIN</span>

        <NavLink
          to="/admin/dashboard"
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
          MANAGEMENT
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">MANAGEMENT</span>

        {/* Specializations */}

        <NavLink
          to="/admin/specializations"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">✦</span>

          <span className="smarthealth-sidebar-link-text">Specializations</span>
        </NavLink>

        {/* Departments */}

        <NavLink
          to="/admin/departments"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">▦</span>

          <span className="smarthealth-sidebar-link-text">Departments</span>
        </NavLink>

        {/* Doctors */}

        <NavLink
          to="/admin/doctors"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">⚕</span>

          <span className="smarthealth-sidebar-link-text">Doctors</span>
        </NavLink>

        {/* Receptionists */}

        <NavLink
          to="/admin/receptionists"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">♟</span>

          <span className="smarthealth-sidebar-link-text">Receptionists</span>
        </NavLink>

        {/* Users */}

        <NavLink
          to="/admin/users"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">◉</span>

          <span className="smarthealth-sidebar-link-text">Users</span>
        </NavLink>
      </div>

      {/* =====================================================
          AI
      ====================================================== */}

      <div className="smarthealth-sidebar-section">
        <span className="smarthealth-sidebar-section-title">INTELLIGENCE</span>

        <NavLink
          to="/admin/ai"
          onClick={onNavigate}
          className={({ isActive }) =>
            `smarthealth-sidebar-link ${
              isActive ? "smarthealth-sidebar-link-active" : ""
            }`
          }
        >
          <span className="smarthealth-sidebar-link-icon">✨</span>

          <span className="smarthealth-sidebar-link-text">AI Dashboard</span>
        </NavLink>
      </div>
    </div>
  );
};

export default AdminSidebar;
