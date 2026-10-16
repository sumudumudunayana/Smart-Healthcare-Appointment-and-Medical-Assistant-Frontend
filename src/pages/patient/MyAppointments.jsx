import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import api from "../../services/api";

import "../../styles/pages/patient/MyAppointments.css";

const getLocalDateString = () => {

  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

};

const normalizeTime = (time) => {

  if (!time) return "";

  return String(time).slice(0, 5);

};

const formatDate = (dateString) => {

  if (!dateString) return "Date unavailable";

  // Parse at noon to avoid UTC timezone shifts.

  const date = new Date(`${String(dateString).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {

    return String(dateString);

  }

  return date.toLocaleDateString("en-US", {

    weekday: "short",

    month: "short",

    day: "numeric",

    year: "numeric",

  });

};

const formatTime = (timeString) => {

  const normalized = normalizeTime(timeString);

  if (!normalized) return "Time unavailable";

  const [hours, minutes] = normalized.split(":").map(Number);

  if (

    !Number.isFinite(hours) ||

    !Number.isFinite(minutes) ||

    hours < 0 ||

    hours > 23 ||

    minutes < 0 ||

    minutes > 59

  ) {

    return normalized;

  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {

    hour: "numeric",

    minute: "2-digit",

  });

};

const normalizeStatus = (status) =>

  String(status ?? "")

    .trim()

    .toLowerCase();

const getStatusClass = (status) => {

  const normalized = normalizeStatus(status);

  if (normalized === "scheduled" || normalized === "confirmed") {

    return "scheduled";

  }

  if (normalized === "completed") {

    return "completed";

  }

  if (normalized === "cancelled" || normalized === "canceled") {

    return "cancelled";

  }

  if (

    normalized === "noshow" ||

    normalized === "no show" ||

    normalized === "no-show"

  ) {

    return "no-show";

  }

  return "default";

};

const canCancelAppointment = (appointment) => {

  const status = normalizeStatus(appointment.status);

  return ![

    "cancelled",

    "canceled",

    "completed",

    "noshow",

    "no show",

    "no-show",

  ].includes(status);

};

const hasAppointmentPassed = (appointment, currentTime = new Date()) => {

  const appointmentDate = String(appointment.appointmentDate ?? "").slice(

    0,

    10,

  );

  const appointmentTime = normalizeTime(appointment.appointmentTime);

  if (!appointmentDate || !appointmentTime) {

    return false;

  }

  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

  if (Number.isNaN(appointmentDateTime.getTime())) {

    return false;

  }

  return appointmentDateTime < currentTime;

};

const isUpcoming = (appointment, currentTime = new Date()) => {

  const status = normalizeStatus(appointment.status);

  const closedStatuses = [

    "cancelled",

    "canceled",

    "completed",

    "noshow",

    "no show",

    "no-show",

  ];

  if (closedStatuses.includes(status)) {

    return false;

  }

  return !hasAppointmentPassed(appointment, currentTime);

};

const isPast = (appointment, currentTime = new Date()) => {

  return !isUpcoming(appointment, currentTime);

};

const getErrorMessage = (error, fallback) =>

  error?.response?.data?.message || error?.response?.data?.title || fallback;

const MyAppointments = () => {

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const [cancelling, setCancelling] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Keep appointment sections in sync with the current local time.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------

  // LOAD THE LOGGED-IN PATIENT'S APPOINTMENTS

  // ---------------------------------------------------------

  const loadAppointments = useCallback(async () => {

    setLoading(true);

    setLoadError(false);

    try {

      const response = await api.get("/Appointments/my");

      const data = Array.isArray(response.data) ? response.data : [];

      // Most recent appointment dates first.

      data.sort((a, b) => {

        const dateA = String(a.appointmentDate ?? "");

        const dateB = String(b.appointmentDate ?? "");

        if (dateA !== dateB) {

          return dateB.localeCompare(dateA);

        }

        return normalizeTime(b.appointmentTime).localeCompare(

          normalizeTime(a.appointmentTime),

        );

      });

      setAppointments(data);

    } catch (error) {

      console.error("Failed to load appointments:", error);

      setAppointments([]);

      setLoadError(true);

      toast.error(

        getErrorMessage(

          error,

          "Unable to load your appointments. Please try again.",

        ),

      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadAppointments();

  }, [loadAppointments, refreshKey]);

  // ---------------------------------------------------------

  // FILTER APPOINTMENTS

  // ---------------------------------------------------------

  const filteredAppointments = useMemo(() => {

    const search = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {

      const doctorName = String(appointment.doctorName ?? "").toLowerCase();

      const symptoms = String(appointment.symptoms ?? "").toLowerCase();

      const status = normalizeStatus(appointment.status);

      const matchesSearch =

        !search ||

        doctorName.includes(search) ||

        symptoms.includes(search) ||

        String(appointment.appointmentId ?? "")

          .toLowerCase()

          .includes(search);

      let matchesStatus = true;

      if (statusFilter === "scheduled") {

        matchesStatus = status === "scheduled" || status === "confirmed";

      } else if (statusFilter === "completed") {

        matchesStatus = status === "completed";

      } else if (statusFilter === "cancelled") {

        matchesStatus = status === "cancelled" || status === "canceled";

      } else if (statusFilter === "no-show") {

        matchesStatus = ["noshow", "no show", "no-show"].includes(status);

      }

      let matchesDate = true;

      if (dateFilter === "upcoming") {

        matchesDate = isUpcoming(appointment, currentTime);

      } else if (dateFilter === "past") {

        matchesDate =

          isPast(appointment, currentTime);

      }

      return matchesSearch && matchesStatus && matchesDate;

    });

  }, [appointments, searchTerm, statusFilter, dateFilter, currentTime]);

  // ---------------------------------------------------------

  // APPOINTMENT COUNTS

  // ---------------------------------------------------------

  const counts = useMemo(() => {

    return {

      total: appointments.length,

      upcoming: appointments.filter((appointment) =>
        isUpcoming(appointment, currentTime),
      ).length,

      completed: appointments.filter(

        (appointment) => normalizeStatus(appointment.status) === "completed",

      ).length,

      cancelled: appointments.filter((appointment) =>

        ["cancelled", "canceled"].includes(normalizeStatus(appointment.status)),

      ).length,

    };

  }, [appointments, currentTime]);

  // ---------------------------------------------------------

  // OPEN CANCELLATION CONFIRMATION

  // ---------------------------------------------------------

  const requestCancellation = (appointment) => {

    if (
      !canCancelAppointment(appointment) ||
      hasAppointmentPassed(appointment, currentTime)
    ) {
      toast.error("This appointment can no longer be cancelled.");

      return;

    }

    setAppointmentToCancel(appointment);

  };

  // ---------------------------------------------------------

  // CANCEL APPOINTMENT

  // ---------------------------------------------------------

  const handleCancelAppointment = async () => {

    if (!appointmentToCancel || cancelling) return;

    const appointmentId = appointmentToCancel.appointmentId;

    setCancelling(true);

    try {

      await api.patch(`/Appointments/${appointmentId}/cancel`);

      toast.success("Appointment cancelled successfully.");

      setAppointmentToCancel(null);

      // Refresh the list to reflect the backend status.

      setRefreshKey((previous) => previous + 1);

    } catch (error) {

      console.error("Failed to cancel appointment:", error);

      toast.error(

        getErrorMessage(

          error,

          "Unable to cancel the appointment. Please try again.",

        ),

      );

    } finally {

      setCancelling(false);

    }

  };

  // ---------------------------------------------------------

  // RESET FILTERS

  // ---------------------------------------------------------

  const renderAppointmentCard = (appointment, showCancelButton) => {
    const statusClass = getStatusClass(appointment.status);
    const cancellable =
      showCancelButton &&
      canCancelAppointment(appointment) &&
      !hasAppointmentPassed(appointment, currentTime);

    return (
      <article
        key={appointment.appointmentId}
        className="smarthealth-my-appointments-card"
      >
        <div className="smarthealth-my-appointments-card-main">
          <div className="smarthealth-my-appointments-doctor-avatar">
            {appointment.doctorName
              ?.replace(/^Dr\.?\s*/i, "")
              .charAt(0)
              .toUpperCase() || "D"}
          </div>
          <div className="smarthealth-my-appointments-doctor-details">
            <div className="smarthealth-my-appointments-doctor-heading">
              <h3>
                {appointment.doctorName
                  ? /^Dr\.?\s*/i.test(appointment.doctorName)
                    ? appointment.doctorName
                    : `Dr. ${appointment.doctorName}`
                  : "Doctor unavailable"}
              </h3>
              <span className={`smarthealth-my-appointments-status ${statusClass}`}>
                {appointment.status || "Unknown"}
              </span>
            </div>
            <p className="smarthealth-my-appointments-id">
              Appointment ID: {appointment.appointmentId}
            </p>
            <div className="smarthealth-my-appointments-details-grid">
              <div className="smarthealth-my-appointments-detail">
                <span className="detail-icon" aria-hidden="true">▦</span>
                <div>
                  <span>Date</span>
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                </div>
              </div>
              <div className="smarthealth-my-appointments-detail">
                <span className="detail-icon" aria-hidden="true">◷</span>
                <div>
                  <span>Time</span>
                  <strong>{formatTime(appointment.appointmentTime)}</strong>
                </div>
              </div>
            </div>
            {appointment.symptoms && (
              <div className="smarthealth-my-appointments-symptoms">
                <span>Reason for visit</span>
                <p>{appointment.symptoms}</p>
              </div>
            )}
          </div>
        </div>
        {cancellable && (
          <div className="smarthealth-my-appointments-card-actions">
            <button
              type="button"
              className="smarthealth-my-appointments-cancel-button"
              onClick={() => requestCancellation(appointment)}
              disabled={cancelling}
            >
              Cancel appointment
            </button>
          </div>
        )}
      </article>
    );
  };

  const clearFilters = () => {

    setSearchTerm("");

    setStatusFilter("all");

    setDateFilter("all");

  };

  // ---------------------------------------------------------

  // RENDER

  // ---------------------------------------------------------

  return (

    <div className="smarthealth-my-appointments">

      {/* PAGE HEADER */}

      <header className="smarthealth-my-appointments-header">

        <div>

          <p className="smarthealth-my-appointments-eyebrow">PATIENT PORTAL</p>

          <h1>My Appointments</h1>

          <p className="smarthealth-my-appointments-subtitle">

            View and manage your doctor appointments in one place.

          </p>

        </div>

        <button

          type="button"

          className="smarthealth-my-appointments-refresh"

          onClick={() => setRefreshKey((previous) => previous + 1)}

          disabled={loading || cancelling}

        >

          <span aria-hidden="true">↻</span>

          Refresh

        </button>

      </header>

      {/* SUMMARY CARDS */}

      <section

        className="smarthealth-my-appointments-stats"

        aria-label="Appointment summary"

      >

        <article className="smarthealth-my-appointments-stat">

          <div className="smarthealth-my-appointments-stat-icon total">▦</div>

          <div>

            <span>Total appointments</span>

            <strong>{counts.total}</strong>

          </div>

        </article>

        <article className="smarthealth-my-appointments-stat">

          <div className="smarthealth-my-appointments-stat-icon upcoming">

            ◷

          </div>

          <div>

            <span>Upcoming</span>

            <strong>{counts.upcoming}</strong>

          </div>

        </article>

        <article className="smarthealth-my-appointments-stat">

          <div className="smarthealth-my-appointments-stat-icon completed">

            ✓

          </div>

          <div>

            <span>Completed</span>

            <strong>{counts.completed}</strong>

          </div>

        </article>

        <article className="smarthealth-my-appointments-stat">

          <div className="smarthealth-my-appointments-stat-icon cancelled">

            ×

          </div>

          <div>

            <span>Cancelled</span>

            <strong>{counts.cancelled}</strong>

          </div>

        </article>

      </section>

      {/* FILTERS */}

      <section className="smarthealth-my-appointments-filters">

        <div className="smarthealth-my-appointments-search">

          <label htmlFor="my-appointments-search">Search appointments</label>

          <input

            id="my-appointments-search"

            type="search"

            placeholder="Search doctor, symptoms, or appointment ID"

            value={searchTerm}

            onChange={(event) => setSearchTerm(event.target.value)}

          />

        </div>

        <div className="smarthealth-my-appointments-filter">

          <label htmlFor="my-appointments-status">Status</label>

          <select

            id="my-appointments-status"

            value={statusFilter}

            onChange={(event) => setStatusFilter(event.target.value)}

          >

            <option value="all">All statuses</option>

            <option value="scheduled">Scheduled</option>

            <option value="completed">Completed</option>

            <option value="cancelled">Cancelled</option>

            <option value="no-show">No-show</option>

          </select>

        </div>

        <div className="smarthealth-my-appointments-filter">

          <label htmlFor="my-appointments-date">Date</label>

          <select

            id="my-appointments-date"

            value={dateFilter}

            onChange={(event) => setDateFilter(event.target.value)}

          >

            <option value="all">All dates</option>

            <option value="upcoming">Upcoming</option>

            <option value="past">Past appointments</option>

          </select>

        </div>

        <button

          type="button"

          className="smarthealth-my-appointments-clear"

          onClick={clearFilters}

        >

          Clear filters

        </button>

      </section>

      {/* APPOINTMENT LIST */}
      <section className="smarthealth-my-appointments-list-section">
        {loading ? (
          <div className="smarthealth-my-appointments-state">
            <div className="smarthealth-my-appointments-spinner" />
            <h3>Loading appointments</h3>
            <p>Please wait while we retrieve your appointments.</p>
          </div>
        ) : loadError ? (
          <div className="smarthealth-my-appointments-state">
            <div className="smarthealth-my-appointments-state-icon error">!</div>
            <h3>Unable to load appointments</h3>
            <p>
              We couldn't retrieve your appointments. Please check your connection
              and try again.
            </p>
            <button
              type="button"
              className="smarthealth-my-appointments-primary-button"
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              Try again
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="smarthealth-my-appointments-state">
            <div className="smarthealth-my-appointments-state-icon">▦</div>
            <h3>No appointments yet</h3>
            <p>
              You haven't booked any appointments. Once you book an appointment,
              it will appear here.
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="smarthealth-my-appointments-state">
            <div className="smarthealth-my-appointments-state-icon">⌕</div>
            <h3>No matching appointments</h3>
            <p>Try changing your search or filters to find an appointment.</p>
            <button
              type="button"
              className="smarthealth-my-appointments-primary-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <section className="smarthealth-my-appointments-list-section">
              <div className="smarthealth-my-appointments-list-heading">
                <div>
                  <h2>Upcoming Appointments</h2>
                  <p>
                    {filteredAppointments.filter((appointment) =>
                      isUpcoming(appointment, currentTime),
                    ).length}{" "}
                    appointments scheduled for the future
                  </p>
                </div>
              </div>
              {filteredAppointments.some((appointment) =>
                isUpcoming(appointment, currentTime),
              ) ? (
                <div className="smarthealth-my-appointments-list">
                  {filteredAppointments
                    .filter((appointment) => isUpcoming(appointment, currentTime))
                    .map((appointment) => renderAppointmentCard(appointment, true))}
                </div>
              ) : (
                <div className="smarthealth-my-appointments-state">
                  <h3>No upcoming appointments</h3>
                  <p>Future appointments that match your filters will appear here.</p>
                </div>
              )}
            </section>

            <section className="smarthealth-my-appointments-list-section">
              <div className="smarthealth-my-appointments-list-heading">
                <div>
                  <h2>Past &amp; Closed Appointments</h2>
                  <p>
                    {filteredAppointments.filter((appointment) =>
                      isPast(appointment, currentTime),
                    ).length}{" "}
                    previous, completed, cancelled, or missed appointments
                  </p>
                </div>
              </div>
              {filteredAppointments.some((appointment) =>
                isPast(appointment, currentTime),
              ) ? (
                <div className="smarthealth-my-appointments-list">
                  {filteredAppointments
                    .filter((appointment) => isPast(appointment, currentTime))
                    .map((appointment) => renderAppointmentCard(appointment, false))}
                </div>
              ) : (
                <div className="smarthealth-my-appointments-state">
                  <h3>No past or closed appointments</h3>
                  <p>Previous and closed appointments will appear here.</p>
                </div>
              )}
            </section>
          </>
        )}
      </section>

      {/* CANCELLATION CONFIRMATION DIALOG */}

      {appointmentToCancel && (

        <div

          className="smarthealth-my-appointments-modal-overlay"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget && !cancelling) {

              setAppointmentToCancel(null);

            }

          }}

        >

          <section

            className="smarthealth-my-appointments-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="cancel-appointment-title"

          >

            <div className="smarthealth-my-appointments-modal-icon">!</div>

            <h2 id="cancel-appointment-title">Cancel this appointment?</h2>

            <p>

              Are you sure you want to cancel your appointment with{" "}

              <strong>{appointmentToCancel.doctorName || "this doctor"}</strong>{" "}

              on{" "}

              <strong>{formatDate(appointmentToCancel.appointmentDate)}</strong>{" "}

              at{" "}

              <strong>{formatTime(appointmentToCancel.appointmentTime)}</strong>

              ?

            </p>

            <p className="smarthealth-my-appointments-modal-note">

              This action will update the appointment status.

            </p>

            <div className="smarthealth-my-appointments-modal-actions">

              <button

                type="button"

                className="smarthealth-my-appointments-modal-back"

                onClick={() => setAppointmentToCancel(null)}

                disabled={cancelling}

              >

                Keep appointment

              </button>

              <button

                type="button"

                className="smarthealth-my-appointments-modal-confirm"

                onClick={handleCancelAppointment}

                disabled={cancelling}

              >

                {cancelling ? "Cancelling..." : "Yes, cancel"}

              </button>

            </div>

          </section>

        </div>

      )}

    </div>

  );

};

export default MyAppointments;
