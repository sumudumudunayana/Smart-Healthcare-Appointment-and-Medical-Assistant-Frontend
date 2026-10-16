import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import "../../styles/pages/patient/DoctorProfileModal.css";

const SLOT_DURATION_MINUTES = 30;

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeTime = (time) => {
  if (!time) return "";

  // Handles TimeOnly values such as "09:00:00".
  return String(time).slice(0, 5);
};

const toMinutes = (time) => {
  const normalized = normalizeTime(time);
  const [hours, minutes] = normalized.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN;
  }

  return hours * 60 + minutes;
};

const formatTime = (time) => {
  const minutes = toMinutes(time);

  if (!Number.isFinite(minutes)) return time || "Not provided";

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.title ||
  fallback;

const DoctorProfileModal = ({ doctorId, onClose }) => {
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [booking, setBooking] = useState(false);

  const [profileError, setProfileError] = useState(false);

  // Load the selected doctor's profile and weekly schedules.
  useEffect(() => {
    let cancelled = false;

    const loadDoctorDetails = async () => {
      setLoadingProfile(true);
      setProfileError(false);

      try {
        const [doctorResponse, schedulesResponse] = await Promise.all([
          api.get(`/Doctors/${doctorId}`),
          api.get(`/DoctorSchedules/doctor/${doctorId}`),
        ]);

        if (cancelled) return;

        const doctorData = doctorResponse.data;
        const schedulesData = schedulesResponse.data;

        if (!doctorData || !Array.isArray(schedulesData)) {
          throw new Error("Unexpected doctor profile response.");
        }

        setDoctor(doctorData);
        setSchedules(schedulesData);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load doctor profile:", error);
        setProfileError(true);
        toast.error(
          getErrorMessage(error, "Unable to load the doctor profile."),
        );
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    loadDoctorDetails();

    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  // Load appointments for the selected date.
  const fetchAppointments = useCallback(async () => {
    if (!doctorId || !selectedDate) return;

    setLoadingAppointments(true);

    try {
      const response = await api.get(
        `/Appointments/doctor/${doctorId}/date/${selectedDate}`,
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected appointment response.");
      }

      setAppointments(response.data);
    } catch (error) {
      console.error("Failed to load existing appointments:", error);
      setAppointments([]);
      toast.error(
        getErrorMessage(
          error,
          "Unable to check appointment availability.",
        ),
      );
    } finally {
      setLoadingAppointments(false);
    }
  }, [doctorId, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset the selected time when the patient changes the date.
  useEffect(() => {
    setSelectedScheduleId("");
    setSelectedTime("");
  }, [selectedDate]);

  // Close the modal using the Escape key.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !booking) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, booking]);

  const today = getLocalDateString();

  // Determine the weekday from the selected local calendar date.
  const selectedWeekday = useMemo(() => {
    if (!selectedDate) return "";

    return new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
      "en-US",
      { weekday: "long" },
    );
  }, [selectedDate]);

  // Only schedules marked Available are displayed for booking.
  const availableSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          String(schedule.availabilityStatus || "")
            .trim()
            .toLowerCase() === "available" &&
          String(schedule.dayOfWeek || "").toLowerCase() ===
            selectedWeekday.toLowerCase(),
      ),
    [schedules, selectedWeekday],
  );

  // Treat every non-cancelled appointment as occupying its time.
  const bookedTimes = useMemo(() => {
    return new Set(
      appointments
        .filter(
          (appointment) =>
            String(appointment.status || "").toLowerCase() !==
            "cancelled",
        )
        .map((appointment) => normalizeTime(appointment.appointmentTime)),
    );
  }, [appointments]);

  // Generate 30-minute slots within each available schedule.
  const timeSlots = useMemo(() => {
    const slots = [];
    const now = new Date();
    const isToday = selectedDate === today;

    availableSchedules.forEach((schedule) => {
      const start = toMinutes(schedule.startTime);
      const end = toMinutes(schedule.endTime);

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
      ) {
        return;
      }

      for (
        let minutes = start;
        minutes + SLOT_DURATION_MINUTES <= end;
        minutes += SLOT_DURATION_MINUTES
      ) {
        const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
        const mins = String(minutes % 60).padStart(2, "0");
        const time = `${hours}:${mins}`;

        // Do not offer a time that has already passed today.
        if (isToday) {
          const slotDate = new Date(selectedDate + "T" + time + ":00");

          if (slotDate <= now) continue;
        }

        slots.push({
          scheduleId: schedule.scheduleId,
          time,
          label: formatTime(time),
          booked: bookedTimes.has(time),
        });
      }
    });

    // Multiple schedules can theoretically produce the same time.
    // Keep one entry per time, preserving the first matching schedule.
    const uniqueSlots = new Map();

    slots.forEach((slot) => {
      const existing = uniqueSlots.get(slot.time);

      if (!existing || slot.booked) {
        uniqueSlots.set(slot.time, slot);
      }
    });

    return Array.from(uniqueSlots.values()).sort((a, b) =>
      a.time.localeCompare(b.time),
    );
  }, [availableSchedules, bookedTimes, selectedDate, today]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleSelectSlot = (slot) => {
    if (slot.booked || loadingAppointments || booking) return;

    setSelectedScheduleId(slot.scheduleId);
    setSelectedTime(slot.time);
  };

  const handleBooking = async (event) => {
    event.preventDefault();

    if (!selectedScheduleId || !selectedTime) {
      toast.error("Please select an available appointment time.");
      return;
    }

    if (selectedDate < today) {
      toast.error("You cannot book an appointment in the past.");
      return;
    }

    if (bookedTimes.has(selectedTime)) {
      toast.error(
        "This time is already booked. Please choose another time.",
      );
      await fetchAppointments();
      setSelectedTime("");
      setSelectedScheduleId("");
      return;
    }

    setBooking(true);

    try {
      await api.post("/Appointments", {
        doctorId,
        scheduleId: selectedScheduleId,
        appointmentDate: selectedDate,
        appointmentTime: `${selectedTime}:00`,
        symptoms: symptoms.trim() || null,
      });

      toast.success("Appointment booked successfully!");

      setSelectedScheduleId("");
      setSelectedTime("");
      setSymptoms("");

      await fetchAppointments();
    } catch (error) {
      console.error("Appointment booking failed:", error);

      if (error.response?.status === 409) {
        toast.error(
          getErrorMessage(
            error,
            "This appointment time is no longer available. Please choose another time.",
          ),
        );

        await fetchAppointments();
        setSelectedScheduleId("");
        setSelectedTime("");
      } else {
        toast.error(
          getErrorMessage(
            error,
            "Unable to book the appointment. Please try again.",
          ),
        );
      }
    } finally {
      setBooking(false);
    }
  };

  const isActive =
    String(doctor?.status || "").toLowerCase() === "active";

  return (
    <div
      className="smarthealth-doctor-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !booking) {
          onClose();
        }
      }}
    >
      <section
        className="smarthealth-doctor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smarthealth-doctor-modal-title"
      >
        <header className="smarthealth-doctor-modal__header">
          <div>
            <span className="smarthealth-doctor-modal__eyebrow">
              DOCTOR PROFILE
            </span>

            <h2 id="smarthealth-doctor-modal-title">
              {loadingProfile
                ? "Loading doctor..."
                : doctor?.fullName || "Doctor details"}
            </h2>
          </div>

          <button
            type="button"
            className="smarthealth-doctor-modal__close"
            onClick={onClose}
            disabled={booking}
            aria-label="Close doctor profile"
          >
            ×
          </button>
        </header>

        <div className="smarthealth-doctor-modal__body">
          {loadingProfile && (
            <div
              className="smarthealth-doctor-modal__state"
              role="status"
            >
              <span className="smarthealth-doctor-modal__spinner" />
              Loading doctor details...
            </div>
          )}

          {!loadingProfile && profileError && (
            <div className="smarthealth-doctor-modal__state">
              <h3>Unable to load profile</h3>
              <p>Please close this window and try again.</p>
            </div>
          )}

          {!loadingProfile && !profileError && doctor && (
            <>
              <section className="smarthealth-doctor-modal__profile">
                <div className="smarthealth-doctor-modal__avatar">
                  {doctor.fullName?.trim()?.charAt(0)?.toUpperCase() ||
                    "D"}
                </div>

                <div className="smarthealth-doctor-modal__profile-info">
                  <div className="smarthealth-doctor-modal__name-row">
                    <h3>{doctor.fullName}</h3>

                    <span
                      className={`smarthealth-doctor-modal__status ${
                        isActive
                          ? "smarthealth-doctor-modal__status--active"
                          : "smarthealth-doctor-modal__status--inactive"
                      }`}
                    >
                      {doctor.status || "Unknown"}
                    </span>
                  </div>

                  <p className="smarthealth-doctor-modal__specialization">
                    {doctor.specialization || "Specialization not provided"}
                  </p>

                  <p>
                    {doctor.department || "Department not assigned"}
                  </p>
                </div>
              </section>

              <section className="smarthealth-doctor-modal__details">
                <h3>Professional information</h3>

                <div className="smarthealth-doctor-modal__details-grid">
                  <div>
                    <span>Email</span>
                    <strong>{doctor.email || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{doctor.phone || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Experience</span>
                    <strong>
                      {doctor.experience ?? 0}{" "}
                      {doctor.experience === 1 ? "year" : "years"}
                    </strong>
                  </div>

                  <div>
                    <span>License number</span>
                    <strong>
                      {doctor.licenseNumber || "Not provided"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="smarthealth-doctor-modal__booking">
                <div className="smarthealth-doctor-modal__booking-heading">
                  <div>
                    <h3>Book an appointment</h3>
                    <p>Select a date and an available time.</p>
                  </div>
                </div>

                {!isActive && (
                  <p className="smarthealth-doctor-modal__notice">
                    This doctor is not currently marked as active.
                    Booking is disabled.
                  </p>
                )}

                <div className="smarthealth-doctor-modal__date-field">
                  <label htmlFor="smarthealth-doctor-modal-date">
                    Appointment date
                  </label>

                  <input
                    id="smarthealth-doctor-modal-date"
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={booking}
                  />

                  <span>{formatDate(selectedDate)}</span>
                </div>

                <div className="smarthealth-doctor-modal__slot-heading">
                  <h4>Available times</h4>

                  {loadingAppointments && (
                    <span>Checking availability...</span>
                  )}
                </div>

                {!loadingAppointments &&
                  availableSchedules.length === 0 && (
                    <div className="smarthealth-doctor-modal__empty">
                      <strong>No available schedule</strong>
                      <p>
                        This doctor has no available schedule for{" "}
                        {selectedWeekday || "the selected day"}.
                        Try another date.
                      </p>
                    </div>
                  )}

                {!loadingAppointments &&
                  availableSchedules.length > 0 &&
                  timeSlots.length === 0 && (
                    <div className="smarthealth-doctor-modal__empty">
                      <strong>No bookable times</strong>
                      <p>
                        No future appointment times are available for
                        this date.
                      </p>
                    </div>
                  )}

                <div className="smarthealth-doctor-modal__slots">
                  {timeSlots.map((slot) => {
                    const selected =
                      selectedScheduleId === slot.scheduleId &&
                      selectedTime === slot.time;

                    return (
                      <button
                        key={`${slot.scheduleId}-${slot.time}`}
                        type="button"
                        className={`smarthealth-doctor-modal__slot ${
                          selected
                            ? "smarthealth-doctor-modal__slot--selected"
                            : ""
                        } ${
                          slot.booked
                            ? "smarthealth-doctor-modal__slot--booked"
                            : ""
                        }`}
                        disabled={
                          slot.booked ||
                          loadingAppointments ||
                          booking ||
                          !isActive
                        }
                        onClick={() => handleSelectSlot(slot)}
                        aria-pressed={selected}
                        title={
                          slot.booked ? "Already booked" : "Select time"
                        }
                      >
                        <span>{slot.label}</span>
                        {slot.booked && (
                          <small>Booked</small>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="smarthealth-doctor-modal__legend">
                  <span>
                    <i className="smarthealth-doctor-modal__legend-dot smarthealth-doctor-modal__legend-dot--available" />
                    Available
                  </span>

                  <span>
                    <i className="smarthealth-doctor-modal__legend-dot smarthealth-doctor-modal__legend-dot--booked" />
                    Booked
                  </span>

                  <span>
                    <i className="smarthealth-doctor-modal__legend-dot smarthealth-doctor-modal__legend-dot--selected" />
                    Selected
                  </span>
                </div>

                <form onSubmit={handleBooking}>
                  <div className="smarthealth-doctor-modal__symptoms-field">
                    <label htmlFor="smarthealth-doctor-modal-symptoms">
                      Symptoms or reason for visit{" "}
                      <span>(optional)</span>
                    </label>

                    <textarea
                      id="smarthealth-doctor-modal-symptoms"
                      rows="3"
                      maxLength="2000"
                      placeholder="Briefly describe your symptoms..."
                      value={symptoms}
                      onChange={(event) =>
                        setSymptoms(event.target.value)
                      }
                      disabled={booking || !isActive}
                    />
                  </div>

                  {selectedTime && (
                    <div className="smarthealth-doctor-modal__selection">
                      <span>Selected appointment</span>
                      <strong>
                        {formatDate(selectedDate)} ·{" "}
                        {formatTime(selectedTime)}
                      </strong>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="smarthealth-doctor-modal__book-button"
                    disabled={
                      booking ||
                      loadingProfile ||
                      loadingAppointments ||
                      !isActive ||
                      !selectedScheduleId ||
                      !selectedTime
                    }
                  >
                    {booking ? "Booking appointment..." : "Book appointment"}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DoctorProfileModal;