import { useState } from "react";
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiInfo,
  FiLoader,
  FiMapPin,
  FiMessageCircle,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { toast } from "sonner";
import api from "../../services/api";
import "../../styles/pages/patient/AIAssistant.css";

const AIAssistant = () => {
  const [activeMode, setActiveMode] = useState("scheduling");

  // Appointment scheduling state
  const [appointmentRequest, setAppointmentRequest] = useState("");
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Symptom checker state
  const [symptoms, setSymptoms] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const [showAllSlots, setShowAllSlots] = useState(false);

  const getValue = (object, key) => {
    if (!object || typeof object !== "object") {
      return undefined;
    }

    const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);

    const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);

    return object[key] ?? object[camelCaseKey] ?? object[pascalCaseKey];
  };

  const parseJsonOutput = (output) => {
    if (output == null || output === "") {
      return null;
    }

    if (typeof output === "object") {
      return output;
    }

    if (typeof output !== "string") {
      return null;
    }

    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  };

  const handleSchedulingSubmit = async (event) => {
    event.preventDefault();

    if (!appointmentRequest.trim()) {
      toast.error("Please describe the appointment you need.");
      return;
    }

    setSchedulingLoading(true);
    setSchedulingResult(null);
    setSelectedSlot(null);
    setShowAllSlots(false);

    try {
      const response = await api.post("/ai/scheduling/test", {
        request: appointmentRequest.trim(),
      });

      const data = response.data;

      console.log("Scheduling API response:", data);

      if (data?.success !== true && data?.Success !== true) {
        toast.error(
          data?.message ??
            data?.Message ??
            "Unable to process your appointment request.",
        );
        return;
      }

      const rawOutput = getValue(data, "Output");
      const parsedOutput = parseJsonOutput(rawOutput);

      if (!parsedOutput) {
        console.error("Invalid scheduling output:", rawOutput);

        toast.error("The scheduling assistant returned an invalid response.");
        return;
      }

      const requestDetails = getValue(parsedOutput, "Request") ?? {};

      const rawSlots = getValue(parsedOutput, "AvailableSlots");

      if (!Array.isArray(rawSlots)) {
        console.error("AvailableSlots was missing or invalid:", parsedOutput);

        toast.error(
          "The scheduling assistant returned an invalid appointment list.",
        );
        return;
      }

      // Keep only entries with the fields required for display and booking.
      const availableSlots = rawSlots.filter((slot) => {
        return (
          getValue(slot, "DoctorId") &&
          getValue(slot, "ScheduleId") &&
          getValue(slot, "AppointmentDate") &&
          getValue(slot, "AppointmentTime")
        );
      });

      console.log("Parsed appointment slots:", availableSlots);

      const message =
        getValue(data, "Message") ||
        (availableSlots.length > 0
          ? "Available appointment slots found."
          : "No available appointment slots were found.");

      setSchedulingResult({
        request: requestDetails,
        availableSlots,
        message,
        workflowId: getValue(data, "WorkflowId"),
      });

      if (availableSlots.length === 0) {
        toast.info(
          "No available appointment slots were returned. Try another date or preference.",
        );
      } else {
        toast.success(
          `Found ${availableSlots.length} available appointment slot${
            availableSlots.length === 1 ? "" : "s"
          }.`,
        );
      }
    } catch (error) {
      console.error("Appointment scheduling error:", error);

      toast.error(
        error.response?.data?.message ??
          error.response?.data?.Message ??
          "Unable to connect to the scheduling assistant. Please try again.",
      );
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      toast.error("Please select an appointment slot first.");
      return;
    }

    const doctorId = getValue(selectedSlot, "DoctorId");
    const scheduleId = getValue(selectedSlot, "ScheduleId");
    const appointmentDate = getValue(selectedSlot, "AppointmentDate");
    const appointmentTime = getValue(selectedSlot, "AppointmentTime");

    if (!doctorId || !scheduleId || !appointmentDate || !appointmentTime) {
      toast.error("The selected slot is missing required booking details.");
      return;
    }

    const confirmAppointmentBooking = async () => {
      if (!selectedSlot) {
        toast.error("Please select an appointment slot first.");
        return;
      }

      const doctorId = getValue(selectedSlot, "DoctorId");
      const scheduleId = getValue(selectedSlot, "ScheduleId");
      const appointmentDate = getValue(selectedSlot, "AppointmentDate");
      const appointmentTime = getValue(selectedSlot, "AppointmentTime");

      if (!doctorId || !scheduleId || !appointmentDate || !appointmentTime) {
        toast.error("The selected slot is missing required booking details.");
        return;
      }

      setBookingLoading(true);

      try {
        await api.post("/Appointments", {
          doctorId,
          scheduleId,
          appointmentDate,
          appointmentTime,
          symptoms: null,
        });

        toast.success("Appointment booked successfully!");

        setSelectedSlot(null);
        setSchedulingResult(null);
        setAppointmentRequest("");

        window.location.href = "/patient/appointments";
      } catch (error) {
        console.error("Appointment booking error:", error);

        if (error.response?.status === 409) {
          toast.error(
            error.response?.data?.message ||
              "This appointment slot is no longer available. Please choose another.",
          );
        } else {
          toast.error(
            error.response?.data?.message ||
              error.response?.data?.detail ||
              "Unable to book this appointment. Please try again.",
          );
        }
      } finally {
        setBookingLoading(false);
      }
    };

    const handleBookAppointment = () => {
      if (!selectedSlot) {
        toast.error("Please select an appointment slot first.");
        return;
      }

      if (bookingLoading) {
        return;
      }

      toast("Confirm your appointment booking", {
        description:
          "Would you like to book this appointment? Availability will be checked again before confirming.",
        duration: Infinity,

        action: {
          label: "Confirm Booking",
          onClick: () => {
            confirmAppointmentBooking();
          },
        },

        cancel: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss();
          },
        },
      });
    };

    setBookingLoading(true);

    try {
      await api.post("/Appointments", {
        doctorId,
        scheduleId,
        appointmentDate,
        appointmentTime,
        symptoms: null,
      });

      toast.success("Appointment booked successfully!");

      setSelectedSlot(null);
      setSchedulingResult(null);
      setAppointmentRequest("");

      // The patient can see the confirmed appointment here.
      window.location.href = "/patient/appointments";
    } catch (error) {
      console.error("Appointment booking error:", error);

      if (error.response?.status === 409) {
        toast.error(
          error.response?.data?.message ||
            "This appointment slot is no longer available. Please choose another.",
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Unable to book this appointment. Please try again.",
        );
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSymptomSubmit = async (event) => {
    event.preventDefault();

    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms.");
      return;
    }

    setTriageLoading(true);
    setTriageResult(null);

    try {
      const response = await api.post("/ai/triage/test", {
        request: symptoms.trim(),
      });

      const data = response.data;

      console.log("Patient triage API response:", data);

      if (getValue(data, "Success") !== true) {
        toast.error(
          getValue(data, "Message") ||
            "Unable to assess the submitted symptoms.",
        );
        return;
      }

      const rawOutput = getValue(data, "Output");
      const assessment = parseJsonOutput(rawOutput);

      if (!assessment || typeof assessment !== "object") {
        console.error("Invalid triage assessment:", rawOutput);

        toast.error("The symptom assessment returned an invalid response.");
        return;
      }

      setTriageResult({
        assessment,
        message:
          getValue(data, "Message") ||
          "Preliminary symptom assessment completed.",
        requiresHumanApproval: getValue(data, "RequiresHumanApproval") === true,
      });

      toast.success("Your preliminary symptom assessment is ready.");
    } catch (error) {
      console.error("Patient triage error:", error);

      toast.error(
        error.response?.data?.message ??
          error.response?.data?.Message ??
          "Unable to connect to the symptom assessment service. Please try again.",
      );
    } finally {
      setTriageLoading(false);
    }
  };

  const handleResetScheduling = () => {
    setAppointmentRequest("");
    setSchedulingResult(null);
    setSelectedSlot(null);
    setShowAllSlots(false);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-LK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "Time unavailable";

    const match = String(timeValue).match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
      return timeValue;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-LK", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSlotId = (slot) =>
    [
      getValue(slot, "DoctorId"),
      getValue(slot, "ScheduleId"),
      getValue(slot, "AppointmentDate"),
      getValue(slot, "AppointmentTime"),
    ].join("-");

  const getPreference = (key) => {
    const value = getValue(schedulingResult?.request, key);

    if (!value || !String(value).trim()) {
      return null;
    }

    return value;
  };

  const slots = schedulingResult?.availableSlots ?? [];

  const displayedSlots = showAllSlots ? slots : slots.slice(0, 6);

  return (
    <div className="smarthealth-ai-page">
      {/* Page Header */}
      <header className="smarthealth-ai-page-header">
        <div className="smarthealth-ai-header-content">
          <div className="smarthealth-ai-header-icon">
            <FiActivity />
          </div>

          <div>
            <span className="smarthealth-ai-eyebrow">SMART HEALTHCARE</span>

            <h1>AI Healthcare Assistant</h1>

            <p>
              Your intelligent companion for appointment planning and healthcare
              assistance.
            </p>
          </div>
        </div>

        <div className="smarthealth-ai-header-badge">
          <span className="smarthealth-ai-status-dot" />
          AI Assistant
        </div>
      </header>

      {/* Welcome Card */}
      <section className="smarthealth-ai-welcome">
        <div className="smarthealth-ai-welcome-icon">
          <FiHeart />
        </div>

        <div className="smarthealth-ai-welcome-text">
          <h2>How can we help you today?</h2>

          <p>
            Find an appointment that suits your schedule or explore our symptom
            assistance feature.
          </p>
        </div>
      </section>

      {/* Mode Selection */}
      <section className="smarthealth-ai-mode-section">
        <div className="smarthealth-ai-section-heading">
          <div>
            <h2>Choose your assistant</h2>
            <p>Select the service you would like to use.</p>
          </div>
        </div>

        <div className="smarthealth-ai-mode-grid">
          <button
            type="button"
            className={`smarthealth-ai-mode-card ${
              activeMode === "scheduling"
                ? "smarthealth-ai-mode-card-active"
                : ""
            }`}
            onClick={() => setActiveMode("scheduling")}
          >
            <span className="smarthealth-ai-mode-icon scheduling">
              <FiCalendar />
            </span>

            <span className="smarthealth-ai-mode-content">
              <strong>Appointment Assistant</strong>

              <span>
                Describe your needs and find available appointment slots.
              </span>

              <span className="smarthealth-ai-mode-action">
                Find appointments <FiArrowRight />
              </span>
            </span>

            {activeMode === "scheduling" && (
              <FiCheckCircle className="smarthealth-ai-mode-check" />
            )}
          </button>

          <button
            type="button"
            className={`smarthealth-ai-mode-card ${
              activeMode === "triage" ? "smarthealth-ai-mode-card-active" : ""
            }`}
            onClick={() => setActiveMode("triage")}
          >
            <span className="smarthealth-ai-mode-icon triage">
              <FiActivity />
            </span>

            <span className="smarthealth-ai-mode-content">
              <strong>Symptom Checker</strong>

              <span>
                Describe how you feel and explore preliminary symptom
                assistance.
              </span>

              <span className="smarthealth-ai-mode-action">
                Describe symptoms <FiArrowRight />
              </span>
            </span>

            {activeMode === "triage" && (
              <FiCheckCircle className="smarthealth-ai-mode-check" />
            )}
          </button>
        </div>
      </section>

      {/* Appointment Assistant */}
      {activeMode === "scheduling" && (
        <section className="smarthealth-ai-workspace">
          <div className="smarthealth-ai-workspace-header">
            <div className="smarthealth-ai-workspace-icon">
              <FiCalendar />
            </div>

            <div>
              <h2>Appointment Assistant</h2>

              <p>
                Tell us which specialist you need and when you would prefer to
                visit.
              </p>
            </div>
          </div>

          <form
            className="smarthealth-ai-request-form"
            onSubmit={handleSchedulingSubmit}
          >
            <label htmlFor="smarthealth-ai-appointment-request">
              What kind of appointment are you looking for?
            </label>

            <div className="smarthealth-ai-input-wrapper">
              <FiMessageCircle />

              <textarea
                id="smarthealth-ai-appointment-request"
                value={appointmentRequest}
                onChange={(event) => setAppointmentRequest(event.target.value)}
                placeholder="For example: I would like to see a cardiologist tomorrow morning."
                rows={4}
                maxLength={2000}
                disabled={schedulingLoading}
              />
            </div>

            <div className="smarthealth-ai-form-footer">
              <span>{appointmentRequest.length}/2000 characters</span>

              <button
                type="submit"
                className="smarthealth-ai-primary-button"
                disabled={schedulingLoading || !appointmentRequest.trim()}
              >
                {schedulingLoading ? (
                  <>
                    <FiLoader className="smarthealth-ai-spinner" />
                    Finding slots...
                  </>
                ) : (
                  <>
                    <FiSearch />
                    Find appointments
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="smarthealth-ai-example-section">
            <span className="smarthealth-ai-example-label">
              NEED SOME IDEAS?
            </span>

            <div className="smarthealth-ai-example-list">
              {[
                "I need a cardiologist tomorrow morning.",
                "Find a dermatologist for next week.",
                "I want to see a doctor tomorrow afternoon.",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  className="smarthealth-ai-example-chip"
                  onClick={() => setAppointmentRequest(example)}
                  disabled={schedulingLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling Results */}
          {schedulingResult && (
            <div className="smarthealth-ai-results">
              <div className="smarthealth-ai-results-heading">
                <div>
                  <span className="smarthealth-ai-results-eyebrow">
                    SEARCH RESULTS
                  </span>

                  <h3>Available appointments</h3>

                  <p>{schedulingResult.message}</p>
                </div>

                <button
                  type="button"
                  className="smarthealth-ai-reset-button"
                  onClick={handleResetScheduling}
                  aria-label="Start a new appointment search"
                >
                  <FiRefreshCw />
                  New search
                </button>
              </div>

              {/* Extracted Preferences */}
              <div className="smarthealth-ai-preferences">
                <h4>
                  <FiCheckCircle />
                  Your appointment preferences
                </h4>

                <div className="smarthealth-ai-preference-grid">
                  {[
                    {
                      label: "Specialization",
                      value: getPreference("Specialization"),
                    },
                    {
                      label: "Preferred date",
                      value: getPreference("PreferredDate"),
                    },
                    {
                      label: "Time period",
                      value: getPreference("PreferredTimePeriod"),
                    },
                    {
                      label: "Additional preferences",
                      value: getPreference("AdditionalPreferences"),
                    },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div
                        className="smarthealth-ai-preference-item"
                        key={item.label}
                      >
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}

                  {![
                    "Specialization",
                    "PreferredDate",
                    "PreferredTimePeriod",
                    "AdditionalPreferences",
                  ].some((key) => getPreference(key)) && (
                    <p className="smarthealth-ai-muted">
                      No appointment preferences were extracted.
                    </p>
                  )}
                </div>
              </div>

              {slots.length > 0 ? (
                <>
                  <div className="smarthealth-ai-slot-summary">
                    <div>
                      <h4>
                        {slots.length} slot{slots.length === 1 ? "" : "s"} found
                      </h4>

                      <p>Select an available slot to continue.</p>
                    </div>

                    <span className="smarthealth-ai-slot-count">
                      <FiCalendar />
                      {slots.length} available
                    </span>
                  </div>

                  <div className="smarthealth-ai-slot-grid">
                    {displayedSlots.map((slot) => {
                      const slotId = getSlotId(slot);
                      const isSelected =
                        selectedSlot && getSlotId(selectedSlot) === slotId;

                      const doctorName =
                        getValue(slot, "DoctorName") ||
                        "Doctor name unavailable";

                      const specialization =
                        getValue(slot, "Specialization") ||
                        "General consultation";

                      const department = getValue(slot, "Department");

                      const appointmentDate = getValue(slot, "AppointmentDate");

                      const appointmentTime = getValue(slot, "AppointmentTime");

                      return (
                        <button
                          type="button"
                          key={slotId}
                          className={`smarthealth-ai-slot-card ${
                            isSelected
                              ? "smarthealth-ai-slot-card-selected"
                              : ""
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="smarthealth-ai-slot-top">
                            <span className="smarthealth-ai-doctor-avatar">
                              <FiUser />
                            </span>

                            <span className="smarthealth-ai-slot-radio">
                              {isSelected && <FiCheckCircle />}
                            </span>
                          </div>

                          <strong className="smarthealth-ai-doctor-name">
                            {doctorName}
                          </strong>

                          <span className="smarthealth-ai-doctor-specialization">
                            <FiActivity />
                            {specialization}
                          </span>

                          {department && (
                            <span className="smarthealth-ai-doctor-department">
                              <FiMapPin />
                              {department}
                            </span>
                          )}

                          <div className="smarthealth-ai-slot-divider" />

                          <span className="smarthealth-ai-slot-detail">
                            <FiCalendar />
                            {formatDate(appointmentDate)}
                          </span>

                          <span className="smarthealth-ai-slot-detail">
                            <FiClock />
                            {formatTime(appointmentTime)}
                          </span>

                          <span className="smarthealth-ai-slot-select-label">
                            {isSelected ? "Selected" : "Select this slot"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {slots.length > 6 && (
                    <button
                      type="button"
                      className="smarthealth-ai-show-more"
                      onClick={() => setShowAllSlots((previous) => !previous)}
                    >
                      {showAllSlots
                        ? "Show fewer appointments"
                        : `Show all ${slots.length} appointments`}
                    </button>
                  )}

                  {selectedSlot && (
                    <div className="smarthealth-ai-booking-panel">
                      <div className="smarthealth-ai-booking-info">
                        <FiCheckCircle />

                        <div>
                          <strong>Appointment slot selected</strong>

                          <span>
                            {getValue(selectedSlot, "DoctorName")} ·{" "}
                            {formatDate(
                              getValue(selectedSlot, "AppointmentDate"),
                            )}{" "}
                            at{" "}
                            {formatTime(
                              getValue(selectedSlot, "AppointmentTime"),
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="smarthealth-ai-primary-button"
                        onClick={handleBookAppointment}
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? (
                          <>
                            <FiLoader className="smarthealth-ai-spinner" />
                            Booking...
                          </>
                        ) : (
                          <>
                            Confirm booking <FiArrowRight />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="smarthealth-ai-information-note">
                    <FiInfo />

                    <p>
                      These slots are suggestions based on the latest
                      availability search. The system will validate the slot
                      again when you book. A slot is not reserved until the
                      booking is confirmed.
                    </p>
                  </div>
                </>
              ) : (
                <div className="smarthealth-ai-empty-state">
                  <div className="smarthealth-ai-empty-icon">
                    <FiCalendar />
                  </div>

                  <h4>No available appointments found</h4>

                  <p>
                    Try specifying another date, time period, or medical
                    specialization.
                  </p>

                  <button
                    type="button"
                    className="smarthealth-ai-secondary-button"
                    onClick={handleResetScheduling}
                  >
                    Try another search
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Symptom Checker */}
      {activeMode === "triage" && (
        <section className="smarthealth-ai-workspace">
          <div className="smarthealth-ai-workspace-header">
            <div className="smarthealth-ai-workspace-icon triage">
              <FiActivity />
            </div>

            <div>
              <h2>Symptom Checker</h2>

              <p>
                Describe your symptoms to prepare for a conversation with a
                healthcare professional.
              </p>
            </div>
          </div>

          <div className="smarthealth-ai-triage-notice">
            <FiInfo />

            <div>
              <strong>Preliminary symptom assessment</strong>

              <p>
                Describe your symptoms, including when they started and how they
                affect you. The AI will provide preliminary guidance, not a
                confirmed medical diagnosis.
              </p>
            </div>
          </div>

          <form
            className="smarthealth-ai-request-form"
            onSubmit={handleSymptomSubmit}
          >
            <label htmlFor="smarthealth-ai-symptoms">
              What symptoms are you experiencing?
            </label>

            <div className="smarthealth-ai-input-wrapper">
              <FiMessageCircle />

              <textarea
                id="smarthealth-ai-symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Describe your symptoms, when they started, and how they affect you..."
                rows={5}
                maxLength={3000}
              />
            </div>

            <div className="smarthealth-ai-form-footer">
              <span>{symptoms.length}/3000 characters</span>

              <button
                type="submit"
                className="smarthealth-ai-primary-button"
                disabled={triageLoading || !symptoms.trim()}
              >
                {triageLoading ? (
                  <>
                    <FiLoader className="smarthealth-ai-spinner" />
                    Assessing symptoms...
                  </>
                ) : (
                  <>
                    <FiActivity />
                    Check symptoms
                  </>
                )}
              </button>
            </div>
          </form>

          {triageResult && (
            <div className="smarthealth-ai-results">
              <div className="smarthealth-ai-results-heading">
                <div>
                  <span className="smarthealth-ai-results-eyebrow">
                    PRELIMINARY ASSESSMENT
                  </span>

                  <h3>Your Symptom Assessment</h3>

                  <p>{triageResult.message}</p>
                </div>

                <FiActivity />
              </div>

              {(() => {
                const assessment = triageResult.assessment;

                const urgencyLevel =
                  getValue(assessment, "UrgencyLevel") || "Not provided";

                const specialization =
                  getValue(assessment, "RecommendedSpecialization") ||
                  "Not provided";

                const emergencyIndicator =
                  getValue(assessment, "EmergencyIndicator") === true;

                const reasoning =
                  getValue(assessment, "Reasoning") ||
                  "The AI did not provide an explanation.";

                const isEmergency =
                  emergencyIndicator ||
                  String(urgencyLevel).toLowerCase() === "emergency";

                return (
                  <>
                    {isEmergency && (
                      <div
                        role="alert"
                        style={{
                          padding: "16px",
                          marginBottom: "20px",
                          border: "1px solid #dc2626",
                          borderRadius: "12px",
                          backgroundColor: "#fef2f2",
                          color: "#991b1b",
                        }}
                      >
                        <strong>
                          Seek emergency medical care immediately.
                        </strong>

                        <p>
                          Do not wait for an online assessment or routine
                          appointment. Contact your local emergency service or
                          go to the nearest emergency department.
                        </p>
                      </div>
                    )}

                    <div className="smarthealth-ai-preference-grid">
                      <div className="smarthealth-ai-preference-item">
                        <span>Urgency level</span>
                        <strong>{urgencyLevel}</strong>
                      </div>

                      <div className="smarthealth-ai-preference-item">
                        <span>Recommended specialization</span>
                        <strong>{specialization}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <h4>Assessment explanation</h4>
                      <p>{reasoning}</p>
                    </div>

                    {triageResult.requiresHumanApproval && (
                      <div className="smarthealth-ai-information-note">
                        <FiInfo />

                        <p>
                          This assessment requires review by a healthcare
                          professional. Do not treat it as a confirmed
                          diagnosis.
                        </p>
                      </div>
                    )}

                    <p
                      className="smarthealth-ai-muted"
                      style={{ marginTop: "20px" }}
                    >
                      This AI-generated assessment may be incomplete or
                      incorrect. Consult a qualified healthcare professional for
                      medical advice.
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          <div className="smarthealth-ai-triage-disclaimer">
            <FiShield />

            <div>
              <strong>Important health information</strong>

              <p>
                This feature is intended to support access to healthcare, not
                replace a medical professional. It does not provide a confirmed
                diagnosis or treatment.
              </p>

              <p>
                If you may be experiencing a medical emergency, seek emergency
                medical assistance immediately instead of waiting for an online
                assessment.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="smarthealth-ai-page-footer">
        <span className="smarthealth-ai-footer-icon">
          <FiShield />
        </span>

        <p>
          Your health matters. AI-generated information should be treated as
          preliminary guidance and does not replace professional medical advice.
        </p>
      </footer>
    </div>
  );
};

export default AIAssistant;
