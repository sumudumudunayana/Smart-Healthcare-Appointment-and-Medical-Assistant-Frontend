import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import patientService from "../../services/patientService";
import doctorService from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";

import "../../styles/pages/receptionist/ReceptionistCreateAppointment.css";

const SLOT_DURATION_MINUTES = 30;

const EMPTY_BOOKING = {
  patientId: "",
  doctorId: "",
  scheduleId: "",
  appointmentDate: "",
  appointmentTime: "",
  symptoms: "",
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.title ||
  fallback;

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
};

const formatDate = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    remainingMinutes,
  ).padStart(2, "0")}:00`;
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const ReceptionistCreateAppointment = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);

  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [booking, setBooking] = useState(EMPTY_BOOKING);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);

    try {
      const data = await patientService.getAll();

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load patients."),
      );
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setLoadingDoctors(true);

    try {
      const data = await doctorService.getAll();

      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load doctors."),
      );
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, [loadPatients, loadDoctors]);

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    return patients.filter((patient) => {
      const isActive =
        patient.status?.toLowerCase() === "active";

      const matchesSearch = [
        patient.fullName,
        patient.email,
        patient.phone,
      ].some((value) =>
        value?.toLowerCase().includes(term),
      );

      return isActive && matchesSearch;
    });
  }, [patients, patientSearch]);

  const filteredDoctors = useMemo(() => {
    const term = doctorSearch.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const isActive =
        doctor.status?.toLowerCase() === "active";

      const matchesSearch = [
        doctor.fullName,
        doctor.specialization,
        doctor.department,
        doctor.email,
      ].some((value) =>
        value?.toLowerCase().includes(term),
      );

      return isActive && matchesSearch;
    });
  }, [doctors, doctorSearch]);

  const loadSchedules = async (doctorId) => {
    setLoadingSchedules(true);

    setSchedules([]);
    setBookedAppointments([]);

    try {
      const response = await import("../../services/api").then(
        ({ default: api }) =>
          api.get(`/DoctorSchedules/doctor/${doctorId}`),
      );

      setSchedules(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to load doctor schedules."),
      );
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);

    setBooking((previous) => ({
      ...previous,
      patientId: patient.patientId,
    }));
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);

    setBooking((previous) => ({
      ...previous,
      doctorId: doctor.doctorId,
      scheduleId: "",
      appointmentDate: "",
      appointmentTime: "",
    }));

    setBookedAppointments([]);

    await loadSchedules(doctor.doctorId);
  };

  const selectedSchedule = schedules.find(
    (schedule) =>
      schedule.scheduleId === booking.scheduleId,
  );

  const loadBookedAppointments = async (doctorId, date) => {
    setLoadingAppointments(true);

    try {
      const data =
        await appointmentService.getDoctorAppointmentsByDate(
          doctorId,
          date,
        );

      setBookedAppointments(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      setBookedAppointments([]);

      toast.error(
        getErrorMessage(
          error,
          "Unable to check booked appointment times.",
        ),
      );
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleDateChange = async (date) => {
    setBooking((previous) => ({
      ...previous,
      appointmentDate: date,
      appointmentTime: "",
    }));

    setBookedAppointments([]);

    if (date && selectedDoctor) {
      await loadBookedAppointments(
        selectedDoctor.doctorId,
        date,
      );
    }
  };

  const availableSlots = useMemo(() => {
    if (!selectedSchedule || !booking.appointmentDate) {
      return [];
    }

    const start = timeToMinutes(selectedSchedule.startTime);
    const end = timeToMinutes(selectedSchedule.endTime);

    const bookedTimes = new Set(
      bookedAppointments
        .filter(
          (appointment) =>
            appointment.status?.toLowerCase() !== "cancelled",
        )
        .map((appointment) =>
          String(appointment.appointmentTime).slice(0, 8),
        ),
    );

    const slots = [];

    const now = new Date();
    const today = getLocalDateString(now);

    for (
      let time = start;
      time + SLOT_DURATION_MINUTES <= end;
      time += SLOT_DURATION_MINUTES
    ) {
      const timeString = minutesToTime(time);

      const isPast =
        booking.appointmentDate === today &&
        time <= now.getHours() * 60 + now.getMinutes();

      slots.push({
        time: timeString,
        booked: bookedTimes.has(timeString),
        past: isPast,
      });
    }

    return slots;
  }, [
    selectedSchedule,
    booking.appointmentDate,
    bookedAppointments,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPatient || !selectedDoctor) {
      toast.error("Please select a patient and a doctor.");
      return;
    }

    if (
      !booking.scheduleId ||
      !booking.appointmentDate ||
      !booking.appointmentTime
    ) {
      toast.error(
        "Please select a schedule, date, and appointment time.",
      );
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.time === booking.appointmentTime,
    );

    if (!selectedSlot || selectedSlot.booked || selectedSlot.past) {
      toast.error(
        "This appointment time is no longer available.",
      );
      return;
    }

    setSaving(true);

    try {
      const created =
        await appointmentService.createForReceptionist({
          patientId: booking.patientId,
          doctorId: booking.doctorId,
          scheduleId: booking.scheduleId,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          symptoms: booking.symptoms.trim() || null,
        });

      toast.success(
        `Appointment booked successfully for ${created.patientName}.`,
      );

      setBooking(EMPTY_BOOKING);
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setSchedules([]);
      setBookedAppointments([]);
      setPatientSearch("");
      setDoctorSearch("");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to create the appointment.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const minimumDate = getLocalDateString();

  const maximumDate = (() => {
    const date = new Date();

    date.setFullYear(date.getFullYear() + 1);

    return getLocalDateString(date);
  })();

  const availableDates = useMemo(() => {
    if (!selectedSchedule) return [];

    const results = [];
    const start = new Date(`${minimumDate}T00:00:00`);
    const end = new Date(`${maximumDate}T00:00:00`);

    for (
      const date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      if (
        date.toLocaleDateString("en-US", {
          weekday: "long",
        }).toLowerCase() ===
        selectedSchedule.dayOfWeek?.toLowerCase()
      ) {
        results.push(getLocalDateString(date));
      }
    }

    return results;
  }, [selectedSchedule, minimumDate, maximumDate]);

  return (
    <main className="smarthealth-receptionist-booking">
      <header className="smarthealth-receptionist-booking__header">
        <div>
          <span className="smarthealth-receptionist-booking__eyebrow">
            Reception desk
          </span>

          <h1>Book an Appointment</h1>

          <p>
            Select a patient, choose a doctor, and reserve an
            available appointment slot.
          </p>
        </div>
      </header>

      <form
        className="smarthealth-receptionist-booking__form"
        onSubmit={handleSubmit}
      >
        <section className="smarthealth-receptionist-booking__section">
          <div className="smarthealth-receptionist-booking__section-heading">
            <span>01</span>

            <div>
              <h2>Select patient</h2>
              <p>Choose an active registered patient.</p>
            </div>
          </div>

          <label className="smarthealth-receptionist-booking__field">
            Search patients

            <input
              type="search"
              value={patientSearch}
              onChange={(event) =>
                setPatientSearch(event.target.value)
              }
              placeholder="Search by name, email, or phone"
            />
          </label>

          {selectedPatient && (
            <div className="smarthealth-receptionist-booking__selected">
              <div>
                <strong>{selectedPatient.fullName}</strong>
                <span>{selectedPatient.email}</span>
                <span>{selectedPatient.phone || "No phone number"}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);

                  setBooking((previous) => ({
                    ...previous,
                    patientId: "",
                  }));
                }}
              >
                Change
              </button>
            </div>
          )}

          {!selectedPatient && (
            <div className="smarthealth-receptionist-booking__results">
              {loadingPatients ? (
                <p>Loading patients...</p>
              ) : filteredPatients.length ? (
                filteredPatients.slice(0, 8).map((patient) => (
                  <button
                    className="smarthealth-receptionist-booking__result"
                    type="button"
                    key={patient.patientId}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <span>
                      <strong>{patient.fullName}</strong>
                      <small>{patient.email}</small>
                    </span>

                    <span>{patient.phone || "—"}</span>
                  </button>
                ))
              ) : (
                <p>No active patients found.</p>
              )}
            </div>
          )}
        </section>

        <section className="smarthealth-receptionist-booking__section">
          <div className="smarthealth-receptionist-booking__section-heading">
            <span>02</span>

            <div>
              <h2>Select doctor</h2>
              <p>Search for a doctor by name or specialization.</p>
            </div>
          </div>

          <label className="smarthealth-receptionist-booking__field">
            Search doctors

            <input
              type="search"
              value={doctorSearch}
              onChange={(event) =>
                setDoctorSearch(event.target.value)
              }
              placeholder="Doctor name, specialization, or department"
            />
          </label>

          {selectedDoctor && (
            <div className="smarthealth-receptionist-booking__selected">
              <div>
                <strong>{selectedDoctor.fullName}</strong>

                <span>
                  {selectedDoctor.specialization || "Specialization unavailable"}
                </span>

                <span>
                  {selectedDoctor.department || "Department unavailable"}
                </span>

                <span>
                  {selectedDoctor.experience ?? "—"} years of experience
                </span>

                <span>{selectedDoctor.email}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDoctor(null);
                  setSchedules([]);
                  setBookedAppointments([]);

                  setBooking((previous) => ({
                    ...previous,
                    doctorId: "",
                    scheduleId: "",
                    appointmentDate: "",
                    appointmentTime: "",
                  }));
                }}
              >
                Change
              </button>
            </div>
          )}

          {!selectedDoctor && (
            <div className="smarthealth-receptionist-booking__results">
              {loadingDoctors ? (
                <p>Loading doctors...</p>
              ) : filteredDoctors.length ? (
                filteredDoctors.slice(0, 8).map((doctor) => (
                  <button
                    className="smarthealth-receptionist-booking__result"
                    type="button"
                    key={doctor.doctorId}
                    onClick={() => handleSelectDoctor(doctor)}
                  >
                    <span>
                      <strong>{doctor.fullName}</strong>

                      <small>
                        {doctor.specialization || "General"} ·{" "}
                        {doctor.department || "Department not assigned"}
                      </small>
                    </span>

                    <span>Select →</span>
                  </button>
                ))
              ) : (
                <p>No active doctors found.</p>
              )}
            </div>
          )}
        </section>

        <section className="smarthealth-receptionist-booking__section">
          <div className="smarthealth-receptionist-booking__section-heading">
            <span>03</span>

            <div>
              <h2>Schedule and appointment time</h2>
              <p>
                Select a doctor's schedule, date, and available slot.
              </p>
            </div>
          </div>

          {!selectedDoctor ? (
            <p className="smarthealth-receptionist-booking__hint">
              Select a doctor to view available schedules.
            </p>
          ) : loadingSchedules ? (
            <p>Loading schedules...</p>
          ) : (
            <>
              <label className="smarthealth-receptionist-booking__field">
                Doctor schedule

                <select
                  value={booking.scheduleId}
                  onChange={(event) =>
                    setBooking((previous) => ({
                      ...previous,
                      scheduleId: event.target.value,
                      appointmentDate: "",
                      appointmentTime: "",
                    }))
                  }
                  required
                >
                  <option value="">Select a schedule</option>

                  {schedules
                    .filter(
                      (schedule) =>
                        schedule.availabilityStatus?.toLowerCase() ===
                        "available",
                    )
                    .map((schedule) => (
                      <option
                        key={schedule.scheduleId}
                        value={schedule.scheduleId}
                      >
                        {schedule.dayOfWeek} ·{" "}
                        {formatTime(schedule.startTime)} –{" "}
                        {formatTime(schedule.endTime)}
                      </option>
                    ))}
                </select>
              </label>

              {selectedSchedule && (
                <>
                  <label className="smarthealth-receptionist-booking__field">
                    Appointment date

                    <select
                      value={booking.appointmentDate}
                      onChange={(event) =>
                        handleDateChange(event.target.value)
                      }
                      required
                    >
                      <option value="">Select a date</option>

                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {booking.appointmentDate && (
                    <div className="smarthealth-receptionist-booking__slots">
                      <div className="smarthealth-receptionist-booking__slots-heading">
                        <h3>Available time slots</h3>

                        {loadingAppointments && (
                          <span>Checking availability...</span>
                        )}
                      </div>

                      <div className="smarthealth-receptionist-booking__slot-grid">
                        {availableSlots.map((slot) => {
                          const disabled =
                            loadingAppointments ||
                            slot.booked ||
                            slot.past;

                          const selected =
                            booking.appointmentTime === slot.time;

                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={disabled}
                              className={[
                                "smarthealth-receptionist-booking__slot",
                                selected ? "is-selected" : "",
                                slot.booked ? "is-booked" : "",
                                slot.past ? "is-past" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() =>
                                setBooking((previous) => ({
                                  ...previous,
                                  appointmentTime: slot.time,
                                }))
                              }
                            >
                              {formatTime(slot.time)}

                              {slot.booked
                                ? " · Booked"
                                : slot.past
                                  ? " · Past"
                                  : ""}
                            </button>
                          );
                        })}
                      </div>

                      {!loadingAppointments &&
                        availableSlots.every(
                          (slot) => slot.booked || slot.past,
                        ) && (
                          <p>
                            No available slots for this date. Choose another
                            date.
                          </p>
                        )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className="smarthealth-receptionist-booking__section">
          <div className="smarthealth-receptionist-booking__section-heading">
            <span>04</span>

            <div>
              <h2>Appointment details</h2>
              <p>Add optional symptoms before confirming.</p>
            </div>
          </div>

          <label className="smarthealth-receptionist-booking__field">
            Symptoms or reason for visit

            <textarea
              value={booking.symptoms}
              onChange={(event) =>
                setBooking((previous) => ({
                  ...previous,
                  symptoms: event.target.value,
                }))
              }
              placeholder="Enter any symptoms or notes provided by the patient..."
              rows={4}
              maxLength={2000}
            />
          </label>

          <div className="smarthealth-receptionist-booking__summary">
            <h3>Booking summary</h3>

            <div>
              <span>Patient</span>
              <strong>{selectedPatient?.fullName || "Not selected"}</strong>
            </div>

            <div>
              <span>Doctor</span>
              <strong>{selectedDoctor?.fullName || "Not selected"}</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>{formatDate(booking.appointmentDate)}</strong>
            </div>

            <div>
              <span>Time</span>
              <strong>
                {booking.appointmentTime
                  ? formatTime(booking.appointmentTime)
                  : "Not selected"}
              </strong>
            </div>
          </div>
        </section>

        <footer className="smarthealth-receptionist-booking__footer">
          <button
            type="button"
            className="smarthealth-receptionist-booking__cancel"
            disabled={saving}
            onClick={() => {
              setBooking(EMPTY_BOOKING);
              setSelectedPatient(null);
              setSelectedDoctor(null);
              setSchedules([]);
              setBookedAppointments([]);
            }}
          >
            Clear form
          </button>

          <button
            type="submit"
            className="smarthealth-receptionist-booking__submit"
            disabled={saving || loadingAppointments}
          >
            {saving ? "Booking appointment..." : "Confirm appointment"}
          </button>
        </footer>
      </form>
    </main>
  );
};

export default ReceptionistCreateAppointment;