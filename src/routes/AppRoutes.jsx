import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminLayout from "../layouts/AdminLayout";
import DoctorLayout from "../layouts/DoctorLayout";
import ReceptionistLayout from "../layouts/ReceptionistLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Specializations from "../pages/admin/Specializations";
import Departments from "../pages/admin/Departments";
import Doctors from "../pages/admin/Doctors";
import Users from "../pages/admin/Users";
import Receptionists from "../pages/admin/Receptionists";

import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorSchedule from "../pages/doctor/DoctorSchedule";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorMedicalRecords from "../pages/doctor/DoctorMedicalRecords";
import DoctorPrescriptions from "../pages/doctor/DoctorPrescriptions";
import DoctorLabReports from "../pages/doctor/DoctorLabReports";

import ReceptionistAppointments from "../pages/receptionist/ReceptionistAppointments";
import ReceptionistAvailability from "../pages/receptionist/ReceptionistAvailability";
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import ReceptionistBilling from "../pages/receptionist/ReceptionistBilling";
import ReceptionistPayments from "../pages/receptionist/ReceptionistPayments";
import ReceptionistInsurance from "../pages/receptionist/ReceptionistInsurance";
import ReceptionistNotifications from "../pages/receptionist/ReceptionistNotifications";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* =========================================================
   ROLE ROUTE
========================================================= */

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/* =========================================================
   TEMPORARY RECEPTIONIST DASHBOARD
========================================================= */

const ReceptionistLayoutTest = () => {
  return (
    <div>
      <h1>Receptionist Area</h1>
      <p>Receptionist layout is working correctly.</p>
    </div>
  );
};

/* =========================================================
   APP ROUTES
========================================================= */

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===================================================
          PUBLIC ROUTES
      ==================================================== */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ===================================================
          UNAUTHORIZED
      ==================================================== */}

      <Route
        path="/unauthorized"
        element={
          <div>
            <h1>403</h1>
            <p>You are not authorized to access this page.</p>
          </div>
        }
      />

      {/* ===================================================
          ADMIN ROUTES
      ==================================================== */}

      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={["Administrator"]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="specializations" element={<Specializations />} />

        <Route path="departments" element={<Departments />} />

        <Route path="doctors" element={<Doctors />} />

        <Route path="users" element={<Users />} />

        <Route path="receptionists" element={<Receptionists />} />
      </Route>

      {/* ===================================================
          DOCTOR ROUTES
      ==================================================== */}

      <Route
        path="/doctor"
        element={
          <RoleRoute allowedRoles={["Doctor"]}>
            <DoctorLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />

        <Route path="dashboard" element={<DoctorDashboard />} />

        <Route path="profile" element={<DoctorProfile />} />

        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route
          path="/doctor/medical-records"
          element={<DoctorMedicalRecords />}
        />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="lab-reports" element={<DoctorLabReports />} />
      </Route>

      {/* ===================================================
          RECEPTIONIST ROUTES
      ==================================================== */}

      <Route
        path="/receptionist"
        element={
          <RoleRoute allowedRoles={["Receptionist"]}>
            <ReceptionistLayout />
          </RoleRoute>
        }
      >
        <Route path="dashboard" element={<ReceptionistDashboard />} />

        <Route path="dashboard" element={<ReceptionistLayoutTest />} />
        <Route path="appointments" element={<ReceptionistAppointments />} />
        <Route path="availability" element={<ReceptionistAvailability />} />
        <Route path="billing" element={<ReceptionistBilling />} />
        <Route path="payments" element={<ReceptionistPayments />} />
        <Route path="insurance" element={<ReceptionistInsurance />} />
        <Route path="notifications" element={<ReceptionistNotifications />} />
      </Route>

      {/* ===================================================
          FALLBACK
      ==================================================== */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
