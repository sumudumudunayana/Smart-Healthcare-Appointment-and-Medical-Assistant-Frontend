import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../../context/AuthContext";
import appointmentService from "../../services/appointmentService";

import "../../styles/pages/receptionist/ReceptionistDashboard.css";

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data =
        await appointmentService.getReceptionistAppointments();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to load receptionist dashboard:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getTodayString = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getAppointmentDate = (appointment) => {
    return appointment?.appointmentDate || "";
  };

  const getAppointmentDateTime = (appointment) => {
    const date = appointment?.appointmentDate || "";
    const time = appointment?.appointmentTime || "00:00:00";

    return new Date(`${date}T${time}`);
  };

  // ============================================================
  // DASHBOARD STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    const today = getTodayString();

    const scheduled = appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() === "scheduled"
    );

    const completed = appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() === "completed"
    );

    const cancelled = appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() === "cancelled"
    );

    const todayAppointments = appointments.filter(
      (appointment) =>
        getAppointmentDate(appointment) === today
    );

    return {
      total: appointments.length,
      scheduled: scheduled.length,
      completed: completed.length,
      cancelled: cancelled.length,
      today: todayAppointments.length,
    };
  }, [appointments]);

  // ============================================================
  // TODAY'S APPOINTMENTS
  // ============================================================

  const todayAppointments = useMemo(() => {
    const today = getTodayString();

    return appointments
      .filter(
        (appointment) =>
          getAppointmentDate(appointment) === today
      )
      .sort(
        (first, second) =>
          getAppointmentDateTime(first) -
          getAppointmentDateTime(second)
      );
  }, [appointments]);

  // ============================================================
  // UPCOMING APPOINTMENTS
  // ============================================================

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        const status =
          appointment.status?.toLowerCase();

        return (
          status === "scheduled" &&
          getAppointmentDateTime(appointment) >= now
        );
      })
      .sort(
        (first, second) =>
          getAppointmentDateTime(first) -
          getAppointmentDateTime(second)
      )
      .slice(0, 5);
  }, [appointments]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const [hours, minutes] = timeValue.split(":");

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

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    const normalizedStatus =
      status?.toLowerCase();

    if (normalizedStatus === "completed") {
      return "smarthealth-receptionist-dashboard-status-completed";
    }

    if (normalizedStatus === "cancelled") {
      return "smarthealth-receptionist-dashboard-status-cancelled";
    }

    if (normalizedStatus === "noshow") {
      return "smarthealth-receptionist-dashboard-status-noshow";
    }

    return "smarthealth-receptionist-dashboard-status-scheduled";
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadDashboard();
    toast.success("Dashboard refreshed.");
  };

  return (
    <div className="smarthealth-receptionist-dashboard-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="smarthealth-receptionist-dashboard-header">

        <div>
          <p className="smarthealth-receptionist-dashboard-welcome-label">
            Welcome back
          </p>

          <h1 className="smarthealth-receptionist-dashboard-title">
            {user?.fullName || "Receptionist"}
          </h1>

          <p className="smarthealth-receptionist-dashboard-subtitle">
            Manage appointments and hospital operations
            from one place.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-dashboard-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <span className="smarthealth-receptionist-dashboard-refresh-icon">
            ↻
          </span>

          Refresh
        </button>
      </div>

      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <div className="smarthealth-receptionist-dashboard-stat-grid">

        <div className="smarthealth-receptionist-dashboard-stat-card">

          <div className="smarthealth-receptionist-dashboard-stat-icon smarthealth-receptionist-dashboard-stat-icon-total">
            📋
          </div>

          <div className="smarthealth-receptionist-dashboard-stat-content">
            <span className="smarthealth-receptionist-dashboard-stat-label">
              Total Appointments
            </span>

            <strong className="smarthealth-receptionist-dashboard-stat-value">
              {loading ? "—" : statistics.total}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-dashboard-stat-card">

          <div className="smarthealth-receptionist-dashboard-stat-icon smarthealth-receptionist-dashboard-stat-icon-scheduled">
            📅
          </div>

          <div className="smarthealth-receptionist-dashboard-stat-content">
            <span className="smarthealth-receptionist-dashboard-stat-label">
              Scheduled
            </span>

            <strong className="smarthealth-receptionist-dashboard-stat-value">
              {loading ? "—" : statistics.scheduled}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-dashboard-stat-card">

          <div className="smarthealth-receptionist-dashboard-stat-icon smarthealth-receptionist-dashboard-stat-icon-completed">
            ✓
          </div>

          <div className="smarthealth-receptionist-dashboard-stat-content">
            <span className="smarthealth-receptionist-dashboard-stat-label">
              Completed
            </span>

            <strong className="smarthealth-receptionist-dashboard-stat-value">
              {loading ? "—" : statistics.completed}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-dashboard-stat-card">

          <div className="smarthealth-receptionist-dashboard-stat-icon smarthealth-receptionist-dashboard-stat-icon-cancelled">
            ×
          </div>

          <div className="smarthealth-receptionist-dashboard-stat-content">
            <span className="smarthealth-receptionist-dashboard-stat-label">
              Cancelled
            </span>

            <strong className="smarthealth-receptionist-dashboard-stat-value">
              {loading ? "—" : statistics.cancelled}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================================
          QUICK ACTIONS
      ======================================================= */}

      <section className="smarthealth-receptionist-dashboard-section">

        <div className="smarthealth-receptionist-dashboard-section-header">

          <div>
            <h2 className="smarthealth-receptionist-dashboard-section-title">
              Quick Actions
            </h2>

            <p className="smarthealth-receptionist-dashboard-section-description">
              Access frequently used receptionist functions.
            </p>
          </div>

        </div>

        <div className="smarthealth-receptionist-dashboard-action-grid">

          <button
            type="button"
            className="smarthealth-receptionist-dashboard-action-card"
            onClick={() =>
              navigate("/receptionist/appointments")
            }
          >
            <span className="smarthealth-receptionist-dashboard-action-icon">
              📅
            </span>

            <span className="smarthealth-receptionist-dashboard-action-content">
              <strong>Appointments</strong>
              <small>
                View and manage appointments
              </small>
            </span>

            <span className="smarthealth-receptionist-dashboard-action-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className="smarthealth-receptionist-dashboard-action-card"
            onClick={() =>
              navigate("/receptionist/availability")
            }
          >
            <span className="smarthealth-receptionist-dashboard-action-icon">
              🩺
            </span>

            <span className="smarthealth-receptionist-dashboard-action-content">
              <strong>Doctor Availability</strong>
              <small>
                View doctor schedules
              </small>
            </span>

            <span className="smarthealth-receptionist-dashboard-action-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className="smarthealth-receptionist-dashboard-action-card"
            onClick={() =>
              navigate("/receptionist/billing")
            }
          >
            <span className="smarthealth-receptionist-dashboard-action-icon">
              💳
            </span>

            <span className="smarthealth-receptionist-dashboard-action-content">
              <strong>Billing</strong>
              <small>
                Manage patient billing
              </small>
            </span>

            <span className="smarthealth-receptionist-dashboard-action-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className="smarthealth-receptionist-dashboard-action-card"
            onClick={() =>
              navigate("/receptionist/payments")
            }
          >
            <span className="smarthealth-receptionist-dashboard-action-icon">
              💰
            </span>

            <span className="smarthealth-receptionist-dashboard-action-content">
              <strong>Payments</strong>
              <small>
                View payment information
              </small>
            </span>

            <span className="smarthealth-receptionist-dashboard-action-arrow">
              →
            </span>
          </button>

          <button
            type="button"
            className="smarthealth-receptionist-dashboard-action-card"
            onClick={() =>
              navigate("/receptionist/insurance")
            }
          >
            <span className="smarthealth-receptionist-dashboard-action-icon">
              🛡️
            </span>

            <span className="smarthealth-receptionist-dashboard-action-content">
              <strong>Insurance</strong>
              <small>
                Manage insurance information
              </small>
            </span>

            <span className="smarthealth-receptionist-dashboard-action-arrow">
              →
            </span>
          </button>

        </div>

      </section>

      {/* ======================================================
          MAIN DASHBOARD CONTENT
      ======================================================= */}

      <div className="smarthealth-receptionist-dashboard-content-grid">

        {/* TODAY */}

        <section className="smarthealth-receptionist-dashboard-panel">

          <div className="smarthealth-receptionist-dashboard-panel-header">

            <div>
              <h2 className="smarthealth-receptionist-dashboard-panel-title">
                Today's Appointments
              </h2>

              <p className="smarthealth-receptionist-dashboard-panel-description">
                Appointments scheduled for today.
              </p>
            </div>

            <span className="smarthealth-receptionist-dashboard-panel-count">
              {loading ? "—" : statistics.today}
            </span>

          </div>

          {loading ? (
            <div className="smarthealth-receptionist-dashboard-loading">
              Loading appointments...
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="smarthealth-receptionist-dashboard-empty">
              <span className="smarthealth-receptionist-dashboard-empty-icon">
                📅
              </span>

              <strong>
                No appointments today
              </strong>

              <span>
                There are no appointments scheduled
                for today.
              </span>
            </div>
          ) : (
            <div className="smarthealth-receptionist-dashboard-appointment-list">

              {todayAppointments
                .slice(0, 6)
                .map((appointment) => (
                  <div
                    key={appointment.appointmentId}
                    className="smarthealth-receptionist-dashboard-appointment-item"
                  >
                    <div className="smarthealth-receptionist-dashboard-appointment-time">
                      {formatTime(
                        appointment.appointmentTime
                      )}
                    </div>

                    <div className="smarthealth-receptionist-dashboard-appointment-info">

                      <strong>
                        {appointment.patientName ||
                          "Unknown Patient"}
                      </strong>

                      <span>
                        Dr.{" "}
                        {appointment.doctorName ||
                          "Unknown Doctor"}
                      </span>

                    </div>

                    <span
                      className={`smarthealth-receptionist-dashboard-status ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                ))}

            </div>
          )}

        </section>

        {/* UPCOMING */}

        <section className="smarthealth-receptionist-dashboard-panel">

          <div className="smarthealth-receptionist-dashboard-panel-header">

            <div>
              <h2 className="smarthealth-receptionist-dashboard-panel-title">
                Upcoming Appointments
              </h2>

              <p className="smarthealth-receptionist-dashboard-panel-description">
                Next scheduled patient appointments.
              </p>
            </div>

            <button
              type="button"
              className="smarthealth-receptionist-dashboard-view-all-button"
              onClick={() =>
                navigate("/receptionist/appointments")
              }
            >
              View All
            </button>

          </div>

          {loading ? (
            <div className="smarthealth-receptionist-dashboard-loading">
              Loading appointments...
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="smarthealth-receptionist-dashboard-empty">
              <span className="smarthealth-receptionist-dashboard-empty-icon">
                🗓️
              </span>

              <strong>
                No upcoming appointments
              </strong>

              <span>
                There are no upcoming scheduled
                appointments.
              </span>
            </div>
          ) : (
            <div className="smarthealth-receptionist-dashboard-upcoming-list">

              {upcomingAppointments.map(
                (appointment) => (
                  <div
                    key={appointment.appointmentId}
                    className="smarthealth-receptionist-dashboard-upcoming-item"
                  >

                    <div className="smarthealth-receptionist-dashboard-upcoming-date">

                      <strong>
                        {formatDate(
                          appointment.appointmentDate
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          appointment.appointmentTime
                        )}
                      </span>

                    </div>

                    <div className="smarthealth-receptionist-dashboard-upcoming-info">

                      <strong>
                        {appointment.patientName ||
                          "Unknown Patient"}
                      </strong>

                      <span>
                        Dr.{" "}
                        {appointment.doctorName ||
                          "Unknown Doctor"}
                      </span>

                    </div>

                    <span
                      className={`smarthealth-receptionist-dashboard-status ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </div>
  );
};

export default ReceptionistDashboard;