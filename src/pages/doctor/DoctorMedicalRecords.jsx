import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import appointmentService from "../../services/appointmentService";
import medicalRecordService from "../../services/medicalRecordService";

import "../../styles/pages/doctor/DoctorMedicalRecords.css";

const DoctorMedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [recordFilter, setRecordFilter] = useState("All");

  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  const [showRecordPanel, setShowRecordPanel] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  // ============================================================
  // LOAD DOCTOR MEDICAL RECORDS
  // ============================================================

  const loadRecords = async () => {
    try {
      setLoadingRecords(true);

      const data = await medicalRecordService.getMyDoctorRecords();

      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load doctor medical records:", error);

      toast.error(
        error.response?.data?.message || "Failed to load medical records.",
      );
    } finally {
      setLoadingRecords(false);
    }
  };

  // ============================================================
  // LOAD DOCTOR APPOINTMENTS
  // Used only when creating a new medical record
  // ============================================================

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const data = await appointmentService.getDoctorAppointments();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load doctor appointments:", error);

      toast.error(
        error.response?.data?.message || "Failed to load appointments.",
      );
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadRecords();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const parts = timeValue.split(":");

    if (parts.length < 2) {
      return timeValue;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timeValue;
    }

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ============================================================
  // VIEW MEDICAL RECORD
  // ============================================================

  const handleViewRecord = async (record) => {
    setSelectedRecord(null);
    setSelectedAppointment(null);
    setShowRecordPanel(true);
    setLoadingRecord(true);

    try {
      const latestRecord = await medicalRecordService.getByAppointment(
        record.appointmentId,
      );

      setSelectedRecord(latestRecord);
    } catch (error) {
      console.error("Failed to load medical record:", error);

      setShowRecordPanel(false);

      toast.error(
        error.response?.data?.message || "Failed to load medical record.",
      );
    } finally {
      setLoadingRecord(false);
    }
  };

  // ============================================================
  // OPEN CREATE RECORD PANEL
  // ============================================================

  const handleOpenCreatePanel = async () => {
    setShowCreatePanel(true);

    setSelectedRecord(null);
    setSelectedAppointment(null);

    setFormData({
      diagnosis: "",
      treatment: "",
      notes: "",
    });

    await loadAppointments();
  };

  // ============================================================
  // SELECT APPOINTMENT FOR NEW RECORD
  // ============================================================

  const handleSelectAppointmentForCreate = async (appointment) => {
    setLoadingRecord(true);

    try {
      const record = await medicalRecordService.getByAppointment(
        appointment.appointmentId,
      );

      if (record) {
        toast.info("A medical record already exists for this appointment.");

        setShowCreatePanel(false);

        setSelectedAppointment(null);

        setSelectedRecord(record);
        setShowRecordPanel(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // No record exists, so this appointment can be used.
        setSelectedAppointment(appointment);

        setFormData({
          diagnosis: "",
          treatment: "",
          notes: "",
        });

        return;
      }

      console.error("Failed to check appointment medical record:", error);

      setSelectedAppointment(null);

      toast.error(
        error.response?.data?.message || "Failed to check medical record.",
      );
    } finally {
      setLoadingRecord(false);
    }
  };

  // ============================================================
  // CLOSE RECORD PANEL
  // ============================================================

  const handleCloseRecordPanel = () => {
    if (savingRecord) {
      return;
    }

    setShowRecordPanel(false);
    setSelectedRecord(null);
    setSelectedAppointment(null);
  };

  // ============================================================
  // CLOSE CREATE PANEL
  // ============================================================

  const handleCloseCreatePanel = () => {
    if (savingRecord) {
      return;
    }

    setShowCreatePanel(false);
    setSelectedAppointment(null);

    setFormData({
      diagnosis: "",
      treatment: "",
      notes: "",
    });
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // CREATE MEDICAL RECORD
  // ============================================================

  const handleCreateRecord = async (event) => {
    event.preventDefault();

    if (!selectedAppointment) {
      toast.error("Please select an appointment.");
      return;
    }

    if (
      !formData.diagnosis.trim() &&
      !formData.treatment.trim() &&
      !formData.notes.trim()
    ) {
      toast.error("Please enter at least one medical record detail.");

      return;
    }

    try {
      setSavingRecord(true);

      const createdRecord = await medicalRecordService.create({
        appointmentId: selectedAppointment.appointmentId,

        diagnosis: formData.diagnosis.trim() || null,

        treatment: formData.treatment.trim() || null,

        notes: formData.notes.trim() || null,
      });

      toast.success("Medical record created successfully.");

      setShowCreatePanel(false);
      setSelectedAppointment(null);

      setFormData({
        diagnosis: "",
        treatment: "",
        notes: "",
      });

      await loadRecords();

      setSelectedRecord(createdRecord);
      setShowRecordPanel(true);
    } catch (error) {
      console.error("Failed to create medical record:", error);

      toast.error(
        error.response?.data?.message || "Failed to create medical record.",
      );
    } finally {
      setSavingRecord(false);
    }
  };

  // ============================================================
  // FILTER RECORDS
  // ============================================================

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const patientName = record.patientName?.toLowerCase() || "";

      const diagnosis = record.diagnosis?.toLowerCase() || "";

      const treatment = record.treatment?.toLowerCase() || "";

      const notes = record.notes?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        patientName.includes(normalizedSearch) ||
        diagnosis.includes(normalizedSearch) ||
        treatment.includes(normalizedSearch) ||
        notes.includes(normalizedSearch);

      const hasDetails =
        Boolean(record.diagnosis) ||
        Boolean(record.treatment) ||
        Boolean(record.notes);

      const matchesRecordFilter =
        recordFilter === "All" ||
        (recordFilter === "Complete" && hasDetails) ||
        (recordFilter === "With Notes" && Boolean(record.notes));

      return matchesSearch && matchesRecordFilter;
    });
  }, [records, searchTerm, recordFilter]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalRecords = records.length;

  const recordsWithDiagnosis = records.filter((record) =>
    Boolean(record.diagnosis),
  ).length;

  const recordsWithNotes = records.filter((record) =>
    Boolean(record.notes),
  ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-doctor-medical-records-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="smarthealth-doctor-medical-records-header">
        <div>
          <p className="smarthealth-doctor-medical-records-eyebrow">
            Doctor Portal
          </p>

          <h1 className="smarthealth-doctor-medical-records-title">
            Medical Records
          </h1>

          <p className="smarthealth-doctor-medical-records-description">
            Review and manage medical records created for your patients.
          </p>
        </div>

        <div className="smarthealth-doctor-medical-records-header-actions">
          <button
            type="button"
            className="smarthealth-doctor-medical-records-refresh-button"
            onClick={loadRecords}
            disabled={loadingRecords}
          >
            {loadingRecords ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="smarthealth-doctor-medical-records-create-button"
            onClick={handleOpenCreatePanel}
          >
            + Create Record
          </button>
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="smarthealth-doctor-medical-records-summary-grid">
        <div className="smarthealth-doctor-medical-records-summary-card">
          <span className="smarthealth-doctor-medical-records-summary-label">
            Total Records
          </span>

          <strong className="smarthealth-doctor-medical-records-summary-value">
            {totalRecords}
          </strong>
        </div>

        <div className="smarthealth-doctor-medical-records-summary-card">
          <span className="smarthealth-doctor-medical-records-summary-label">
            With Diagnosis
          </span>

          <strong className="smarthealth-doctor-medical-records-summary-value">
            {recordsWithDiagnosis}
          </strong>
        </div>

        <div className="smarthealth-doctor-medical-records-summary-card">
          <span className="smarthealth-doctor-medical-records-summary-label">
            With Notes
          </span>

          <strong className="smarthealth-doctor-medical-records-summary-value">
            {recordsWithNotes}
          </strong>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="smarthealth-doctor-medical-records-filter-panel">
        <div className="smarthealth-doctor-medical-records-search-wrapper">
          <label
            htmlFor="smarthealth-doctor-medical-records-search"
            className="smarthealth-doctor-medical-records-filter-label"
          >
            Search
          </label>

          <input
            id="smarthealth-doctor-medical-records-search"
            type="text"
            className="smarthealth-doctor-medical-records-search-input"
            placeholder="Search patient, diagnosis, treatment..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="smarthealth-doctor-medical-records-filter-wrapper">
          <label
            htmlFor="smarthealth-doctor-medical-records-filter"
            className="smarthealth-doctor-medical-records-filter-label"
          >
            Record Filter
          </label>

          <select
            id="smarthealth-doctor-medical-records-filter"
            className="smarthealth-doctor-medical-records-filter-select"
            value={recordFilter}
            onChange={(event) => setRecordFilter(event.target.value)}
          >
            <option value="All">All Records</option>

            <option value="Complete">With Details</option>

            <option value="With Notes">With Notes</option>
          </select>
        </div>
      </div>

      {/* ======================================================
          RECORD TABLE
      ====================================================== */}

      <div className="smarthealth-doctor-medical-records-table-card">
        <div className="smarthealth-doctor-medical-records-table-header">
          <div>
            <h2 className="smarthealth-doctor-medical-records-table-title">
              Patient Medical Records
            </h2>

            <p className="smarthealth-doctor-medical-records-table-subtitle">
              Medical records created by you for your patients.
            </p>
          </div>

          <span className="smarthealth-doctor-medical-records-result-count">
            {filteredRecords.length} record
            {filteredRecords.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loadingRecords ? (
          <div className="smarthealth-doctor-medical-records-state">
            <div className="smarthealth-doctor-medical-records-spinner" />

            <p>Loading medical records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="smarthealth-doctor-medical-records-state">
            <div className="smarthealth-doctor-medical-records-empty-icon">
              MR
            </div>

            <h3>No medical records found</h3>

            <p>There are no medical records matching your current filters.</p>
          </div>
        ) : (
          <div className="smarthealth-doctor-medical-records-table-wrapper">
            <table className="smarthealth-doctor-medical-records-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Appointment Date</th>
                  <th>Time</th>
                  <th>Diagnosis</th>
                  <th>Treatment</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.recordId}>
                    <td>
                      <div className="smarthealth-doctor-medical-records-patient-cell">
                        <span className="smarthealth-doctor-medical-records-patient-avatar">
                          {record.patientName?.charAt(0)?.toUpperCase() || "P"}
                        </span>

                        <span>{record.patientName || "Unknown Patient"}</span>
                      </div>
                    </td>

                    <td>{formatDate(record.appointmentDate)}</td>

                    <td>{formatTime(record.appointmentTime)}</td>

                    <td>
                      <span className="smarthealth-doctor-medical-records-table-text">
                        {record.diagnosis || "Not recorded"}
                      </span>
                    </td>

                    <td>
                      <span className="smarthealth-doctor-medical-records-table-text">
                        {record.treatment || "Not recorded"}
                      </span>
                    </td>

                    <td>{formatDate(record.createdAt)}</td>

                    <td>
                      <button
                        type="button"
                        className="smarthealth-doctor-medical-records-view-button"
                        onClick={() => handleViewRecord(record)}
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          VIEW RECORD MODAL
      ====================================================== */}

      {showRecordPanel && (
        <div className="smarthealth-doctor-medical-records-modal-backdrop">
          <div className="smarthealth-doctor-medical-records-modal">
            <div className="smarthealth-doctor-medical-records-modal-header">
              <div>
                <p className="smarthealth-doctor-medical-records-modal-eyebrow">
                  Medical Record
                </p>

                <h2 className="smarthealth-doctor-medical-records-modal-title">
                  {selectedRecord?.patientName || "Patient"}
                </h2>

                {selectedRecord && (
                  <p className="smarthealth-doctor-medical-records-modal-subtitle">
                    {formatDate(selectedRecord.appointmentDate)}

                    {" · "}

                    {formatTime(selectedRecord.appointmentTime)}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="smarthealth-doctor-medical-records-close-button"
                onClick={handleCloseRecordPanel}
                disabled={loadingRecord}
              >
                ×
              </button>
            </div>

            {loadingRecord ? (
              <div className="smarthealth-doctor-medical-records-modal-loading">
                <div className="smarthealth-doctor-medical-records-spinner" />

                <p>Loading medical record...</p>
              </div>
            ) : selectedRecord ? (
              <div className="smarthealth-doctor-medical-records-view-content">
                <div className="smarthealth-doctor-medical-records-view-section">
                  <span className="smarthealth-doctor-medical-records-view-label">
                    Patient
                  </span>

                  <p>{selectedRecord.patientName || "Unknown Patient"}</p>
                </div>

                <div className="smarthealth-doctor-medical-records-view-section">
                  <span className="smarthealth-doctor-medical-records-view-label">
                    Diagnosis
                  </span>

                  <p>{selectedRecord.diagnosis || "No diagnosis recorded."}</p>
                </div>

                <div className="smarthealth-doctor-medical-records-view-section">
                  <span className="smarthealth-doctor-medical-records-view-label">
                    Treatment
                  </span>

                  <p>{selectedRecord.treatment || "No treatment recorded."}</p>
                </div>

                <div className="smarthealth-doctor-medical-records-view-section">
                  <span className="smarthealth-doctor-medical-records-view-label">
                    Notes
                  </span>

                  <p>{selectedRecord.notes || "No notes recorded."}</p>
                </div>

                <div className="smarthealth-doctor-medical-records-created-info">
                  Created {formatDate(selectedRecord.createdAt)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ======================================================
          CREATE RECORD MODAL
      ====================================================== */}

      {showCreatePanel && (
        <div className="smarthealth-doctor-medical-records-modal-backdrop">
          <div className="smarthealth-doctor-medical-records-modal">
            <div className="smarthealth-doctor-medical-records-modal-header">
              <div>
                <p className="smarthealth-doctor-medical-records-modal-eyebrow">
                  Doctor Portal
                </p>

                <h2 className="smarthealth-doctor-medical-records-modal-title">
                  Create Medical Record
                </h2>

                <p className="smarthealth-doctor-medical-records-modal-subtitle">
                  Select an appointment and enter the patient's medical
                  information.
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-doctor-medical-records-close-button"
                onClick={handleCloseCreatePanel}
                disabled={savingRecord}
              >
                ×
              </button>
            </div>

            {selectedAppointment ? (
              <form
                className="smarthealth-doctor-medical-records-form"
                onSubmit={handleCreateRecord}
              >
                <div className="smarthealth-doctor-medical-records-form-info">
                  <strong>
                    {selectedAppointment.patientName || "Unknown Patient"}
                  </strong>

                  <br />

                  {formatDate(selectedAppointment.appointmentDate)}

                  {" · "}

                  {formatTime(selectedAppointment.appointmentTime)}
                </div>

                <div className="smarthealth-doctor-medical-records-form-group">
                  <label
                    htmlFor="smarthealth-doctor-medical-records-diagnosis"
                    className="smarthealth-doctor-medical-records-form-label"
                  >
                    Diagnosis
                  </label>

                  <textarea
                    id="smarthealth-doctor-medical-records-diagnosis"
                    name="diagnosis"
                    className="smarthealth-doctor-medical-records-form-textarea"
                    placeholder="Enter diagnosis..."
                    value={formData.diagnosis}
                    onChange={handleFormChange}
                    rows="4"
                  />
                </div>

                <div className="smarthealth-doctor-medical-records-form-group">
                  <label
                    htmlFor="smarthealth-doctor-medical-records-treatment"
                    className="smarthealth-doctor-medical-records-form-label"
                  >
                    Treatment
                  </label>

                  <textarea
                    id="smarthealth-doctor-medical-records-treatment"
                    name="treatment"
                    className="smarthealth-doctor-medical-records-form-textarea"
                    placeholder="Enter treatment details..."
                    value={formData.treatment}
                    onChange={handleFormChange}
                    rows="4"
                  />
                </div>

                <div className="smarthealth-doctor-medical-records-form-group">
                  <label
                    htmlFor="smarthealth-doctor-medical-records-notes"
                    className="smarthealth-doctor-medical-records-form-label"
                  >
                    Notes
                  </label>

                  <textarea
                    id="smarthealth-doctor-medical-records-notes"
                    name="notes"
                    className="smarthealth-doctor-medical-records-form-textarea"
                    placeholder="Enter additional notes..."
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="5"
                  />
                </div>

                <div className="smarthealth-doctor-medical-records-form-actions">
                  <button
                    type="button"
                    className="smarthealth-doctor-medical-records-cancel-button"
                    onClick={handleCloseCreatePanel}
                    disabled={savingRecord}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="smarthealth-doctor-medical-records-save-button"
                    disabled={savingRecord}
                  >
                    {savingRecord ? "Creating..." : "Create Medical Record"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="smarthealth-doctor-medical-records-appointment-selection">
                <div className="smarthealth-doctor-medical-records-appointment-selection-header">
                  <h3>Select Appointment</h3>

                  <p>
                    Choose an appointment that does not already have a medical
                    record.
                  </p>
                </div>

                {loadingAppointments ? (
                  <div className="smarthealth-doctor-medical-records-state">
                    <div className="smarthealth-doctor-medical-records-spinner" />

                    <p>Loading appointments...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="smarthealth-doctor-medical-records-state">
                    <div className="smarthealth-doctor-medical-records-empty-icon">
                      AP
                    </div>

                    <h3>No appointments found</h3>

                    <p>
                      There are no appointments available for creating a medical
                      record.
                    </p>
                  </div>
                ) : (
                  <div className="smarthealth-doctor-medical-records-appointment-list">
                    {appointments.map((appointment) => (
                      <button
                        key={appointment.appointmentId}
                        type="button"
                        className="smarthealth-doctor-medical-records-appointment-item"
                        onClick={() =>
                          handleSelectAppointmentForCreate(appointment)
                        }
                      >
                        <span className="smarthealth-doctor-medical-records-appointment-avatar">
                          {appointment.patientName?.charAt(0)?.toUpperCase() ||
                            "P"}
                        </span>

                        <span className="smarthealth-doctor-medical-records-appointment-details">
                          <strong>
                            {appointment.patientName || "Unknown Patient"}
                          </strong>

                          <small>
                            {formatDate(appointment.appointmentDate)}

                            {" · "}

                            {formatTime(appointment.appointmentTime)}
                          </small>
                        </span>

                        <span className="smarthealth-doctor-medical-records-appointment-arrow">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMedicalRecords;
