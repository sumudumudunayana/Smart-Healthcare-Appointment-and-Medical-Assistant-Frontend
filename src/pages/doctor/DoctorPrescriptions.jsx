import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import prescriptionService from "../../services/prescriptionService";
import medicalRecordService from "../../services/medicalRecordService";

import "../../styles/pages/doctor/DoctorPrescriptions.css";

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [recordFilter, setRecordFilter] = useState("all");

  const [formData, setFormData] = useState({
    recordId: "",
    medicine: "",
    dosage: "",
    duration: "",
    frequency: "",
    instructions: "",
  });

  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // ============================================================
  // LOAD PRESCRIPTIONS
  // ============================================================

  const loadPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);

      const data =
        await prescriptionService.getMyDoctorPrescriptions();

      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);

      const message =
        error.response?.data?.message ||
        "Failed to load prescriptions.";

      toast.error(message);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // ============================================================
  // LOAD MEDICAL RECORDS
  // ============================================================

  const loadMedicalRecords = async () => {
    try {
      setLoadingRecords(true);

      const data =
        await medicalRecordService.getMyDoctorRecords();

      setMedicalRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load medical records:", error);

      const message =
        error.response?.data?.message ||
        "Failed to load medical records.";

      toast.error(message);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================================
  // FILTER PRESCRIPTIONS
  // ============================================================

  const filteredPrescriptions = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return prescriptions.filter((prescription) => {
      const matchesSearch =
        !normalizedSearch ||
        prescription.patientName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        prescription.medicine
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        prescription.dosage
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        prescription.frequency
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        prescription.duration
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesRecord =
        recordFilter === "all" ||
        prescription.recordId === recordFilter;

      return matchesSearch && matchesRecord;
    });
  }, [prescriptions, searchTerm, recordFilter]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      recordId: "",
      medicine: "",
      dosage: "",
      duration: "",
      frequency: "",
      instructions: "",
    });
  };

  // ============================================================
  // OPEN CREATE PANEL
  // ============================================================

  const handleOpenCreatePanel = async () => {
    resetForm();
    setSelectedPrescription(null);
    setShowCreatePanel(true);

    if (medicalRecords.length === 0) {
      await loadMedicalRecords();
    }
  };

  // ============================================================
  // CLOSE CREATE PANEL
  // ============================================================

  const handleCloseCreatePanel = () => {
    if (savingPrescription) {
      return;
    }

    setShowCreatePanel(false);
    resetForm();
  };

  // ============================================================
  // CREATE PRESCRIPTION
  // ============================================================

  const handleCreatePrescription = async (event) => {
    event.preventDefault();

    if (!formData.recordId) {
      toast.error("Please select a medical record.");
      return;
    }

    if (!formData.medicine.trim()) {
      toast.error("Medicine is required.");
      return;
    }

    if (!formData.dosage.trim()) {
      toast.error("Dosage is required.");
      return;
    }

    if (!formData.duration.trim()) {
      toast.error("Duration is required.");
      return;
    }

    try {
      setSavingPrescription(true);

      const requestData = {
        recordId: formData.recordId,
        medicine: formData.medicine.trim(),
        dosage: formData.dosage.trim(),
        duration: formData.duration.trim(),
        frequency: formData.frequency.trim() || null,
        instructions: formData.instructions.trim() || null,
      };

      const createdPrescription =
        await prescriptionService.create(requestData);

      toast.success("Prescription created successfully.");

      setPrescriptions((previous) => [
        createdPrescription,
        ...previous,
      ]);

      setSelectedPrescription(createdPrescription);

      setShowCreatePanel(false);
      resetForm();
    } catch (error) {
      console.error(
        "Failed to create prescription:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Failed to create prescription.";

      toast.error(message);
    } finally {
      setSavingPrescription(false);
    }
  };

  // ============================================================
  // SUMMARY DATA
  // ============================================================

  const totalPrescriptions = prescriptions.length;

  const uniquePatients = new Set(
    prescriptions.map(
      (prescription) => prescription.patientId
    )
  ).size;

  const recentPrescriptions = prescriptions.filter(
    (prescription) => {
      if (!prescription.createdAt) {
        return false;
      }

      const createdDate =
        new Date(prescription.createdAt);

      const sevenDaysAgo = new Date();

      sevenDaysAgo.setDate(
        sevenDaysAgo.getDate() - 7
      );

      return createdDate >= sevenDaysAgo;
    }
  ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-doctor-prescriptions-page">

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="smarthealth-doctor-prescriptions-header">

        <div className="smarthealth-doctor-prescriptions-header-info">
          <span className="smarthealth-doctor-prescriptions-header-label">
            MEDICAL MANAGEMENT
          </span>

          <h1 className="smarthealth-doctor-prescriptions-title">
            Prescriptions
          </h1>

          <p className="smarthealth-doctor-prescriptions-description">
            Create and manage prescriptions for your
            patients.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-doctor-prescriptions-create-button"
          onClick={handleOpenCreatePanel}
        >
          <span className="smarthealth-doctor-prescriptions-create-icon">
            +
          </span>

          New Prescription
        </button>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ======================================================= */}

      <div className="smarthealth-doctor-prescriptions-summary-grid">

        <div className="smarthealth-doctor-prescriptions-summary-card">
          <div className="smarthealth-doctor-prescriptions-summary-icon">
            Rx
          </div>

          <div>
            <span className="smarthealth-doctor-prescriptions-summary-label">
              Total Prescriptions
            </span>

            <strong className="smarthealth-doctor-prescriptions-summary-value">
              {totalPrescriptions}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-prescriptions-summary-card">
          <div className="smarthealth-doctor-prescriptions-summary-icon">
            P
          </div>

          <div>
            <span className="smarthealth-doctor-prescriptions-summary-label">
              Patients
            </span>

            <strong className="smarthealth-doctor-prescriptions-summary-value">
              {uniquePatients}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-prescriptions-summary-card">
          <div className="smarthealth-doctor-prescriptions-summary-icon">
            7d
          </div>

          <div>
            <span className="smarthealth-doctor-prescriptions-summary-label">
              Last 7 Days
            </span>

            <strong className="smarthealth-doctor-prescriptions-summary-value">
              {recentPrescriptions}
            </strong>
          </div>
        </div>

      </div>

      {/* ======================================================
          FILTER BAR
      ======================================================= */}

      <div className="smarthealth-doctor-prescriptions-toolbar">

        <div className="smarthealth-doctor-prescriptions-search-wrapper">
          <span className="smarthealth-doctor-prescriptions-search-icon">
            ⌕
          </span>

          <input
            type="text"
            className="smarthealth-doctor-prescriptions-search-input"
            placeholder="Search patient, medicine, dosage..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          className="smarthealth-doctor-prescriptions-filter-select"
          value={recordFilter}
          onChange={(event) =>
            setRecordFilter(event.target.value)
          }
        >
          <option value="all">
            All Medical Records
          </option>

          {medicalRecords.map((record) => (
            <option
              key={record.recordId}
              value={record.recordId}
            >
              {record.patientName} -{" "}
              {formatDate(record.appointmentDate)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="smarthealth-doctor-prescriptions-refresh-button"
          onClick={loadPrescriptions}
          disabled={loadingPrescriptions}
        >
          {loadingPrescriptions
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div className="smarthealth-doctor-prescriptions-content">

        {loadingPrescriptions ? (
          <div className="smarthealth-doctor-prescriptions-loading">
            <div className="smarthealth-doctor-prescriptions-spinner" />

            <p>
              Loading prescriptions...
            </p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="smarthealth-doctor-prescriptions-empty">

            <div className="smarthealth-doctor-prescriptions-empty-icon">
              Rx
            </div>

            <h2>
              No prescriptions found
            </h2>

            <p>
              {searchTerm || recordFilter !== "all"
                ? "Try changing your search or filter."
                : "Create your first prescription to see it here."}
            </p>

            {!searchTerm &&
              recordFilter === "all" && (
                <button
                  type="button"
                  className="smarthealth-doctor-prescriptions-empty-button"
                  onClick={handleOpenCreatePanel}
                >
                  Create Prescription
                </button>
              )}

          </div>
        ) : (
          <div className="smarthealth-doctor-prescriptions-table-wrapper">

            <table className="smarthealth-doctor-prescriptions-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrescriptions.map(
                  (prescription) => (
                    <tr
                      key={
                        prescription.prescriptionId
                      }
                    >

                      <td>
                        <div className="smarthealth-doctor-prescriptions-patient-cell">
                          <div className="smarthealth-doctor-prescriptions-patient-avatar">
                            {prescription.patientName
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </div>

                          <div>
                            <strong>
                              {prescription.patientName ||
                                "Unknown Patient"}
                            </strong>

                            <span>
                              Medical Record
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="smarthealth-doctor-prescriptions-medicine">
                          {prescription.medicine}
                        </span>
                      </td>

                      <td>
                        {prescription.dosage}
                      </td>

                      <td>
                        {prescription.frequency ||
                          "As directed"}
                      </td>

                      <td>
                        {prescription.duration}
                      </td>

                      <td>
                        {formatDate(
                          prescription.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="smarthealth-doctor-prescriptions-view-button"
                          onClick={() =>
                            setSelectedPrescription(
                              prescription
                            )
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ======================================================
          VIEW PRESCRIPTION MODAL
      ======================================================= */}

      {selectedPrescription && !showCreatePanel && (
        <div
          className="smarthealth-doctor-prescriptions-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedPrescription(null);
            }
          }}
        >

          <div className="smarthealth-doctor-prescriptions-view-modal">

            <div className="smarthealth-doctor-prescriptions-modal-header">

              <div>
                <span className="smarthealth-doctor-prescriptions-modal-label">
                  PRESCRIPTION DETAILS
                </span>

                <h2>
                  {selectedPrescription.medicine}
                </h2>
              </div>

              <button
                type="button"
                className="smarthealth-doctor-prescriptions-modal-close"
                onClick={() =>
                  setSelectedPrescription(null)
                }
              >
                ×
              </button>

            </div>

            <div className="smarthealth-doctor-prescriptions-details">

              <div className="smarthealth-doctor-prescriptions-detail-patient">
                <div className="smarthealth-doctor-prescriptions-detail-avatar">
                  {selectedPrescription.patientName
                    ?.charAt(0)
                    ?.toUpperCase() || "P"}
                </div>

                <div>
                  <span>Patient</span>

                  <strong>
                    {selectedPrescription.patientName ||
                      "Unknown Patient"}
                  </strong>
                </div>
              </div>

              <div className="smarthealth-doctor-prescriptions-detail-grid">

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Medicine</span>
                  <strong>
                    {selectedPrescription.medicine}
                  </strong>
                </div>

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Dosage</span>
                  <strong>
                    {selectedPrescription.dosage}
                  </strong>
                </div>

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Frequency</span>
                  <strong>
                    {selectedPrescription.frequency ||
                      "As directed"}
                  </strong>
                </div>

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Duration</span>
                  <strong>
                    {selectedPrescription.duration}
                  </strong>
                </div>

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Created</span>
                  <strong>
                    {formatDate(
                      selectedPrescription.createdAt
                    )}
                  </strong>
                </div>

                <div className="smarthealth-doctor-prescriptions-detail-item">
                  <span>Record ID</span>
                  <strong className="smarthealth-doctor-prescriptions-record-id">
                    {selectedPrescription.recordId}
                  </strong>
                </div>

              </div>

              <div className="smarthealth-doctor-prescriptions-instructions">

                <span>
                  Instructions
                </span>

                <p>
                  {selectedPrescription.instructions ||
                    "No special instructions provided."}
                </p>

              </div>

            </div>

            <div className="smarthealth-doctor-prescriptions-modal-footer">

              <button
                type="button"
                className="smarthealth-doctor-prescriptions-secondary-button"
                onClick={() =>
                  setSelectedPrescription(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          CREATE PRESCRIPTION MODAL
      ======================================================= */}

      {showCreatePanel && (
        <div
          className="smarthealth-doctor-prescriptions-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingPrescription
            ) {
              handleCloseCreatePanel();
            }
          }}
        >

          <div className="smarthealth-doctor-prescriptions-create-modal">

            <div className="smarthealth-doctor-prescriptions-modal-header">

              <div>
                <span className="smarthealth-doctor-prescriptions-modal-label">
                  MEDICAL MANAGEMENT
                </span>

                <h2>
                  Create Prescription
                </h2>
              </div>

              <button
                type="button"
                className="smarthealth-doctor-prescriptions-modal-close"
                onClick={handleCloseCreatePanel}
                disabled={savingPrescription}
              >
                ×
              </button>

            </div>

            <form
              className="smarthealth-doctor-prescriptions-form"
              onSubmit={handleCreatePrescription}
            >

              <div className="smarthealth-doctor-prescriptions-form-group">

                <label htmlFor="smarthealth-prescription-record">
                  Medical Record
                  <span>*</span>
                </label>

                <select
                  id="smarthealth-prescription-record"
                  name="recordId"
                  value={formData.recordId}
                  onChange={handleInputChange}
                  disabled={
                    loadingRecords ||
                    savingPrescription
                  }
                  required
                >
                  <option value="">
                    {loadingRecords
                      ? "Loading medical records..."
                      : "Select a medical record"}
                  </option>

                  {medicalRecords.map((record) => (
                    <option
                      key={record.recordId}
                      value={record.recordId}
                    >
                      {record.patientName} —{" "}
                      {formatDate(
                        record.appointmentDate
                      )}
                      {record.diagnosis
                        ? ` — ${record.diagnosis}`
                        : ""}
                    </option>
                  ))}
                </select>

              </div>

              <div className="smarthealth-doctor-prescriptions-form-row">

                <div className="smarthealth-doctor-prescriptions-form-group">

                  <label htmlFor="smarthealth-prescription-medicine">
                    Medicine
                    <span>*</span>
                  </label>

                  <input
                    id="smarthealth-prescription-medicine"
                    type="text"
                    name="medicine"
                    placeholder="e.g. Amoxicillin"
                    value={formData.medicine}
                    onChange={handleInputChange}
                    disabled={savingPrescription}
                    required
                  />

                </div>

                <div className="smarthealth-doctor-prescriptions-form-group">

                  <label htmlFor="smarthealth-prescription-dosage">
                    Dosage
                    <span>*</span>
                  </label>

                  <input
                    id="smarthealth-prescription-dosage"
                    type="text"
                    name="dosage"
                    placeholder="e.g. 500 mg"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    disabled={savingPrescription}
                    required
                  />

                </div>

              </div>

              <div className="smarthealth-doctor-prescriptions-form-row">

                <div className="smarthealth-doctor-prescriptions-form-group">

                  <label htmlFor="smarthealth-prescription-frequency">
                    Frequency
                  </label>

                  <input
                    id="smarthealth-prescription-frequency"
                    type="text"
                    name="frequency"
                    placeholder="e.g. 3 times daily"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    disabled={savingPrescription}
                  />

                </div>

                <div className="smarthealth-doctor-prescriptions-form-group">

                  <label htmlFor="smarthealth-prescription-duration">
                    Duration
                    <span>*</span>
                  </label>

                  <input
                    id="smarthealth-prescription-duration"
                    type="text"
                    name="duration"
                    placeholder="e.g. 7 days"
                    value={formData.duration}
                    onChange={handleInputChange}
                    disabled={savingPrescription}
                    required
                  />

                </div>

              </div>

              <div className="smarthealth-doctor-prescriptions-form-group">

                <label htmlFor="smarthealth-prescription-instructions">
                  Instructions
                </label>

                <textarea
                  id="smarthealth-prescription-instructions"
                  name="instructions"
                  rows="4"
                  placeholder="e.g. Take after meals..."
                  value={formData.instructions}
                  onChange={handleInputChange}
                  disabled={savingPrescription}
                />

              </div>

              <div className="smarthealth-doctor-prescriptions-form-footer">

                <button
                  type="button"
                  className="smarthealth-doctor-prescriptions-secondary-button"
                  onClick={handleCloseCreatePanel}
                  disabled={savingPrescription}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-doctor-prescriptions-submit-button"
                  disabled={savingPrescription}
                >
                  {savingPrescription
                    ? "Creating..."
                    : "Create Prescription"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default DoctorPrescriptions;