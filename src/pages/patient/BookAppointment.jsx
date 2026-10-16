import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import "../../styles/pages/patient/BookAppointment.css";

const SLOT_DURATION_MINUTES = 30;

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeTime = (time) => {
  if (!time) return "";

  // Handles values such as "09:30:00" and "09:30".
  return String(time).slice(0, 5);
};

const timeToMinutes = (time) => {
  const normalized = normalizeTime(time);
  const [hours, minutes] = normalized.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const remainingMinutes = String(minutes % 60).padStart(2, "0");

  return `${hours}:${remainingMinutes}`;
};

const formatTime = (time) => {
  const minutes = timeToMinutes(time);

  if (minutes === null) return time || "";

  const date = new Date();
  date.setHours(
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  // Noon avoids date changes caused by UTC conversion.
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getWeekday = (dateString) => {
  if (!dateString) return "";

  return new Date(`${dateString}T12:00:00`)
    .toLocaleDateString("en-US", { weekday: "long" });
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    fallback
  );
};

const isActiveDoctor = (doctor) =>
  String(doctor?.status ?? "").toLowerCase() === "active";

const isAvailableSchedule = (schedule) =>
  String(schedule?.availabilityStatus ?? "").toLowerCase() ===
  "available";

const BookAppointment = () => {
  const [searchParams] = useSearchParams();

  const initialDoctorId = searchParams.get("doctorId") || "";

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] =
    useState(initialDoctorId);

  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState(false);

  const [appointmentDate, setAppointmentDate] =
    useState(getLocalDateString());

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] =
    useState(false);
  const [appointmentsError, setAppointmentsError] =
    useState(false);
  const [availabilityReloadKey, setAvailabilityReloadKey] =
    useState(0);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const selectedDoctor = useMemo(
    () =>
      doctors.find(
        (doctor) => doctor.doctorId === selectedDoctorId
      ) || null,
    [doctors, selectedDoctorId]
  );

  const filteredDoctors = useMemo(() => {
    const search = doctorSearch.trim().toLowerCase();

    if (!search) return doctors;

    return doctors.filter((doctor) => {
      const searchableText = [
        doctor.fullName,
        doctor.specialization,
        doctor.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [doctors, doctorSearch]);

  // ---------------------------------------------------------
  // LOAD DOCTORS
  // ---------------------------------------------------------

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    setDoctorsError(false);

    try {
      const response = await api.get("/Doctors");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setDoctors(data);

      // Keep the requested doctor selected only if it exists.
      if (
        initialDoctorId &&
        data.some(
          (doctor) => doctor.doctorId === initialDoctorId
        )
      ) {
        setSelectedDoctorId(initialDoctorId);
      }
    } catch (error) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
      setDoctorsError(true);

      toast.error(
        getErrorMessage(error, "Unable to load doctors.")
      );
    } finally {
      setDoctorsLoading(false);
    }
  }, [initialDoctorId]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // ---------------------------------------------------------
  // LOAD SELECTED DOCTOR'S SCHEDULES
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadSchedules = async () => {
      setSchedules([]);
      setSchedulesError(false);
      setSchedulesLoading(false);
      setSelectedSlot(null);
      setBookingResult(null);

      if (!selectedDoctorId) return;

      setSchedulesLoading(true);

      try {
        const response = await api.get(
          `/DoctorSchedules/doctor/${selectedDoctorId}`
        );

        if (cancelled) return;

        setSchedules(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load doctor schedules:", error);
        setSchedules([]);
        setSchedulesError(true);

        toast.error(
          getErrorMessage(
            error,
            "Unable to load this doctor's schedules."
          )
        );
      } finally {
        if (!cancelled) {
          setSchedulesLoading(false);
        }
      }
    };

    loadSchedules();

    return () => {
      cancelled = true;
    };
  }, [selectedDoctorId]);

  // ---------------------------------------------------------
  // LOAD APPOINTMENTS FOR THE SELECTED DATE
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      setAppointments([]);
      setAppointmentsError(false);
      setAppointmentsLoading(false);
      setSelectedSlot(null);

      if (!selectedDoctorId || !appointmentDate) return;

      setAppointmentsLoading(true);

      try {
        const response = await api.get(
          `/Appointments/doctor/${selectedDoctorId}/date/${appointmentDate}`
        );

        if (cancelled) return;

        setAppointments(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load appointment availability:",
          error
        );

        setAppointments([]);
        setAppointmentsError(true);

        toast.error(
          getErrorMessage(
            error,
            "Could not check appointment availability. Please retry."
          )
        );
      } finally {
        if (!cancelled) {
          setAppointmentsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDoctorId,
    appointmentDate,
    availabilityReloadKey,
  ]);

  // ---------------------------------------------------------
  // GENERATE AVAILABLE 30-MINUTE SLOTS
  // ---------------------------------------------------------

  const availableSlots = useMemo(() => {
    if (
      !selectedDoctorId ||
      !appointmentDate ||
      schedulesLoading ||
      schedulesError ||
      appointmentsLoading ||
      appointmentsError
    ) {
      return [];
    }

    const selectedWeekday = getWeekday(appointmentDate);
    const today = getLocalDateString();

    const currentDate = new Date();
    const currentMinutes =
      currentDate.getHours() * 60 + currentDate.getMinutes();

    const bookedTimes = new Set(
      appointments
        .filter(
          (appointment) =>
            String(appointment.status ?? "").toLowerCase() !==
            "cancelled"
        )
        .map((appointment) =>
          normalizeTime(appointment.appointmentTime)
        )
    );

    const slots = [];

    schedules
      .filter(
        (schedule) =>
          schedule.doctorId === selectedDoctorId &&
          isAvailableSchedule(schedule) &&
          String(schedule.dayOfWeek).toLowerCase() ===
            selectedWeekday.toLowerCase()
      )
      .forEach((schedule) => {
        const startMinutes = timeToMinutes(schedule.startTime);
        const endMinutes = timeToMinutes(schedule.endTime);

        if (
          startMinutes === null ||
          endMinutes === null ||
          endMinutes <= startMinutes
        ) {
          return;
        }

        for (
          let minutes = startMinutes;
          minutes + SLOT_DURATION_MINUTES <= endMinutes;
          minutes += SLOT_DURATION_MINUTES
        ) {
          const time = minutesToTime(minutes);

          // Do not offer times that have already passed today.
          if (
            appointmentDate === today &&
            minutes <= currentMinutes
          ) {
            continue;
          }

          // The backend prevents a doctor from having two
          // appointments at the same date and time.
          if (bookedTimes.has(time)) {
            continue;
          }

          slots.push({
            scheduleId: schedule.scheduleId,
            time,
          });
        }
      });

    return slots.sort((a, b) => {
      const timeDifference =
        timeToMinutes(a.time) - timeToMinutes(b.time);

      if (timeDifference !== 0) return timeDifference;

      return a.scheduleId.localeCompare(b.scheduleId);
    });
  }, [
    selectedDoctorId,
    appointmentDate,
    schedules,
    schedulesLoading,
    schedulesError,
    appointments,
    appointmentsLoading,
    appointmentsError,
  ]);

  // ---------------------------------------------------------
  // HANDLE DOCTOR CHANGE
  // ---------------------------------------------------------

  const handleDoctorChange = (event) => {
    setSelectedDoctorId(event.target.value);
    setSelectedSlot(null);
    setBookingResult(null);
  };

  // ---------------------------------------------------------
  // HANDLE DATE CHANGE
  // ---------------------------------------------------------

  const handleDateChange = (event) => {
    setAppointmentDate(event.target.value);
    setSelectedSlot(null);
    setBookingResult(null);
  };

  // ---------------------------------------------------------
  // REFRESH AVAILABILITY
  // ---------------------------------------------------------

  const retryAvailability = () => {
    setAvailabilityReloadKey((previous) => previous + 1);
  };

  // ---------------------------------------------------------
  // BOOK APPOINTMENT
  // ---------------------------------------------------------

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    if (!selectedDoctor) {
      toast.error("Please select a doctor.");
      return;
    }

    if (!isActiveDoctor(selectedDoctor)) {
      toast.error(
        "This doctor is not currently active. Please select another doctor."
      );
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select an available time slot.");
      return;
    }

    if (appointmentDate < getLocalDateString()) {
      toast.error("Please select today or a future date.");
      return;
    }

    if (
      schedulesLoading ||
      schedulesError ||
      appointmentsLoading ||
      appointmentsError
    ) {
      toast.error(
        "Availability could not be confirmed. Please retry before booking."
      );
      return;
    }

    // Confirm the selected slot still exists in the latest
    // availability calculated by this component.
    const slotStillAvailable = availableSlots.some(
      (slot) =>
        slot.scheduleId === selectedSlot.scheduleId &&
        slot.time === selectedSlot.time
    );

    if (!slotStillAvailable) {
      toast.error(
        "This time slot is no longer available. Please select another time."
      );

      setSelectedSlot(null);
      retryAvailability();
      return;
    }

    setBooking(true);
    setBookingResult(null);

    try {
      const request = {
        doctorId: selectedDoctor.doctorId,
        scheduleId: selectedSlot.scheduleId,
        appointmentDate,
        appointmentTime: `${selectedSlot.time}:00`,
        symptoms: symptoms.trim() || null,
      };

      const response = await api.post(
        "/Appointments",
        request
      );

      setBookingResult(response.data);
      setSelectedSlot(null);
      setSymptoms("");

      toast.success("Appointment booked successfully!");

      // Refresh availability so the newly booked slot is removed.
      retryAvailability();
    } catch (error) {
      console.error("Failed to book appointment:", error);

      const status = error?.response?.status;

      if (status === 409) {
        toast.error(
          getErrorMessage(
            error,
            "This time slot has already been booked. Please select another."
          )
        );

        setSelectedSlot(null);
        retryAvailability();
      } else {
        toast.error(
          getErrorMessage(
            error,
            "Unable to book the appointment. Please try again."
          )
        );
      }
    } finally {
      setBooking(false);
    }
  };

  const availabilityLoading =
    schedulesLoading || appointmentsLoading;

  const availabilityFailed =
    schedulesError || appointmentsError;

  return (
    <div className="smarthealth-book-appointment">
      <header className="smarthealth-book-appointment-header">
        <div>
          <p className="smarthealth-book-appointment-eyebrow">
            PATIENT PORTAL
          </p>

          <h1>Book an Appointment</h1>

          <p className="smarthealth-book-appointment-subtitle">
            Choose a doctor, select a convenient time, and
            confirm your appointment.
          </p>
        </div>
      </header>

      {bookingResult && (
        <section
          className="smarthealth-book-appointment-confirmation"
          aria-live="polite"
        >
          <div className="smarthealth-book-appointment-confirmation-icon">
            ✓
          </div>

          <div>
            <h2>Appointment booked successfully</h2>

            <p>
              Your appointment with{" "}
              <strong>
                {bookingResult.doctorName ||
                  selectedDoctor?.fullName ||
                  "your selected doctor"}
              </strong>{" "}
              has been submitted.
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {formatDate(
                bookingResult.appointmentDate || appointmentDate
              )}
            </p>

            <p>
              <strong>Time:</strong>{" "}
              {formatTime(
                bookingResult.appointmentTime ||
                  selectedSlot?.time ||
                  ""
              )}
            </p>

            {bookingResult.appointmentId && (
              <p className="smarthealth-book-appointment-confirmation-id">
                Appointment ID: {bookingResult.appointmentId}
              </p>
            )}
          </div>
        </section>
      )}

      <form
        className="smarthealth-book-appointment-form"
        onSubmit={handleBookAppointment}
      >
        {/* STEP 1: SELECT DOCTOR */}
        <section className="smarthealth-book-appointment-card">
          <div className="smarthealth-book-appointment-section-heading">
            <span className="smarthealth-book-appointment-step">
              1
            </span>

            <div>
              <h2>Select a Doctor</h2>
              <p>Choose the doctor you want to consult.</p>
            </div>
          </div>

          <div className="smarthealth-book-appointment-field">
            <label htmlFor="book-appointment-search">
              Search doctors
            </label>

            <input
              id="book-appointment-search"
              type="search"
              placeholder="Search by name, specialization or department"
              value={doctorSearch}
              onChange={(event) =>
                setDoctorSearch(event.target.value)
              }
            />
          </div>

          <div className="smarthealth-book-appointment-field">
            <label htmlFor="book-appointment-doctor">
              Doctor <span>*</span>
            </label>

            {doctorsLoading ? (
              <p className="smarthealth-book-appointment-message">
                Loading doctors...
              </p>
            ) : doctorsError ? (
              <div className="smarthealth-book-appointment-error">
                <p>Doctors could not be loaded.</p>

                <button
                  type="button"
                  className="smarthealth-book-appointment-text-button"
                  onClick={loadDoctors}
                >
                  Try again
                </button>
              </div>
            ) : (
              <select
                id="book-appointment-doctor"
                value={selectedDoctorId}
                onChange={handleDoctorChange}
                required
              >
                <option value="">Select a doctor</option>

                {filteredDoctors.map((doctor) => (
                  <option
                    key={doctor.doctorId}
                    value={doctor.doctorId}
                    disabled={!isActiveDoctor(doctor)}
                  >
                    Dr. {doctor.fullName}
                    {doctor.specialization
                      ? ` — ${doctor.specialization}`
                      : ""}
                    {!isActiveDoctor(doctor)
                      ? " (Inactive)"
                      : ""}
                  </option>
                ))}
              </select>
            )}

            {!doctorsLoading &&
              !doctorsError &&
              filteredDoctors.length === 0 && (
                <p className="smarthealth-book-appointment-message">
                  No doctors match your search.
                </p>
              )}
          </div>

          {selectedDoctor && (
            <div className="smarthealth-book-appointment-doctor-summary">
              <div className="smarthealth-book-appointment-doctor-avatar">
                {selectedDoctor.fullName?.charAt(0)?.toUpperCase() ||
                  "D"}
              </div>

              <div className="smarthealth-book-appointment-doctor-info">
                <h3>Dr. {selectedDoctor.fullName}</h3>

                <p>
                  {selectedDoctor.specialization ||
                    "General consultation"}
                </p>

                {selectedDoctor.department && (
                  <p>{selectedDoctor.department}</p>
                )}

                {selectedDoctor.experience != null && (
                  <p>
                    {selectedDoctor.experience} years of experience
                  </p>
                )}

                {!isActiveDoctor(selectedDoctor) && (
                  <p className="smarthealth-book-appointment-warning">
                    This doctor is currently inactive.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* STEP 2: SELECT DATE AND TIME */}
        <section className="smarthealth-book-appointment-card">
          <div className="smarthealth-book-appointment-section-heading">
            <span className="smarthealth-book-appointment-step">
              2
            </span>

            <div>
              <h2>Choose Date & Time</h2>
              <p>
                Select a date to view the doctor's available
                appointment slots.
              </p>
            </div>
          </div>

          <div className="smarthealth-book-appointment-field">
            <label htmlFor="book-appointment-date">
              Appointment date <span>*</span>
            </label>

            <input
              id="book-appointment-date"
              type="date"
              min={getLocalDateString()}
              value={appointmentDate}
              onChange={handleDateChange}
              required
            />

            {appointmentDate && (
              <p className="smarthealth-book-appointment-date-description">
                {formatDate(appointmentDate)}
              </p>
            )}
          </div>

          {!selectedDoctorId && (
            <div className="smarthealth-book-appointment-message">
              Select a doctor first to view available time slots.
            </div>
          )}

          {selectedDoctorId && availabilityLoading && (
            <div className="smarthealth-book-appointment-message">
              Checking schedules and appointment availability...
            </div>
          )}

          {selectedDoctorId && availabilityFailed && (
            <div className="smarthealth-book-appointment-error">
              <p>
                Availability could not be confirmed. Time slots
                are hidden until the information can be loaded.
              </p>

              <button
                type="button"
                className="smarthealth-book-appointment-text-button"
                onClick={retryAvailability}
                disabled={availabilityLoading}
              >
                Retry availability check
              </button>
            </div>
          )}

          {selectedDoctorId &&
            !availabilityLoading &&
            !availabilityFailed && (
              <>
                <div className="smarthealth-book-appointment-slots-heading">
                  <h3>Available time slots</h3>

                  <span>
                    {availableSlots.length} available
                  </span>
                </div>

                {availableSlots.length > 0 ? (
                  <div className="smarthealth-book-appointment-slots">
                    {availableSlots.map((slot) => {
                      const isSelected =
                        selectedSlot?.scheduleId ===
                          slot.scheduleId &&
                        selectedSlot?.time === slot.time;

                      return (
                        <button
                          key={`${slot.scheduleId}-${slot.time}`}
                          type="button"
                          className={[
                            "smarthealth-book-appointment-slot",
                            isSelected
                              ? "smarthealth-book-appointment-slot--selected"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setBookingResult(null);
                          }}
                          aria-pressed={isSelected}
                        >
                          {formatTime(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="smarthealth-book-appointment-empty">
                    <h3>No available slots</h3>

                    <p>
                      This doctor has no available slots for the
                      selected date. Try another date.
                    </p>
                  </div>
                )}
              </>
            )}
        </section>

        {/* STEP 3: SYMPTOMS AND CONFIRMATION */}
        <section className="smarthealth-book-appointment-card">
          <div className="smarthealth-book-appointment-section-heading">
            <span className="smarthealth-book-appointment-step">
              3
            </span>

            <div>
              <h2>Appointment Details</h2>
              <p>
                Add any information you would like the doctor to
                know before your visit.
              </p>
            </div>
          </div>

          <div className="smarthealth-book-appointment-field">
            <label htmlFor="book-appointment-symptoms">
              Symptoms or reason for visit{" "}
              <span className="smarthealth-book-appointment-optional">
                (Optional)
              </span>
            </label>

            <textarea
              id="book-appointment-symptoms"
              rows={4}
              maxLength={2000}
              placeholder="Briefly describe your symptoms or reason for the appointment..."
              value={symptoms}
              onChange={(event) =>
                setSymptoms(event.target.value)
              }
            />

            <p className="smarthealth-book-appointment-character-count">
              {symptoms.length}/2000 characters
            </p>
          </div>

          <div className="smarthealth-book-appointment-summary">
            <h3>Booking summary</h3>

            <div>
              <span>Doctor</span>
              <strong>
                {selectedDoctor
                  ? `Dr. ${selectedDoctor.fullName}`
                  : "Not selected"}
              </strong>
            </div>

            <div>
              <span>Date</span>
              <strong>
                {appointmentDate
                  ? formatDate(appointmentDate)
                  : "Not selected"}
              </strong>
            </div>

            <div>
              <span>Time</span>
              <strong>
                {selectedSlot
                  ? formatTime(selectedSlot.time)
                  : "Not selected"}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            className="smarthealth-book-appointment-submit"
            disabled={
              booking ||
              doctorsLoading ||
              doctorsError ||
              !selectedDoctor ||
              !isActiveDoctor(selectedDoctor) ||
              !selectedSlot ||
              availabilityLoading ||
              availabilityFailed
            }
          >
            {booking
              ? "Booking appointment..."
              : "Confirm Appointment"}
          </button>

          <p className="smarthealth-book-appointment-disclaimer">
            Your appointment will be submitted to the healthcare
            system. Please check the selected doctor, date, and time
            before confirming.
          </p>
        </section>
      </form>
    </div>
  );
};

export default BookAppointment;