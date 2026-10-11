import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import userService from "../../services/userService";
import doctorService from "../../services/doctorService";
import doctorScheduleService from "../../services/doctorScheduleService";

import "../../styles/pages/doctor/DoctorSchedule.css";

const smarthealthDoctorScheduleDayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const smarthealthDoctorScheduleInitialForm = {
  dayOfWeek: "Monday",
  startTime: "",
  endTime: "",
  availabilityStatus: "Available",
};

const DoctorSchedule = () => {
  const [profile, setProfile] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [scheduleForm, setScheduleForm] = useState(
    smarthealthDoctorScheduleInitialForm,
  );

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);

  // ============================================================
  // LOAD DOCTOR + SCHEDULES
  // ============================================================
  const loadSchedule = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // --------------------------------------------------------
      // Get logged-in user profile
      // --------------------------------------------------------
      const profileData = await userService.getMyProfile();

      setProfile(profileData);

      // --------------------------------------------------------
      // Find the doctor associated with the logged-in user
      // --------------------------------------------------------
      const doctors = await doctorService.getAll();

      const currentDoctor = doctors.find(
        (item) => item.userId === profileData.userId,
      );

      if (!currentDoctor) {
        throw new Error(
          "The logged-in doctor profile could not be found.",
        );
      }

      setDoctor(currentDoctor);

      // --------------------------------------------------------
      // Get doctor's schedules
      // --------------------------------------------------------
      const scheduleData =
        await doctorScheduleService.getByDoctorId(
          currentDoctor.doctorId,
        );

      setSchedules(
        Array.isArray(scheduleData)
          ? scheduleData
          : [],
      );
    } catch (error) {
      console.error(
        "Failed to load doctor schedule:",
        error,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load your schedule.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // ============================================================
  // SORT SCHEDULES
  // ============================================================
  const orderedSchedules = useMemo(() => {
    return [...schedules].sort((first, second) => {
      const firstDay =
        smarthealthDoctorScheduleDayOrder.indexOf(
          first.dayOfWeek,
        );

      const secondDay =
        smarthealthDoctorScheduleDayOrder.indexOf(
          second.dayOfWeek,
        );

      if (firstDay !== secondDay) {
        return firstDay - secondDay;
      }

      return String(first.startTime).localeCompare(
        String(second.startTime),
      );
    });
  }, [schedules]);

  // ============================================================
  // GROUP SCHEDULES BY DAY
  // ============================================================
  const groupedSchedules = useMemo(() => {
    return smarthealthDoctorScheduleDayOrder.map(
      (day) => ({
        day,
        schedules: orderedSchedules.filter(
          (schedule) =>
            schedule.dayOfWeek === day,
        ),
      }),
    );
  }, [orderedSchedules]);

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================
  const availableScheduleCount =
    schedules.filter(
      (schedule) =>
        schedule.availabilityStatus === "Available",
    ).length;

  const unavailableScheduleCount =
    schedules.filter(
      (schedule) =>
        schedule.availabilityStatus === "Unavailable",
    ).length;

  // ============================================================
  // FORMAT TIME
  // ============================================================
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
      hours % 12 === 0
        ? 12
        : hours % 12;

    return `${displayHours}:${minutes} ${suffix}`;
  };

  // ============================================================
  // OPEN CREATE MODAL
  // ============================================================
  const handleOpenCreateModal = () => {
    setEditingSchedule(null);

    setScheduleForm(
      smarthealthDoctorScheduleInitialForm,
    );

    setShowScheduleModal(true);
  };

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================
  const handleOpenEditModal = (schedule) => {
    setEditingSchedule(schedule);

    setScheduleForm({
      dayOfWeek:
        schedule.dayOfWeek || "Monday",

      startTime:
        String(schedule.startTime || "").slice(
          0,
          5,
        ),

      endTime:
        String(schedule.endTime || "").slice(
          0,
          5,
        ),

      availabilityStatus:
        schedule.availabilityStatus ||
        "Available",
    });

    setShowScheduleModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================
  const handleCloseScheduleModal = () => {
    if (savingSchedule) {
      return;
    }

    setShowScheduleModal(false);
    setEditingSchedule(null);

    setScheduleForm(
      smarthealthDoctorScheduleInitialForm,
    );
  };

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================
  const handleScheduleFormChange = (event) => {
    const { name, value } = event.target;

    setScheduleForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE SCHEDULE
  // ============================================================
  const handleSaveSchedule = async (event) => {
    event.preventDefault();

    if (!scheduleForm.dayOfWeek) {
      toast.error(
        "Please select a day of the week.",
      );
      return;
    }

    if (!scheduleForm.startTime) {
      toast.error(
        "Please select a start time.",
      );
      return;
    }

    if (!scheduleForm.endTime) {
      toast.error(
        "Please select an end time.",
      );
      return;
    }

    if (
      scheduleForm.startTime >=
      scheduleForm.endTime
    ) {
      toast.error(
        "Start time must be before end time.",
      );
      return;
    }

    const requestData = {
      dayOfWeek: scheduleForm.dayOfWeek,
      startTime: `${scheduleForm.startTime}:00`,
      endTime: `${scheduleForm.endTime}:00`,
      availabilityStatus:
        scheduleForm.availabilityStatus,
    };

    try {
      setSavingSchedule(true);

      if (editingSchedule) {
        await doctorScheduleService.update(
          editingSchedule.scheduleId,
          requestData,
        );

        toast.success(
          "Schedule updated successfully.",
        );
      } else {
        await doctorScheduleService.create(
          requestData,
        );

        toast.success(
          "Schedule created successfully.",
        );
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);

      setScheduleForm(
        smarthealthDoctorScheduleInitialForm,
      );

      await loadSchedule(true);
    } catch (error) {
      console.error(
        "Failed to save doctor schedule:",
        error,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save the schedule.",
      );
    } finally {
      setSavingSchedule(false);
    }
  };

  // ============================================================
  // DELETE SCHEDULE
  // ============================================================
  const handleDeleteSchedule = async (schedule) => {
    const confirmed = window.confirm(
      `Delete the ${schedule.dayOfWeek} schedule from ${formatTime(
        schedule.startTime,
      )} to ${formatTime(
        schedule.endTime,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingScheduleId(
        schedule.scheduleId,
      );

      await doctorScheduleService.delete(
        schedule.scheduleId,
      );

      toast.success(
        "Schedule deleted successfully.",
      );

      await loadSchedule(true);
    } catch (error) {
      console.error(
        "Failed to delete doctor schedule:",
        error,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete the schedule.",
      );
    } finally {
      setDeletingScheduleId(null);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="smarthealth-doctor-schedule-page">
        <div className="smarthealth-doctor-schedule-loading">
          <div className="smarthealth-doctor-schedule-spinner"></div>

          <p>
            Loading your schedule...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================
  return (
    <div className="smarthealth-doctor-schedule-page">

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="smarthealth-doctor-schedule-header">
        <div>
          <span className="smarthealth-doctor-schedule-eyebrow">
            DOCTOR PORTAL
          </span>

          <h1 className="smarthealth-doctor-schedule-title">
            My Schedule
          </h1>

          <p className="smarthealth-doctor-schedule-subtitle">
            Create and manage your weekly working
            hours and availability.
          </p>
        </div>

        <div className="smarthealth-doctor-schedule-header-actions">

          <button
            type="button"
            className="smarthealth-doctor-schedule-create-button"
            onClick={handleOpenCreateModal}
          >
            <span className="smarthealth-doctor-schedule-create-icon">
              +
            </span>

            Create Schedule
          </button>

          <button
            type="button"
            className="smarthealth-doctor-schedule-refresh-button"
            onClick={() => loadSchedule(true)}
            disabled={refreshing}
          >
            <span className="smarthealth-doctor-schedule-refresh-icon">
              ↻
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* ======================================================
          DOCTOR INFORMATION
      ======================================================= */}

      <div className="smarthealth-doctor-schedule-doctor-card">
        <div className="smarthealth-doctor-schedule-doctor-avatar">
          {(
            doctor?.fullName ||
            profile?.fullName ||
            "D"
          )
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="smarthealth-doctor-schedule-doctor-info">
          <h2>
            {doctor?.fullName ||
              profile?.fullName ||
              "Doctor"}
          </h2>

          <p>
            {doctor?.specialization ||
              "Medical Professional"}
          </p>

          {doctor?.department && (
            <span>
              {doctor.department}
            </span>
          )}
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="smarthealth-doctor-schedule-summary">

        <div className="smarthealth-doctor-schedule-summary-card">
          <div className="smarthealth-doctor-schedule-summary-icon">
            ◷
          </div>

          <div>
            <span>Total Slots</span>

            <strong>
              {schedules.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-schedule-summary-card">
          <div className="smarthealth-doctor-schedule-summary-icon">
            ✓
          </div>

          <div>
            <span>Available</span>

            <strong>
              {availableScheduleCount}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-schedule-summary-card">
          <div className="smarthealth-doctor-schedule-summary-icon">
            —
          </div>

          <div>
            <span>Unavailable</span>

            <strong>
              {unavailableScheduleCount}
            </strong>
          </div>
        </div>

      </div>

      {/* ======================================================
          WEEKLY SCHEDULE
      ======================================================= */}

      <section className="smarthealth-doctor-schedule-week-card">

        <div className="smarthealth-doctor-schedule-section-header">
          <div>
            <h2>
              Weekly Schedule
            </h2>

            <p>
              Manage the working hours that
              patients can use when booking
              appointments.
            </p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="smarthealth-doctor-schedule-empty">

            <div className="smarthealth-doctor-schedule-empty-icon">
              ◷
            </div>

            <h3>
              No Schedule Available
            </h3>

            <p>
              You have not created any working
              hours yet. Create your first
              schedule to allow patients to
              find available appointment times.
            </p>

            <button
              type="button"
              className="smarthealth-doctor-schedule-empty-create-button"
              onClick={handleOpenCreateModal}
            >
              Create Your First Schedule
            </button>

          </div>
        ) : (
          <div className="smarthealth-doctor-schedule-day-list">

            {groupedSchedules.map(
              ({
                day,
                schedules: daySchedules,
              }) => (
                <div
                  key={day}
                  className={`smarthealth-doctor-schedule-day-row ${
                    daySchedules.length === 0
                      ? "smarthealth-doctor-schedule-day-row-empty"
                      : ""
                  }`}
                >

                  <div className="smarthealth-doctor-schedule-day-name">
                    <span>
                      {day.substring(0, 3)}
                    </span>

                    <strong>
                      {day}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-schedule-day-slots">

                    {daySchedules.length === 0 ? (
                      <span className="smarthealth-doctor-schedule-no-slot">
                        No schedule
                      </span>
                    ) : (
                      daySchedules.map(
                        (schedule) => (
                          <div
                            key={
                              schedule.scheduleId
                            }
                            className="smarthealth-doctor-schedule-slot"
                          >

                            <div className="smarthealth-doctor-schedule-slot-main">

                              <div className="smarthealth-doctor-schedule-time">
                                <span className="smarthealth-doctor-schedule-time-icon">
                                  ◷
                                </span>

                                <span>
                                  {formatTime(
                                    schedule.startTime,
                                  )}

                                  {" – "}

                                  {formatTime(
                                    schedule.endTime,
                                  )}
                                </span>
                              </div>

                              <span
                                className={`smarthealth-doctor-schedule-status ${
                                  schedule.availabilityStatus ===
                                  "Available"
                                    ? "smarthealth-doctor-schedule-status-available"
                                    : "smarthealth-doctor-schedule-status-unavailable"
                                }`}
                              >
                                <span className="smarthealth-doctor-schedule-status-dot"></span>

                                {
                                  schedule.availabilityStatus
                                }
                              </span>

                            </div>

                            <div className="smarthealth-doctor-schedule-slot-actions">

                              <button
                                type="button"
                                className="smarthealth-doctor-schedule-edit-button"
                                onClick={() =>
                                  handleOpenEditModal(
                                    schedule,
                                  )
                                }
                                disabled={
                                  deletingScheduleId ===
                                  schedule.scheduleId
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="smarthealth-doctor-schedule-delete-button"
                                onClick={() =>
                                  handleDeleteSchedule(
                                    schedule,
                                  )
                                }
                                disabled={
                                  deletingScheduleId ===
                                  schedule.scheduleId
                                }
                              >
                                {deletingScheduleId ===
                                schedule.scheduleId
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </div>
                        ),
                      )
                    )}

                  </div>

                </div>
              ),
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          CREATE / EDIT MODAL
      ======================================================= */}

      {showScheduleModal && (
        <div
          className="smarthealth-doctor-schedule-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseScheduleModal();
            }
          }}
        >

          <div
            className="smarthealth-doctor-schedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-doctor-schedule-modal-title"
          >

            <div className="smarthealth-doctor-schedule-modal-header">

              <div>
                <span className="smarthealth-doctor-schedule-modal-eyebrow">
                  {editingSchedule
                    ? "UPDATE WORKING HOURS"
                    : "NEW WORKING HOURS"}
                </span>

                <h2 id="smarthealth-doctor-schedule-modal-title">
                  {editingSchedule
                    ? "Edit Schedule"
                    : "Create Schedule"}
                </h2>

                <p>
                  Set the day and working hours
                  for your appointment availability.
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-doctor-schedule-modal-close"
                onClick={handleCloseScheduleModal}
                disabled={savingSchedule}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              className="smarthealth-doctor-schedule-modal-form"
              onSubmit={handleSaveSchedule}
            >

              <div className="smarthealth-doctor-schedule-form-field">

                <label htmlFor="smarthealth-doctor-schedule-day">
                  Day of Week
                </label>

                <select
                  id="smarthealth-doctor-schedule-day"
                  name="dayOfWeek"
                  value={
                    scheduleForm.dayOfWeek
                  }
                  onChange={
                    handleScheduleFormChange
                  }
                  disabled={savingSchedule}
                >
                  {smarthealthDoctorScheduleDayOrder.map(
                    (day) => (
                      <option
                        key={day}
                        value={day}
                      >
                        {day}
                      </option>
                    ),
                  )}
                </select>

              </div>

              <div className="smarthealth-doctor-schedule-form-row">

                <div className="smarthealth-doctor-schedule-form-field">

                  <label htmlFor="smarthealth-doctor-schedule-start-time">
                    Start Time
                  </label>

                  <input
                    id="smarthealth-doctor-schedule-start-time"
                    type="time"
                    name="startTime"
                    value={
                      scheduleForm.startTime
                    }
                    onChange={
                      handleScheduleFormChange
                    }
                    disabled={savingSchedule}
                  />

                </div>

                <div className="smarthealth-doctor-schedule-form-field">

                  <label htmlFor="smarthealth-doctor-schedule-end-time">
                    End Time
                  </label>

                  <input
                    id="smarthealth-doctor-schedule-end-time"
                    type="time"
                    name="endTime"
                    value={
                      scheduleForm.endTime
                    }
                    onChange={
                      handleScheduleFormChange
                    }
                    disabled={savingSchedule}
                  />

                </div>

              </div>

              <div className="smarthealth-doctor-schedule-form-field">

                <label htmlFor="smarthealth-doctor-schedule-availability">
                  Availability
                </label>

                <select
                  id="smarthealth-doctor-schedule-availability"
                  name="availabilityStatus"
                  value={
                    scheduleForm.availabilityStatus
                  }
                  onChange={
                    handleScheduleFormChange
                  }
                  disabled={savingSchedule}
                >
                  <option value="Available">
                    Available
                  </option>

                  <option value="Unavailable">
                    Unavailable
                  </option>
                </select>

              </div>

              <div className="smarthealth-doctor-schedule-modal-actions">

                <button
                  type="button"
                  className="smarthealth-doctor-schedule-modal-cancel"
                  onClick={
                    handleCloseScheduleModal
                  }
                  disabled={savingSchedule}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-doctor-schedule-modal-submit"
                  disabled={savingSchedule}
                >
                  {savingSchedule
                    ? editingSchedule
                      ? "Updating..."
                      : "Creating..."
                    : editingSchedule
                      ? "Update Schedule"
                      : "Create Schedule"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default DoctorSchedule;