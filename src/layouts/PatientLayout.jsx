import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import PatientSidebar from "../components/sidebar/PatientSidebar";
import "../styles/layouts/PatientLayout.css";

const PatientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="smarthealth-patient-layout">
      {/* Patient Sidebar */}
      <PatientSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Area */}
      <div className="smarthealth-patient-layout-main">
        {/* Shared Navbar */}
        <Navbar onMenuClick={handleMenuClick} />

        {/* Page Content */}
        <main className="smarthealth-patient-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;
