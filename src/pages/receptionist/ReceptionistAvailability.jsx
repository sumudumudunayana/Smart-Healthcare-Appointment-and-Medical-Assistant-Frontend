import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import doctorService from "../../services/doctorService";
import doctorScheduleService from "../../services/doctorScheduleService";

import "../../styles/pages/receptionist/ReceptionistAvailability.css";

const ReceptionistAvailability = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setErrorMessage("");

      const data = await doctorService.getAll();

      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Failed to load doctors.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadDoctorSchedules = async (doctorId) => {
    if (!doctorId) {
      setSchedules([]);
      return;
    }

    try {
      setLoadingSchedules(true);
      setErrorMessage("");

      const data =
        await doctorScheduleService.getByDoctorId(doctorId);

      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Failed to load doctor availability.";

      setSchedules([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleDoctorChange = async (event) => {
    const doctorId = event.target.value;

    setSelectedDoctorId(doctorId);
    await loadDoctorSchedules(doctorId);
  };

  const handleRefresh = async () => {
    if (selectedDoctorId) {
      await loadDoctorSchedules(selectedDoctorId);
    } else {
      await loadDoctors();
    }
  };

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      return (
        doctor.fullName?.toLowerCase().includes(normalizedSearch) ||
        doctor.specialization
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        doctor.department
          ?.toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [doctors, searchTerm]);

  const selectedDoctor = doctors.find(
    (doctor) => doctor.doctorId === selectedDoctorId
  );

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] = time.split(":");

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDay = (day) => {
    if (!day) {
      return "-";
    }

    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase() === "available"
      ? "smarthealth-receptionist-availability-status-available"
      : "smarthealth-receptionist-availability-status-unavailable";
  };

  return (
    <div className="smarthealth-receptionist-availability-page">
      <div className="smarthealth-receptionist-availability-header">
        <div>
          <h1 className="smarthealth-receptionist-availability-title">
            Doctor Availability
          </h1>

          <p className="smarthealth-receptionist-availability-subtitle">
            View doctors and their scheduled availability.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-availability-refresh-button"
          onClick={handleRefresh}
          disabled={loadingDoctors || loadingSchedules}
        >
          <span className="smarthealth-receptionist-availability-refresh-icon">
            ↻
          </span>
          Refresh
        </button>
      </div>

      <div className="smarthealth-receptionist-availability-layout">
        <section className="smarthealth-receptionist-availability-doctors-card">
          <div className="smarthealth-receptionist-availability-card-header">
            <div>
              <h2 className="smarthealth-receptionist-availability-card-title">
                Doctors
              </h2>

              <p className="smarthealth-receptionist-availability-card-description">
                Select a doctor to view their availability.
              </p>
            </div>

            <span className="smarthealth-receptionist-availability-doctor-count">
              {doctors.length}
            </span>
          </div>

          <div className="smarthealth-receptionist-availability-search-wrapper">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search doctor, specialization..."
              className="smarthealth-receptionist-availability-search"
            />
          </div>

          {loadingDoctors ? (
            <div className="smarthealth-receptionist-availability-loading">
              Loading doctors...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="smarthealth-receptionist-availability-empty">
              No doctors found.
            </div>
          ) : (
            <div className="smarthealth-receptionist-availability-doctor-list">
              {filteredDoctors.map((doctor) => {
                const isSelected =
                  selectedDoctorId === doctor.doctorId;

                return (
                  <button
                    type="button"
                    key={doctor.doctorId}
                    className={`smarthealth-receptionist-availability-doctor-item ${
                      isSelected
                        ? "smarthealth-receptionist-availability-doctor-item-selected"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedDoctorId(doctor.doctorId);
                      loadDoctorSchedules(doctor.doctorId);
                    }}
                  >
                    <div className="smarthealth-receptionist-availability-doctor-avatar">
                      {doctor.fullName
                        ?.charAt(0)
                        ?.toUpperCase() || "D"}
                    </div>

                    <div className="smarthealth-receptionist-availability-doctor-info">
                      <span className="smarthealth-receptionist-availability-doctor-name">
                        {doctor.fullName}
                      </span>

                      <span className="smarthealth-receptionist-availability-doctor-specialization">
                        {doctor.specialization || "No specialization"}
                      </span>

                      {doctor.department && (
                        <span className="smarthealth-receptionist-availability-doctor-department">
                          {doctor.department}
                        </span>
                      )}
                    </div>

                    <span className="smarthealth-receptionist-availability-doctor-arrow">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="smarthealth-receptionist-availability-schedule-card">
          {!selectedDoctorId ? (
            <div className="smarthealth-receptionist-availability-placeholder">
              <div className="smarthealth-receptionist-availability-placeholder-icon">
                📅
              </div>

              <h2 className="smarthealth-receptionist-availability-placeholder-title">
                Select a Doctor
              </h2>

              <p className="smarthealth-receptionist-availability-placeholder-text">
                Select a doctor from the list to view their
                availability schedule.
              </p>
            </div>
          ) : (
            <>
              <div className="smarthealth-receptionist-availability-schedule-header">
                <div>
                  <h2 className="smarthealth-receptionist-availability-schedule-title">
                    {selectedDoctor?.fullName || "Doctor Schedule"}
                  </h2>

                  <p className="smarthealth-receptionist-availability-schedule-subtitle">
                    {selectedDoctor?.specialization ||
                      "Doctor availability"}
                  </p>
                </div>

                {selectedDoctor?.status && (
                  <span
                    className={`smarthealth-receptionist-availability-doctor-status ${
                      selectedDoctor.status.toLowerCase() ===
                      "active"
                        ? "smarthealth-receptionist-availability-doctor-status-active"
                        : "smarthealth-receptionist-availability-doctor-status-inactive"
                    }`}
                  >
                    {selectedDoctor.status}
                  </span>
                )}
              </div>

              {loadingSchedules ? (
                <div className="smarthealth-receptionist-availability-loading">
                  Loading availability...
                </div>
              ) : schedules.length === 0 ? (
                <div className="smarthealth-receptionist-availability-empty-schedule">
                  <div className="smarthealth-receptionist-availability-empty-schedule-icon">
                    🗓️
                  </div>

                  <h3 className="smarthealth-receptionist-availability-empty-schedule-title">
                    No Availability Found
                  </h3>

                  <p className="smarthealth-receptionist-availability-empty-schedule-text">
                    This doctor does not have any schedules
                    configured yet.
                  </p>
                </div>
              ) : (
                <div className="smarthealth-receptionist-availability-table-wrapper">
                  <table className="smarthealth-receptionist-availability-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {schedules.map((schedule) => (
                        <tr key={schedule.scheduleId}>
                          <td>
                            <span className="smarthealth-receptionist-availability-day">
                              {formatDay(schedule.dayOfWeek)}
                            </span>
                          </td>

                          <td>
                            {formatTime(schedule.startTime)}
                          </td>

                          <td>
                            {formatTime(schedule.endTime)}
                          </td>

                          <td>
                            <span
                              className={`smarthealth-receptionist-availability-status ${getStatusClass(
                                schedule.availabilityStatus
                              )}`}
                            >
                              {schedule.availabilityStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {errorMessage && (
        <div className="smarthealth-receptionist-availability-error">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ReceptionistAvailability;