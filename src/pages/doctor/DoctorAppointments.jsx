import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import appointmentService from "../../services/appointmentService";

import "../../styles/pages/doctor/DoctorAppointments.css";

const smarthealthDoctorAppointmentStatusOptions = [
  "All",
  "Scheduled",
  "Completed",
  "Cancelled",
  "NoShow",
];

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data =
        await appointmentService.getDoctorAppointments();

      setAppointments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to load doctor appointments:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to load your appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return String(dateValue).substring(0, 10);
  };

  const formatDate = (dateValue) => {
    const normalizedDate =
      normalizeDate(dateValue);

    if (!normalizedDate) {
      return "--";
    }

    const date = new Date(
      `${normalizedDate}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return normalizedDate;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "--";
    }

    const timeText = String(timeValue);

    const parts = timeText.split(":");

    if (parts.length < 2) {
      return timeText;
    }

    const hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
      return timeText;
    }

    const suffix = hours >= 12 ? "PM" : "AM";

    const displayHours =
      hours % 12 === 0 ? 12 : hours % 12;

    return `${displayHours}:${minutes} ${suffix}`;
  };

  const getTodayString = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();

  const filteredAppointments = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patientName =
        appointment.patientName?.toLowerCase() || "";

      const symptoms =
        appointment.symptoms?.toLowerCase() || "";

      const status =
        appointment.status || "";

      const appointmentDate =
        normalizeDate(
          appointment.appointmentDate
        );

      const matchesSearch =
        !normalizedSearch ||
        patientName.includes(normalizedSearch) ||
        symptoms.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesDate =
        !dateFilter ||
        appointmentDate === dateFilter;

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

  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort(
      (first, second) => {
        const firstDate =
          normalizeDate(
            first.appointmentDate
          );

        const secondDate =
          normalizeDate(
            second.appointmentDate
          );

        if (firstDate !== secondDate) {
          return firstDate.localeCompare(
            secondDate
          );
        }

        return String(
          first.appointmentTime || ""
        ).localeCompare(
          String(
            second.appointmentTime || ""
          )
        );
      }
    );
  }, [filteredAppointments]);

  const totalAppointments =
    appointments.length;

  const scheduledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() ===
        "scheduled"
    ).length;

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() ===
        "completed"
    ).length;

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() ===
        "cancelled"
    ).length;

  const noShowAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() ===
        "noshow"
    ).length;

  const todayAppointments =
    appointments.filter(
      (appointment) =>
        normalizeDate(
          appointment.appointmentDate
        ) === todayString
    ).length;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilter("");
  };

  const hasActiveFilters =
    searchTerm.trim() ||
    statusFilter !== "All" ||
    dateFilter;

  const getStatusClass = (status) => {
    const normalizedStatus =
      status?.toLowerCase();

    if (normalizedStatus === "completed") {
      return "smarthealth-doctor-appointments-status-completed";
    }

    if (normalizedStatus === "cancelled") {
      return "smarthealth-doctor-appointments-status-cancelled";
    }

    if (normalizedStatus === "noshow") {
      return "smarthealth-doctor-appointments-status-noshow";
    }

    return "smarthealth-doctor-appointments-status-scheduled";
  };

  const getStatusLabel = (status) => {
    if (status === "NoShow") {
      return "No Show";
    }

    return status || "Unknown";
  };

  if (loading) {
    return (
      <div className="smarthealth-doctor-appointments-page">
        <div className="smarthealth-doctor-appointments-loading">
          <div className="smarthealth-doctor-appointments-spinner"></div>

          <p>
            Loading your appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="smarthealth-doctor-appointments-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="smarthealth-doctor-appointments-header">

        <div>
          <span className="smarthealth-doctor-appointments-eyebrow">
            DOCTOR PORTAL
          </span>

          <h1 className="smarthealth-doctor-appointments-title">
            Appointments
          </h1>

          <p className="smarthealth-doctor-appointments-subtitle">
            View and manage your scheduled patient appointments.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-doctor-appointments-refresh-button"
          onClick={() =>
            loadAppointments(true)
          }
          disabled={refreshing}
        >
          <span className="smarthealth-doctor-appointments-refresh-icon">
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="smarthealth-doctor-appointments-summary">

        <div className="smarthealth-doctor-appointments-summary-card">

          <div className="smarthealth-doctor-appointments-summary-icon">
            ▣
          </div>

          <div>
            <span>Total</span>
            <strong>
              {totalAppointments}
            </strong>
          </div>

        </div>

        <div className="smarthealth-doctor-appointments-summary-card">

          <div className="smarthealth-doctor-appointments-summary-icon">
            ◷
          </div>

          <div>
            <span>Scheduled</span>
            <strong>
              {scheduledAppointments}
            </strong>
          </div>

        </div>

        <div className="smarthealth-doctor-appointments-summary-card">

          <div className="smarthealth-doctor-appointments-summary-icon">
            ✓
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {completedAppointments}
            </strong>
          </div>

        </div>

        <div className="smarthealth-doctor-appointments-summary-card">

          <div className="smarthealth-doctor-appointments-summary-icon">
            ◉
          </div>

          <div>
            <span>Today</span>
            <strong>
              {todayAppointments}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="smarthealth-doctor-appointments-filter-card">

        <div className="smarthealth-doctor-appointments-filter-header">
          <div>
            <h2>
              Appointment List
            </h2>

            <p>
              {filteredAppointments.length} appointment
              {filteredAppointments.length === 1
                ? ""
                : "s"} displayed
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="smarthealth-doctor-appointments-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="smarthealth-doctor-appointments-filters">

          {/* SEARCH */}

          <div className="smarthealth-doctor-appointments-search-wrapper">

            <label
              htmlFor="smarthealth-doctor-appointments-search"
              className="smarthealth-doctor-appointments-filter-label"
            >
              Search
            </label>

            <div className="smarthealth-doctor-appointments-search-box">

              <span className="smarthealth-doctor-appointments-search-icon">
                ⌕
              </span>

              <input
                id="smarthealth-doctor-appointments-search"
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search by patient or symptoms..."
              />

            </div>

          </div>

          {/* STATUS */}

          <div className="smarthealth-doctor-appointments-filter-group">

            <label
              htmlFor="smarthealth-doctor-appointments-status"
              className="smarthealth-doctor-appointments-filter-label"
            >
              Status
            </label>

            <select
              id="smarthealth-doctor-appointments-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="smarthealth-doctor-appointments-select"
            >
              {smarthealthDoctorAppointmentStatusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "NoShow"
                      ? "No Show"
                      : status}
                  </option>
                )
              )}
            </select>

          </div>

          {/* DATE */}

          <div className="smarthealth-doctor-appointments-filter-group">

            <label
              htmlFor="smarthealth-doctor-appointments-date"
              className="smarthealth-doctor-appointments-filter-label"
            >
              Date
            </label>

            <input
              id="smarthealth-doctor-appointments-date"
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
              className="smarthealth-doctor-appointments-date-input"
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          APPOINTMENT TABLE
      ====================================================== */}

      <section className="smarthealth-doctor-appointments-table-card">

        {sortedAppointments.length === 0 ? (
          <div className="smarthealth-doctor-appointments-empty">

            <div className="smarthealth-doctor-appointments-empty-icon">
              ▣
            </div>

            <h3>
              {appointments.length === 0
                ? "No Appointments Yet"
                : "No Matching Appointments"}
            </h3>

            <p>
              {appointments.length === 0
                ? "You currently have no appointments assigned to you."
                : "Try changing your search or filters."}
            </p>

            {appointments.length > 0 &&
              hasActiveFilters && (
                <button
                  type="button"
                  className="smarthealth-doctor-appointments-empty-clear-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}

          </div>
        ) : (
          <div className="smarthealth-doctor-appointments-table-wrapper">

            <table className="smarthealth-doctor-appointments-table">

              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>PATIENT</th>
                  <th>SYMPTOMS</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {sortedAppointments.map(
                  (appointment) => (
                    <tr
                      key={
                        appointment.appointmentId
                      }
                    >

                      <td>
                        <div className="smarthealth-doctor-appointments-date-cell">
                          <strong>
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="smarthealth-doctor-appointments-time-cell">
                          {formatTime(
                            appointment.appointmentTime
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="smarthealth-doctor-appointments-patient-cell">

                          <div className="smarthealth-doctor-appointments-patient-avatar">
                            {(
                              appointment.patientName ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}
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
                        <div className="smarthealth-doctor-appointments-symptoms-cell">
                          {appointment.symptoms ? (
                            appointment.symptoms
                          ) : (
                            <span className="smarthealth-doctor-appointments-no-symptoms">
                              No symptoms provided
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`smarthealth-doctor-appointments-status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          <span className="smarthealth-doctor-appointments-status-dot"></span>

                          {getStatusLabel(
                            appointment.status
                          )}
                        </span>
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =====================================================
          INFORMATION NOTE
      ====================================================== */}

      <div className="smarthealth-doctor-appointments-info-note">

        <span className="smarthealth-doctor-appointments-info-icon">
          i
        </span>

        <p>
          Appointment status and booking changes are currently
          managed through the appropriate patient and
          administrative workflows.
        </p>

      </div>

    </div>
  );
};

export default DoctorAppointments;