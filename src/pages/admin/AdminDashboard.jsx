import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "../../styles/pages/admin/AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [
        usersResponse,
        doctorsResponse,
        departmentsResponse,
        specializationsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get("/Users"),
        api.get("/Doctors"),
        api.get("/Departments"),
        api.get("/Specializations"),
        api.get("/Appointments/admin"),
      ]);

      setUsers(usersResponse.data || []);
      setDoctors(doctorsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setSpecializations(specializationsResponse.data || []);
      setAppointments(appointmentsResponse.data || []);
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load dashboard data.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const statistics = useMemo(() => {
    const today = new Date();

    const todayAppointments = appointments.filter((appointment) => {
      if (!appointment.appointmentDate) {
        return false;
      }

      const appointmentDate = new Date(
        `${appointment.appointmentDate}T00:00:00`
      );

      return (
        appointmentDate.getFullYear() === today.getFullYear() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getDate() === today.getDate()
      );
    });

    return {
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalDepartments: departments.length,
      totalSpecializations: specializations.length,
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,

      scheduled: appointments.filter(
        (appointment) =>
          appointment.status?.toLowerCase() === "scheduled"
      ).length,

      completed: appointments.filter(
        (appointment) =>
          appointment.status?.toLowerCase() === "completed"
      ).length,

      cancelled: appointments.filter(
        (appointment) =>
          appointment.status?.toLowerCase() === "cancelled"
      ).length,

      noShow: appointments.filter(
        (appointment) =>
          appointment.status?.toLowerCase() === "noshow"
      ).length,

      activeDoctors: doctors.filter(
        (doctor) =>
          doctor.status?.toLowerCase() === "active"
      ).length,

      inactiveDoctors: doctors.filter(
        (doctor) =>
          doctor.status?.toLowerCase() !== "active"
      ).length,
    };
  }, [users, doctors, departments, specializations, appointments]);

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const dateA = new Date(
          `${a.appointmentDate}T${a.appointmentTime || "00:00:00"}`
        );

        const dateB = new Date(
          `${b.appointmentDate}T${b.appointmentTime || "00:00:00"}`
        );

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [appointments]);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "smarthealth-admin-status scheduled";

      case "completed":
        return "smarthealth-admin-status completed";

      case "cancelled":
        return "smarthealth-admin-status cancelled";

      case "noshow":
        return "smarthealth-admin-status noshow";

      default:
        return "smarthealth-admin-status";
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] = time.split(":");

    if (hours === undefined || minutes === undefined) {
      return time;
    }

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="smarthealth-admin-dashboard">
        <div className="smarthealth-admin-dashboard-loading">
          <div className="smarthealth-admin-loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smarthealth-admin-dashboard">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="smarthealth-admin-dashboard-header">
        <div>
          <p className="smarthealth-admin-dashboard-eyebrow">
            Administrator Dashboard
          </p>

          <h1>
            Welcome back, {user?.fullName || "Administrator"}
          </h1>

          <p>
            Here's an overview of your healthcare management system.
          </p>
        </div>

        <div className="smarthealth-admin-dashboard-date">
          <span>Today</span>

          <strong>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="smarthealth-admin-statistics-grid">

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon users-icon">
            👥
          </div>

          <div>
            <span>Total Users</span>
            <strong>{statistics.totalUsers}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon doctors-icon">
            🩺
          </div>

          <div>
            <span>Total Doctors</span>
            <strong>{statistics.totalDoctors}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon departments-icon">
            🏥
          </div>

          <div>
            <span>Departments</span>
            <strong>{statistics.totalDepartments}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon specializations-icon">
            🎓
          </div>

          <div>
            <span>Specializations</span>
            <strong>{statistics.totalSpecializations}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon appointments-icon">
            📅
          </div>

          <div>
            <span>Total Appointments</span>
            <strong>{statistics.totalAppointments}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-stat-card">
          <div className="smarthealth-admin-stat-icon today-icon">
            📌
          </div>

          <div>
            <span>Today's Appointments</span>
            <strong>{statistics.todayAppointments}</strong>
          </div>
        </div>

      </section>

      {/* =====================================================
          MAIN DASHBOARD GRID
      ====================================================== */}

      <section className="smarthealth-admin-dashboard-grid">

        {/* Appointment Overview */}

        <div className="smarthealth-admin-panel">
          <div className="smarthealth-admin-panel-header">
            <div>
              <h2>Appointment Overview</h2>
              <p>Current appointment status distribution</p>
            </div>
          </div>

          <div className="smarthealth-admin-appointment-overview">

            <div className="smarthealth-admin-overview-item">
              <div className="overview-number scheduled-number">
                {statistics.scheduled}
              </div>

              <span>Scheduled</span>
            </div>

            <div className="smarthealth-admin-overview-item">
              <div className="overview-number completed-number">
                {statistics.completed}
              </div>

              <span>Completed</span>
            </div>

            <div className="smarthealth-admin-overview-item">
              <div className="overview-number cancelled-number">
                {statistics.cancelled}
              </div>

              <span>Cancelled</span>
            </div>

            <div className="smarthealth-admin-overview-item">
              <div className="overview-number noshow-number">
                {statistics.noShow}
              </div>

              <span>No Show</span>
            </div>

          </div>
        </div>

        {/* Doctor Overview */}

        <div className="smarthealth-admin-panel">
          <div className="smarthealth-admin-panel-header">
            <div>
              <h2>Doctor Overview</h2>
              <p>Current doctor account status</p>
            </div>
          </div>

          <div className="smarthealth-admin-doctor-overview">

            <div className="smarthealth-admin-doctor-total">
              <strong>{statistics.totalDoctors}</strong>
              <span>Total Doctors</span>
            </div>

            <div className="smarthealth-admin-doctor-status-row">
              <div>
                <span className="smarthealth-admin-status-dot active"></span>
                Active Doctors
              </div>

              <strong>
                {statistics.activeDoctors}
              </strong>
            </div>

            <div className="smarthealth-admin-doctor-status-row">
              <div>
                <span className="smarthealth-admin-status-dot inactive"></span>
                Inactive Doctors
              </div>

              <strong>
                {statistics.inactiveDoctors}
              </strong>
            </div>

          </div>
        </div>

      </section>

      {/* =====================================================
          RECENT APPOINTMENTS
      ====================================================== */}

      <section className="smarthealth-admin-panel smarthealth-admin-recent-panel">

        <div className="smarthealth-admin-panel-header">
          <div>
            <h2>Recent Appointments</h2>
            <p>Latest appointments recorded in the system</p>
          </div>

          <span className="smarthealth-admin-record-count">
            {recentAppointments.length} records
          </span>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="smarthealth-admin-empty">
            <div>📅</div>
            <h3>No appointments found</h3>
            <p>
              There are currently no appointments in the system.
            </p>
          </div>
        ) : (
          <div className="smarthealth-admin-table-wrapper">
            <table className="smarthealth-admin-appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.appointmentId}>

                    <td>
                      <div className="smarthealth-admin-person">
                        <div className="smarthealth-admin-person-avatar">
                          {appointment.patientName
                            ?.charAt(0)
                            ?.toUpperCase() || "P"}
                        </div>

                        <span>
                          {appointment.patientName || "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {appointment.doctorName || "-"}
                    </td>

                    <td>
                      {formatDate(
                        appointment.appointmentDate
                      )}
                    </td>

                    <td>
                      {formatTime(
                        appointment.appointmentTime
                      )}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          appointment.status
                        )}
                      >
                        {appointment.status || "Unknown"}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>

    </div>
  );
};

export default AdminDashboard;