import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../../context/AuthContext";
import appointmentService from "../../services/appointmentService";

import "../../styles/pages/doctor/DoctorDashboard.css";

const DoctorDashboard = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await appointmentService.getDoctorAppointments();

      setAppointments(data || []);
    } catch (error) {
      console.error("Failed to load doctor appointments:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load your appointments.";

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  const getTodayString = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    if (typeof dateValue === "string" && dateValue.length >= 10) {
      return dateValue.substring(0, 10);
    }

    return "";
  };

  const formatDate = (dateValue) => {
    const normalized = normalizeDate(dateValue);

    if (!normalized) {
      return "—";
    }

    const parts = normalized.split("-");

    if (parts.length !== 3) {
      return "—";
    }

    const date = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
    );

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "—";
    }

    const timeString = String(timeValue);

    const parts = timeString.split(":");

    if (parts.length < 2) {
      return timeString;
    }

    const hours = Number(parts[0]);

    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timeString;
    }

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =========================================================
     APPOINTMENT GROUPS
  ========================================================= */

  const todayString = getTodayString();

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          normalizeDate(appointment.appointmentDate) === todayString,
      )
      .sort((first, second) =>
        String(first.appointmentTime || "").localeCompare(
          String(second.appointmentTime || ""),
        ),
      );
  }, [appointments, todayString]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const appointmentDate = normalizeDate(appointment.appointmentDate);

        return (
          appointmentDate > todayString &&
          !["Cancelled", "Completed", "NoShow"].includes(appointment.status)
        );
      })
      .sort((first, second) => {
        const firstDate = normalizeDate(first.appointmentDate);

        const secondDate = normalizeDate(second.appointmentDate);

        if (firstDate !== secondDate) {
          return firstDate.localeCompare(secondDate);
        }

        return String(first.appointmentTime || "").localeCompare(
          String(second.appointmentTime || ""),
        );
      });
  }, [appointments, todayString]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status?.toLowerCase() === "completed",
  ).length;

  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status?.toLowerCase() === "scheduled",
  ).length;

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status?.toLowerCase() === "cancelled",
  ).length;

  const noShowAppointments = appointments.filter(
    (appointment) => appointment.status?.toLowerCase() === "noshow",
  ).length;

  const getInitials = (name) => {
    if (!name) {
      return "DR";
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "smarthealth-doctor-dashboard-status smarthealth-doctor-dashboard-status-scheduled";

      case "completed":
        return "smarthealth-doctor-dashboard-status smarthealth-doctor-dashboard-status-completed";

      case "cancelled":
        return "smarthealth-doctor-dashboard-status smarthealth-doctor-dashboard-status-cancelled";

      case "noshow":
        return "smarthealth-doctor-dashboard-status smarthealth-doctor-dashboard-status-noshow";

      default:
        return "smarthealth-doctor-dashboard-status";
    }
  };

  const getTodayAppointmentStatusText = (appointment) => {
    if (appointment.status?.toLowerCase() === "scheduled") {
      return "Scheduled";
    }

    return appointment.status || "Unknown";
  };

  const doctorName = user?.fullName || "Doctor";

  return (
    <div className="smarthealth-doctor-dashboard">
      {/* =====================================================
          WELCOME HEADER
      ====================================================== */}

      <section className="smarthealth-doctor-dashboard-welcome">
        <div className="smarthealth-doctor-dashboard-welcome-content">
          <span className="smarthealth-doctor-dashboard-eyebrow">
            Doctor Portal
          </span>

          <h1>Welcome back, {doctorName}</h1>

          <p>
            Here is an overview of your appointments and today's clinical
            activity.
          </p>
        </div>

        <div className="smarthealth-doctor-dashboard-profile">
          <div className="smarthealth-doctor-dashboard-avatar">
            {getInitials(doctorName)}
          </div>

          <div className="smarthealth-doctor-dashboard-profile-info">
            <strong>{doctorName}</strong>

            <span>{user?.role || "Doctor"}</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="smarthealth-doctor-dashboard-statistics">
        <div className="smarthealth-doctor-dashboard-stat-card">
          <div className="smarthealth-doctor-dashboard-stat-icon smarthealth-doctor-dashboard-stat-icon-total">
            A
          </div>

          <div className="smarthealth-doctor-dashboard-stat-content">
            <span>Total Appointments</span>

            <strong>{appointments.length}</strong>
          </div>
        </div>

        <div className="smarthealth-doctor-dashboard-stat-card">
          <div className="smarthealth-doctor-dashboard-stat-icon smarthealth-doctor-dashboard-stat-icon-today">
            T
          </div>

          <div className="smarthealth-doctor-dashboard-stat-content">
            <span>Today's Appointments</span>

            <strong>{todayAppointments.length}</strong>
          </div>
        </div>

        <div className="smarthealth-doctor-dashboard-stat-card">
          <div className="smarthealth-doctor-dashboard-stat-icon smarthealth-doctor-dashboard-stat-icon-upcoming">
            U
          </div>

          <div className="smarthealth-doctor-dashboard-stat-content">
            <span>Upcoming</span>

            <strong>{upcomingAppointments.length}</strong>
          </div>
        </div>

        <div className="smarthealth-doctor-dashboard-stat-card">
          <div className="smarthealth-doctor-dashboard-stat-icon smarthealth-doctor-dashboard-stat-icon-completed">
            ✓
          </div>

          <div className="smarthealth-doctor-dashboard-stat-content">
            <span>Completed</span>

            <strong>{completedAppointments}</strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATUS OVERVIEW
      ====================================================== */}

      {!loading && appointments.length > 0 && (
        <section className="smarthealth-doctor-dashboard-status-overview">
          <div className="smarthealth-doctor-dashboard-status-overview-heading">
            <div>
              <h2>Appointment Overview</h2>

              <p>Current status distribution across your appointments.</p>
            </div>

            <button
              type="button"
              className="smarthealth-doctor-dashboard-refresh-button"
              onClick={() => loadAppointments(true)}
              disabled={refreshing}
            >
              <span
                className={
                  refreshing
                    ? "smarthealth-doctor-dashboard-refresh-icon smarthealth-doctor-dashboard-refresh-spinning"
                    : "smarthealth-doctor-dashboard-refresh-icon"
                }
              >
                ↻
              </span>
              Refresh
            </button>
          </div>

          <div className="smarthealth-doctor-dashboard-status-items">
            <div className="smarthealth-doctor-dashboard-status-item">
              <span className="smarthealth-doctor-dashboard-status-marker smarthealth-doctor-dashboard-status-marker-scheduled"></span>

              <div>
                <strong>{scheduledAppointments}</strong>

                <span>Scheduled</span>
              </div>
            </div>

            <div className="smarthealth-doctor-dashboard-status-item">
              <span className="smarthealth-doctor-dashboard-status-marker smarthealth-doctor-dashboard-status-marker-completed"></span>

              <div>
                <strong>{completedAppointments}</strong>

                <span>Completed</span>
              </div>
            </div>

            <div className="smarthealth-doctor-dashboard-status-item">
              <span className="smarthealth-doctor-dashboard-status-marker smarthealth-doctor-dashboard-status-marker-cancelled"></span>

              <div>
                <strong>{cancelledAppointments}</strong>

                <span>Cancelled</span>
              </div>
            </div>

            <div className="smarthealth-doctor-dashboard-status-item">
              <span className="smarthealth-doctor-dashboard-status-marker smarthealth-doctor-dashboard-status-marker-noshow"></span>

              <div>
                <strong>{noShowAppointments}</strong>

                <span>No Show</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="smarthealth-doctor-dashboard-content">
        {/* ===================================================
            TODAY
        ==================================================== */}

        <div className="smarthealth-doctor-dashboard-panel">
          <div className="smarthealth-doctor-dashboard-panel-header">
            <div>
              <span className="smarthealth-doctor-dashboard-panel-eyebrow">
                Today
              </span>

              <h2>Today's Appointments</h2>

              <p>
                {todayAppointments.length} appointment
                {todayAppointments.length === 1 ? "" : "s"} scheduled for today.
              </p>
            </div>

            <div className="smarthealth-doctor-dashboard-panel-count">
              {todayAppointments.length}
            </div>
          </div>

          {loading ? (
            <div className="smarthealth-doctor-dashboard-loading">
              <div className="smarthealth-doctor-dashboard-spinner"></div>

              <p>Loading appointments...</p>
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="smarthealth-doctor-dashboard-empty">
              <div className="smarthealth-doctor-dashboard-empty-icon">✓</div>

              <h3>No appointments today</h3>

              <p>You currently have no appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="smarthealth-doctor-dashboard-appointment-list">
              {todayAppointments.map((appointment) => (
                <div
                  className="smarthealth-doctor-dashboard-appointment-item"
                  key={appointment.appointmentId}
                >
                  <div className="smarthealth-doctor-dashboard-appointment-time">
                    <strong>{formatTime(appointment.appointmentTime)}</strong>

                    <span>Today</span>
                  </div>

                  <div className="smarthealth-doctor-dashboard-appointment-divider"></div>

                  <div className="smarthealth-doctor-dashboard-patient">
                    <div className="smarthealth-doctor-dashboard-patient-avatar">
                      {getInitials(appointment.patientName)}
                    </div>

                    <div className="smarthealth-doctor-dashboard-patient-info">
                      <strong>{appointment.patientName}</strong>

                      <span>
                        {appointment.symptoms || "No symptoms provided"}
                      </span>
                    </div>
                  </div>

                  <span className={getStatusClass(appointment.status)}>
                    {getTodayAppointmentStatusText(appointment)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================
            UPCOMING
        ==================================================== */}

        <div className="smarthealth-doctor-dashboard-panel">
          <div className="smarthealth-doctor-dashboard-panel-header">
            <div>
              <span className="smarthealth-doctor-dashboard-panel-eyebrow">
                Next
              </span>

              <h2>Upcoming Appointments</h2>

              <p>Your next scheduled patient visits.</p>
            </div>

            <div className="smarthealth-doctor-dashboard-panel-count">
              {upcomingAppointments.length}
            </div>
          </div>

          {loading ? (
            <div className="smarthealth-doctor-dashboard-loading">
              <div className="smarthealth-doctor-dashboard-spinner"></div>

              <p>Loading appointments...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="smarthealth-doctor-dashboard-empty">
              <div className="smarthealth-doctor-dashboard-empty-icon">✓</div>

              <h3>No upcoming appointments</h3>

              <p>There are no future scheduled appointments at the moment.</p>
            </div>
          ) : (
            <div className="smarthealth-doctor-dashboard-appointment-list">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
                <div
                  className="smarthealth-doctor-dashboard-appointment-item"
                  key={appointment.appointmentId}
                >
                  <div className="smarthealth-doctor-dashboard-appointment-date">
                    <strong>{formatDate(appointment.appointmentDate)}</strong>

                    <span>{formatTime(appointment.appointmentTime)}</span>
                  </div>

                  <div className="smarthealth-doctor-dashboard-appointment-divider"></div>

                  <div className="smarthealth-doctor-dashboard-patient">
                    <div className="smarthealth-doctor-dashboard-patient-avatar">
                      {getInitials(appointment.patientName)}
                    </div>

                    <div className="smarthealth-doctor-dashboard-patient-info">
                      <strong>{appointment.patientName}</strong>

                      <span>
                        {appointment.symptoms || "No symptoms provided"}
                      </span>
                    </div>
                  </div>

                  <span className={getStatusClass(appointment.status)}>
                    {appointment.status || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DoctorDashboard;
