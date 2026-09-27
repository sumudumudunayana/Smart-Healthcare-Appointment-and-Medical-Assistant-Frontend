import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import appointmentService from "../../services/appointmentService";

import "../../styles/pages/receptionist/ReceptionistAppointments.css";

const ReceptionistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data =
        await appointmentService.getReceptionistAppointments();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to load appointments.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments.filter((appointment) => {
      const patientName =
        appointment.patientName?.toLowerCase() || "";

      const doctorName =
        appointment.doctorName?.toLowerCase() || "";

      const search =
        searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        patientName.includes(search) ||
        doctorName.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        appointment.status === statusFilter;

      const appointmentDate =
        new Date(`${appointment.appointmentDate}T00:00:00`);

      let matchesDate = true;

      if (dateFilter === "Today") {
        matchesDate =
          appointmentDate.getTime() === today.getTime();
      }

      if (dateFilter === "Upcoming") {
        matchesDate =
          appointmentDate.getTime() >= today.getTime();
      }

      if (dateFilter === "Past") {
        matchesDate =
          appointmentDate.getTime() < today.getTime();
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    appointments,
    searchTerm,
    statusFilter,
    dateFilter,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";

    const [hours, minutes] =
      timeString.split(":");

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

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "smarthealth-receptionist-appointment-status-scheduled";

      case "completed":
        return "smarthealth-receptionist-appointment-status-completed";

      case "cancelled":
        return "smarthealth-receptionist-appointment-status-cancelled";

      case "noshow":
        return "smarthealth-receptionist-appointment-status-noshow";

      default:
        return "smarthealth-receptionist-appointment-status-default";
    }
  };

  const handleRefresh = async () => {
    await loadAppointments();

    if (!errorMessage) {
      toast.success("Appointments refreshed.");
    }
  };

  const scheduledCount = appointments.filter(
    (appointment) =>
      appointment.status?.toLowerCase() === "scheduled"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status?.toLowerCase() === "completed"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) =>
      appointment.status?.toLowerCase() === "cancelled"
  ).length;

  return (
    <div className="smarthealth-receptionist-appointments-page">

      <div className="smarthealth-receptionist-appointments-header">
        <div>
          <h1 className="smarthealth-receptionist-appointments-title">
            Appointments
          </h1>

          <p className="smarthealth-receptionist-appointments-subtitle">
            View and manage hospital appointments.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-appointments-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <span>↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="smarthealth-receptionist-appointments-summary">

        <div className="smarthealth-receptionist-appointment-summary-card">
          <div className="smarthealth-receptionist-appointment-summary-icon">
            📅
          </div>

          <div>
            <span className="smarthealth-receptionist-appointment-summary-label">
              Total
            </span>

            <strong className="smarthealth-receptionist-appointment-summary-value">
              {appointments.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-appointment-summary-card">
          <div className="smarthealth-receptionist-appointment-summary-icon">
            ⏰
          </div>

          <div>
            <span className="smarthealth-receptionist-appointment-summary-label">
              Scheduled
            </span>

            <strong className="smarthealth-receptionist-appointment-summary-value">
              {scheduledCount}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-appointment-summary-card">
          <div className="smarthealth-receptionist-appointment-summary-icon">
            ✓
          </div>

          <div>
            <span className="smarthealth-receptionist-appointment-summary-label">
              Completed
            </span>

            <strong className="smarthealth-receptionist-appointment-summary-value">
              {completedCount}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-appointment-summary-card">
          <div className="smarthealth-receptionist-appointment-summary-icon">
            ×
          </div>

          <div>
            <span className="smarthealth-receptionist-appointment-summary-label">
              Cancelled
            </span>

            <strong className="smarthealth-receptionist-appointment-summary-value">
              {cancelledCount}
            </strong>
          </div>
        </div>

      </div>

      <div className="smarthealth-receptionist-appointments-filters">

        <div className="smarthealth-receptionist-appointments-search-wrapper">
          <span className="smarthealth-receptionist-appointments-search-icon">
            🔍
          </span>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search patient or doctor..."
            className="smarthealth-receptionist-appointments-search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="smarthealth-receptionist-appointments-filter-select"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="NoShow">No Show</option>
        </select>

        <select
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(event.target.value)
          }
          className="smarthealth-receptionist-appointments-filter-select"
        >
          <option value="All">All Dates</option>
          <option value="Today">Today</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Past">Past</option>
        </select>

      </div>

      <div className="smarthealth-receptionist-appointments-content">

        {loading ? (
          <div className="smarthealth-receptionist-appointments-state">
            <div className="smarthealth-receptionist-appointments-spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : errorMessage ? (
          <div className="smarthealth-receptionist-appointments-state">
            <div className="smarthealth-receptionist-appointments-state-icon">
              ⚠
            </div>

            <h3>Unable to load appointments</h3>

            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={loadAppointments}
              className="smarthealth-receptionist-appointments-retry-button"
            >
              Try Again
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="smarthealth-receptionist-appointments-state">
            <div className="smarthealth-receptionist-appointments-state-icon">
              📅
            </div>

            <h3>No appointments found</h3>

            <p>
              There are no appointments matching
              your current filters.
            </p>
          </div>
        ) : (
          <div className="smarthealth-receptionist-appointments-table-wrapper">

            <table className="smarthealth-receptionist-appointments-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map(
                  (appointment) => (
                    <tr
                      key={appointment.appointmentId}
                    >
                      <td>
                        <div className="smarthealth-receptionist-appointment-patient">
                          <div className="smarthealth-receptionist-appointment-avatar">
                            {appointment.patientName
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </div>

                          <div>
                            <strong>
                              {appointment.patientName ||
                                "Unknown Patient"}
                            </strong>

                            <span>
                              Patient
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="smarthealth-receptionist-appointment-doctor">
                          {appointment.doctorName ||
                            "Unknown Doctor"}
                        </div>
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-appointment-date">
                          {formatDate(
                            appointment.appointmentDate
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-appointment-time">
                          {formatTime(
                            appointment.appointmentTime
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-appointment-symptoms">
                          {appointment.symptoms ||
                            "No symptoms provided"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`smarthealth-receptionist-appointment-status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status ||
                            "Unknown"}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default ReceptionistAppointments;