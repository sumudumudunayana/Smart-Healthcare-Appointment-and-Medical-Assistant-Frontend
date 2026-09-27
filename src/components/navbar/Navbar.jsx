import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/navbar/Navbar.css";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "Administrator":
        return "Administrator";

      case "Doctor":
        return "Doctor";

      case "Receptionist":
        return "Receptionist";

      default:
        return role || "User";
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) {
      return "U";
    }

    const nameParts = fullName.trim().split(/\s+/);

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <header className="smarthealth-navbar">

      {/* =====================================================
          LEFT SECTION
      ====================================================== */}

      <div className="smarthealth-navbar-left">

        {/* Mobile Menu Button */}

        <button
          type="button"
          className="smarthealth-navbar-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>


        {/* Page Branding */}

        <div className="smarthealth-navbar-brand">

          <div className="smarthealth-navbar-logo">
            <span>+</span>
          </div>

          <div className="smarthealth-navbar-brand-text">
            <h1>SmartHealthcare</h1>
            <span>Healthcare Management System</span>
          </div>

        </div>

      </div>


      {/* =====================================================
          RIGHT SECTION
      ====================================================== */}

      <div className="smarthealth-navbar-right">


        {/* ===================================================
            NOTIFICATION BUTTON
        ==================================================== */}

        <button
          type="button"
          className="smarthealth-navbar-notification"
          aria-label="Notifications"
        >

          <span className="smarthealth-navbar-notification-icon">
            🔔
          </span>

          <span className="smarthealth-navbar-notification-dot"></span>

        </button>


        {/* ===================================================
            PROFILE
        ==================================================== */}

        <div className="smarthealth-navbar-profile">

          <button
            type="button"
            className="smarthealth-navbar-profile-button"
            onClick={() =>
              setShowProfileMenu((previous) => !previous)
            }
            aria-expanded={showProfileMenu}
          >

            <div className="smarthealth-navbar-avatar">
              {getInitials(user?.fullName)}
            </div>

            <div className="smarthealth-navbar-user-info">

              <strong>
                {user?.fullName || "User"}
              </strong>

              <span>
                {getRoleLabel(user?.role)}
              </span>

            </div>

            <span
              className={`smarthealth-navbar-profile-arrow ${
                showProfileMenu
                  ? "smarthealth-navbar-profile-arrow-open"
                  : ""
              }`}
            >
              ▼
            </span>

          </button>


          {/* =================================================
              PROFILE DROPDOWN
          ================================================== */}

          {showProfileMenu && (
            <div className="smarthealth-navbar-profile-menu">

              <div className="smarthealth-navbar-profile-menu-header">

                <div className="smarthealth-navbar-profile-menu-avatar">
                  {getInitials(user?.fullName)}
                </div>

                <div>

                  <strong>
                    {user?.fullName || "User"}
                  </strong>

                  <span>
                    {user?.email || ""}
                  </span>

                </div>

              </div>


              <div className="smarthealth-navbar-profile-menu-divider"></div>


              {/* Profile */}

              <button
                type="button"
                className="smarthealth-navbar-profile-menu-item"
              >
                <span className="smarthealth-navbar-profile-menu-icon">
                  👤
                </span>

                <span>
                  My Profile
                </span>
              </button>


              {/* Logout */}

              <button
                type="button"
                className="smarthealth-navbar-profile-menu-item smarthealth-navbar-profile-menu-logout"
                onClick={handleLogout}
              >
                <span className="smarthealth-navbar-profile-menu-icon">
                  ↪
                </span>

                <span>
                  Logout
                </span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
};

export default Navbar;