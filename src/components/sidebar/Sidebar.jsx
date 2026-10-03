import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import DoctorSidebar from "./DoctorSidebar";
import ReceptionistSidebar from "./ReceptionistSidebar";
import "../../styles/components/sidebar/Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const renderSidebarContent = () => {
    switch (user?.role) {
      case "Administrator":
        return <AdminSidebar onNavigate={onClose} />;

      case "Doctor":
        return <DoctorSidebar onNavigate={onClose} />;

      case "Receptionist":
        return <ReceptionistSidebar onNavigate={onClose} />;

      default:
        return null;
    }
  };

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isOpen && (
        <div
          className="smarthealth-sidebar-overlay"
          onClick={onClose}
        ></div>
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`smarthealth-sidebar ${
          isOpen ? "smarthealth-sidebar-open" : ""
        }`}
      >

        {/* ===================================================
            SIDEBAR HEADER
        ==================================================== */}

        <div className="smarthealth-sidebar-header">

          <div className="smarthealth-sidebar-brand">

            <div className="smarthealth-sidebar-logo">
              <span>+</span>
            </div>

            <div className="smarthealth-sidebar-brand-text">
              <strong>SmartHealthcare</strong>
              <span>Management System</span>
            </div>

          </div>


          {/* Mobile Close Button */}

          <button
            type="button"
            className="smarthealth-sidebar-close-button"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ×
          </button>

        </div>


        {/* ===================================================
            ROLE INFORMATION
        ==================================================== */}

        <div className="smarthealth-sidebar-user">

          <div className="smarthealth-sidebar-user-avatar">
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((name) => name.charAt(0))
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "U"}
          </div>

          <div className="smarthealth-sidebar-user-info">

            <strong>
              {user?.fullName || "User"}
            </strong>

            <span>
              {user?.role || "User"}
            </span>

          </div>

        </div>


        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <nav className="smarthealth-sidebar-navigation">

          {renderSidebarContent()}

        </nav>


        {/* ===================================================
            SIDEBAR FOOTER
        ==================================================== */}

        <div className="smarthealth-sidebar-footer">

          <div className="smarthealth-sidebar-footer-status">

            <span className="smarthealth-sidebar-status-dot"></span>

            <span>
              System Online
            </span>

          </div>

          <span className="smarthealth-sidebar-version">
            v1.0.0
          </span>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;