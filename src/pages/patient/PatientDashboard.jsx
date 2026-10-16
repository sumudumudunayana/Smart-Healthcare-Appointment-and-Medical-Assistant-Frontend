import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "../../styles/pages/patient/PatientDashboard.css";

const PatientDashboard = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const today = useMemo(() => new Date(), []);

  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /**
   * Load appointments belonging to the authenticated patient.
   */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const response = await api.get("/Appointments/my");

      // Support either a direct array or a common wrapped response.
      const data = response.data;

      const appointmentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
          ? data.appointments
          : Array.isArray(data?.$values)
            ? data.$values
            : null;

      if (!appointmentList) {
        throw new Error("Unexpected appointments response.");
      }

      setAppointments(appointmentList);
    } catch (error) {
      console.error("Failed to load patient appointments:", error);

      setAppointments([]);
      setLoadError(true);

      toast.error(
        error.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : "Unable to load your appointments. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /**
   * Convert backend date/time values into a comparable Date.
   */
  const getAppointmentDateTime = (appointment) => {
    const date = appointment.appointmentDate;
    const time = appointment.appointmentTime;

    if (!date) {
      return null;
    }

    const dateString =
      typeof date === "string" ? date.split("T")[0] : String(date);

    const timeString = time ? String(time).substring(0, 8) : "00:00:00";

    const appointmentDate = new Date(`${dateString}T${timeString}`);

    return Number.isNaN(appointmentDate.getTime()) ? null : appointmentDate;
  };

  /**
   * Determine whether an appointment is still active.
   */
  const isActiveAppointment = (appointment) => {
    const status = String(appointment.status || "")
      .trim()
      .toLowerCase();

    return (
      status !== "cancelled" &&
      status !== "completed" &&
      status !== "no-show" &&
      status !== "noshow"
    );
  };

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        const appointmentDate = getAppointmentDateTime(appointment);

        return (
          appointmentDate &&
          appointmentDate >= now &&
          isActiveAppointment(appointment)
        );
      })
      .sort((a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b));
  }, [appointments]);

  const activeAppointmentCount = useMemo(
    () => appointments.filter(isActiveAppointment).length,
    [appointments],
  );

  const completedAppointmentCount = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          String(appointment.status || "").toLowerCase() === "completed",
      ).length,
    [appointments],
  );

  /**
   * Format the appointment date.
   */
  const formatAppointmentDate = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const dateString =
      typeof value === "string" ? value.split("T")[0] : String(value);

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Format the appointment time.
   */
  const formatAppointmentTime = (value) => {
    if (!value) {
      return "Time unavailable";
    }

    const timeString = String(value).substring(0, 8);
    const [hours, minutes] = timeString.split(":").map(Number);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return "Time unavailable";
    }

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return String(status)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const quickActions = [
    {
      icon: "⚕",
      title: "Find a Doctor",
      description: "Explore doctors and their specializations.",
      link: "/patient/doctors",
      action: "Explore doctors",
      className: "doctors",
    },
    {
      icon: "＋",
      title: "Book Appointment",
      description: "Find a convenient time for your next visit.",
      link: "/patient/book-appointment",
      action: "Book now",
      className: "booking",
    },
    {
      icon: "▦",
      title: "My Appointments",
      description: "Review your scheduled and previous visits.",
      link: "/patient/appointments",
      action: "View appointments",
      className: "appointments",
    },
  ];

  const healthLinks = [
    {
      icon: "▤",
      title: "Medical Records",
      description: "Access your available medical records.",
      link: "/patient/medical-records",
    },
    {
      icon: "✚",
      title: "Prescriptions",
      description: "Review prescriptions provided by your doctors.",
      link: "/patient/prescriptions",
    },
    {
      icon: "▧",
      title: "Lab Reports",
      description: "View your available laboratory reports.",
      link: "/patient/lab-reports",
    },
    {
      icon: "◉",
      title: "My Profile",
      description: "Review and manage your account information.",
      link: "/patient/profile",
    },
  ];

  return (
    <div className="smarthealth-patient-dashboard">
      {/* WELCOME HEADER */}
      <section className="smarthealth-patient-dashboard-header">
        <div className="smarthealth-patient-dashboard-welcome">
          <span className="smarthealth-patient-dashboard-eyebrow">
            PATIENT PORTAL
          </span>

          <h1>Welcome back, {user?.fullName?.trim() || "Patient"}!</h1>

          <p>
            Manage your appointments, access your health information, and stay
            connected with your healthcare team.
          </p>
        </div>

        <div className="smarthealth-patient-dashboard-date">
          <span>Today</span>
          <strong>{formattedDate}</strong>
        </div>
      </section>

      {/* QUICK SUMMARY */}
      <section className="smarthealth-patient-dashboard-summary">
        <article className="smarthealth-patient-summary-card">
          <div className="smarthealth-patient-summary-icon appointments">▦</div>

          <div className="smarthealth-patient-summary-content">
            <span>My Appointments</span>

            <strong>{loading ? "..." : activeAppointmentCount}</strong>

            <p>Active appointments</p>
          </div>

          <Link
            to="/patient/appointments"
            className="smarthealth-patient-summary-link"
            aria-label="View all appointments"
          >
            →
          </Link>
        </article>

        <article className="smarthealth-patient-summary-card">
          <div className="smarthealth-patient-summary-icon doctors">⚕</div>

          <div className="smarthealth-patient-summary-content">
            <span>Upcoming Visits</span>

            <strong>{loading ? "..." : upcomingAppointments.length}</strong>

            <p>Scheduled for the future</p>
          </div>

          <Link
            to="/patient/appointments"
            className="smarthealth-patient-summary-link"
            aria-label="View upcoming appointments"
          >
            →
          </Link>
        </article>

        <article className="smarthealth-patient-summary-card">
          <div className="smarthealth-patient-summary-icon records">▤</div>

          <div className="smarthealth-patient-summary-content">
            <span>Completed Visits</span>

            <strong>{loading ? "..." : completedAppointmentCount}</strong>

            <p>Previous completed visits</p>
          </div>

          <Link
            to="/patient/appointments"
            className="smarthealth-patient-summary-link"
            aria-label="View previous appointments"
          >
            →
          </Link>
        </article>
      </section>

      {/* QUICK ACTIONS */}
      <section className="smarthealth-patient-dashboard-section">
        <div className="smarthealth-patient-section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>What would you like to do today?</p>
          </div>
        </div>

        <div className="smarthealth-patient-quick-actions">
          {quickActions.map((action) => (
            <article
              className="smarthealth-patient-action-card"
              key={action.title}
            >
              <div
                className={`smarthealth-patient-action-icon ${action.className}`}
              >
                {action.icon}
              </div>

              <h3>{action.title}</h3>

              <p>{action.description}</p>

              <Link
                to={action.link}
                className="smarthealth-patient-action-link"
              >
                {action.action}
                <span>→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* APPOINTMENTS */}
      <section className="smarthealth-patient-dashboard-section">
        <div className="smarthealth-patient-panel">
          <div className="smarthealth-patient-panel-header">
            <div>
              <h2>My Appointments</h2>
              <p>Keep track of your upcoming and previous visits.</p>
            </div>

            <Link
              to="/patient/appointments"
              className="smarthealth-patient-text-link"
            >
              View all <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="smarthealth-patient-appointment-empty">
              <div className="smarthealth-patient-empty-icon">⏳</div>

              <h3>Loading your appointments...</h3>

              <p>Please wait while we retrieve your appointment information.</p>
            </div>
          ) : loadError ? (
            <div className="smarthealth-patient-appointment-empty">
              <div className="smarthealth-patient-empty-icon">⚠</div>

              <h3>Unable to load appointments</h3>

              <p>We could not retrieve your appointments. Please try again.</p>

              <button
                type="button"
                className="smarthealth-patient-primary-button"
                onClick={fetchAppointments}
              >
                Try again
              </button>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="smarthealth-patient-appointment-empty">
              <div className="smarthealth-patient-empty-icon">📅</div>

              <h3>No upcoming appointments</h3>

              <p>
                You do not have any upcoming appointments. Book your next visit
                whenever you need to see a doctor.
              </p>

              <Link
                to="/patient/book-appointment"
                className="smarthealth-patient-primary-button"
              >
                <span>＋</span>
                Book an Appointment
              </Link>
            </div>
          ) : (
            <div className="smarthealth-patient-quick-actions">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <article
                  className="smarthealth-patient-action-card"
                  key={appointment.appointmentId}
                >
                  <div className="smarthealth-patient-action-icon appointments">
                    📅
                  </div>

                  <h3>Dr. {appointment.doctorName || "Doctor"}</h3>

                  <p>
                    <strong>Date:</strong>{" "}
                    {formatAppointmentDate(appointment.appointmentDate)}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {formatAppointmentTime(appointment.appointmentTime)}
                  </p>

                  <p>
                    <strong>Status:</strong> {formatStatus(appointment.status)}
                  </p>

                  {appointment.symptoms && (
                    <p>
                      <strong>Reason:</strong> {appointment.symptoms}
                    </p>
                  )}

                  <Link
                    to="/patient/appointments"
                    className="smarthealth-patient-action-link"
                  >
                    View details
                    <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HEALTH INFORMATION */}
      <section className="smarthealth-patient-dashboard-section">
        <div className="smarthealth-patient-section-heading">
          <div>
            <h2>Your Health Information</h2>
            <p>Keep your healthcare information within reach.</p>
          </div>
        </div>

        <div className="smarthealth-patient-health-grid">
          {healthLinks.map((item) => (
            <Link
              to={item.link}
              className="smarthealth-patient-health-card"
              key={item.title}
            >
              <div className="smarthealth-patient-health-icon">{item.icon}</div>

              <div className="smarthealth-patient-health-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <span className="smarthealth-patient-health-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* HEALTH REMINDER */}
      <section className="smarthealth-patient-health-reminder">
        <div className="smarthealth-patient-reminder-icon">♥</div>

        <div>
          <h3>Your health matters</h3>

          <p>
            Keep your appointments up to date and follow the advice provided by
            your healthcare professionals.
          </p>
        </div>

        <Link
          to="/patient/appointments"
          className="smarthealth-patient-reminder-link"
        >
          My appointments →
        </Link>
      </section>
    </div>
  );
};

export default PatientDashboard;
