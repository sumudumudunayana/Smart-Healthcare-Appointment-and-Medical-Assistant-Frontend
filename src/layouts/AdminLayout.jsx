import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";
import "../styles/layouts/AdminLayout.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="smarthealth-admin-layout">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />


      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="smarthealth-admin-layout-main">

        {/* Navbar */}

        <Navbar
          onMenuClick={handleMenuClick}
        />


        {/* Page Content */}

        <main className="smarthealth-admin-layout-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;