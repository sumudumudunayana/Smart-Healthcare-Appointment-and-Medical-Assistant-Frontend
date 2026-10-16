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
import AdminAI from "../pages/admin/AdminAI";

import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorSchedule from "../pages/doctor/DoctorSchedule";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorMedicalRecords from "../pages/doctor/DoctorMedicalRecords";
import DoctorPrescriptions from "../pages/doctor/DoctorPrescriptions";
import DoctorLabReports from "../pages/doctor/DoctorLabReports";
import DoctorAI from "../pages/doctor/DoctorAI";

import ReceptionistAppointments from "../pages/receptionist/ReceptionistAppointments";
import ReceptionistAvailability from "../pages/receptionist/ReceptionistAvailability";
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import ReceptionistBilling from "../pages/receptionist/ReceptionistBilling";
import ReceptionistPayments from "../pages/receptionist/ReceptionistPayments";
import ReceptionistInsurance from "../pages/receptionist/ReceptionistInsurance";
import ReceptionistNotifications from "../pages/receptionist/ReceptionistNotifications";
import ReceptionistAIBilling from "../pages/receptionist/ReceptionistAIBilling";
import ReceptionistAddPatient from "../pages/receptionist/ReceptionistAddPatient";
import ReceptionistPatients from "../pages/receptionist/ReceptionistPatients";
import ReceptionistCreateAppointment from "../pages/receptionist/ReceptionistCreateAppointment";

import PatientLayout from "../layouts/PatientLayout";
import PatientDashboard from "../pages/patient/PatientDashboard";
import FindDoctor from "../pages/patient/FindDoctor";
import BookAppointment from "../pages/patient/BookAppointment";
import MyAppointments from "../pages/patient/MyAppointments";
import MedicalRecords from "../pages/patient/MedicalRecords";
import Prescriptions from "../pages/patient/Prescriptions";
import LabReports from "../pages/patient/LabReports";
import PatientProfile from "../pages/patient/PatientProfile";
import AIAssistant from "../pages/patient/AIAssistant";

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

        <Route path="ai" element={<AdminAI />} />
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

        <Route path="medical-records" element={<DoctorMedicalRecords />} />

        <Route path="prescriptions" element={<DoctorPrescriptions />} />

        <Route path="lab-reports" element={<DoctorLabReports />} />

        <Route path="ai" element={<DoctorAI />} />
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

        <Route path="patients" element={<ReceptionistPatients />} />

        <Route path="patients/add" element={<ReceptionistAddPatient />} />

        <Route path="appointments" element={<ReceptionistAppointments />} />

        <Route path="availability" element={<ReceptionistAvailability />} />

        <Route path="billing" element={<ReceptionistBilling />} />

        <Route path="ai-billing" element={<ReceptionistAIBilling />} />

        <Route path="payments" element={<ReceptionistPayments />} />

        <Route path="insurance" element={<ReceptionistInsurance />} />

        <Route path="notifications" element={<ReceptionistNotifications />} />
        <Route
          path="/receptionist/appointments/create"
          element={<ReceptionistCreateAppointment />}
        />
      </Route>

      {/* ===================================================
    PATIENT ROUTES
==================================================== */}

      <Route
        path="/patient"
        element={
          <RoleRoute allowedRoles={["Patient"]}>
            <PatientLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/patient/dashboard" replace />} />

        <Route path="dashboard" element={<PatientDashboard />} />

        <Route path="doctors" element={<FindDoctor />} />

        <Route path="book-appointment" element={<BookAppointment />} />

        <Route path="appointments" element={<MyAppointments />} />

        <Route path="medical-records" element={<MedicalRecords />} />

        <Route path="prescriptions" element={<Prescriptions />} />

        <Route path="lab-reports" element={<LabReports />} />

        <Route path="profile" element={<PatientProfile />} />

        <Route path="ai-assistant" element={<AIAssistant />} />
      </Route>

      {/* ===================================================
          FALLBACK
      ==================================================== */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
