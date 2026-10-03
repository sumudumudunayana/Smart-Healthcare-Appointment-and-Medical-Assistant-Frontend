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

const DoctorSchedule = () => {
  const [profile, setProfile] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
       * First get the logged-in user's profile.
       * The profile gives us the UserId.
       */
      const profileData =
        await userService.getMyProfile();

      setProfile(profileData);

      /*
       * Get all doctors and find the doctor
       * associated with the logged-in user's UserId.
       *
       * We use the existing backend data instead
       * of assuming the DoctorId.
       */
      const doctors =
        await doctorService.getAll();

      const currentDoctor = doctors.find(
        (item) => item.userId === profileData.userId
      );

      if (!currentDoctor) {
        throw new Error(
          "The logged-in doctor profile could not be found."
        );
      }

      setDoctor(currentDoctor);

      /*
       * Get this doctor's real schedules.
       */
      const scheduleData =
        await doctorScheduleService.getByDoctorId(
          currentDoctor.doctorId
        );

      setSchedules(
        Array.isArray(scheduleData)
          ? scheduleData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load doctor schedule:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load your schedule."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const orderedSchedules = useMemo(() => {
    return [...schedules].sort((first, second) => {
      const firstDay =
        smarthealthDoctorScheduleDayOrder.indexOf(
          first.dayOfWeek
        );

      const secondDay =
        smarthealthDoctorScheduleDayOrder.indexOf(
          second.dayOfWeek
        );

      if (firstDay !== secondDay) {
        return firstDay - secondDay;
      }

      return String(first.startTime).localeCompare(
        String(second.startTime)
      );
    });
  }, [schedules]);

  const groupedSchedules = useMemo(() => {
    return smarthealthDoctorScheduleDayOrder.map(
      (day) => ({
        day,
        schedules: orderedSchedules.filter(
          (schedule) =>
            schedule.dayOfWeek === day
        ),
      })
    );
  }, [orderedSchedules]);

  const availableScheduleCount = schedules.filter(
    (schedule) =>
      schedule.availabilityStatus === "Available"
  ).length;

  const unavailableScheduleCount = schedules.filter(
    (schedule) =>
      schedule.availabilityStatus === "Unavailable"
  ).length;

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

  return (
    <div className="smarthealth-doctor-schedule-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="smarthealth-doctor-schedule-header">

        <div>
          <span className="smarthealth-doctor-schedule-eyebrow">
            DOCTOR PORTAL
          </span>

          <h1 className="smarthealth-doctor-schedule-title">
            My Schedule
          </h1>

          <p className="smarthealth-doctor-schedule-subtitle">
            View your weekly working hours and availability.
          </p>
        </div>

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

      {/* =====================================================
          DOCTOR INFORMATION
      ====================================================== */}

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

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="smarthealth-doctor-schedule-summary">

        <div className="smarthealth-doctor-schedule-summary-card">

          <div className="smarthealth-doctor-schedule-summary-icon">
            ◷
          </div>

          <div>
            <span>
              Total Slots
            </span>

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
            <span>
              Available
            </span>

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
            <span>
              Unavailable
            </span>

            <strong>
              {unavailableScheduleCount}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          WEEKLY SCHEDULE
      ====================================================== */}

      <section className="smarthealth-doctor-schedule-week-card">

        <div className="smarthealth-doctor-schedule-section-header">

          <div>
            <h2>
              Weekly Schedule
            </h2>

            <p>
              Your current schedule configured by the hospital administrator.
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
              No working hours have been configured for your account yet.
            </p>

          </div>
        ) : (
          <div className="smarthealth-doctor-schedule-day-list">

            {groupedSchedules.map(
              ({ day, schedules: daySchedules }) => (
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
                            key={schedule.scheduleId}
                            className="smarthealth-doctor-schedule-slot"
                          >

                            <div className="smarthealth-doctor-schedule-time">

                              <span className="smarthealth-doctor-schedule-time-icon">
                                ◷
                              </span>

                              <span>
                                {formatTime(
                                  schedule.startTime
                                )}
                                {" – "}
                                {formatTime(
                                  schedule.endTime
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
                        )
                      )
                    )}

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
};

export default DoctorSchedule;