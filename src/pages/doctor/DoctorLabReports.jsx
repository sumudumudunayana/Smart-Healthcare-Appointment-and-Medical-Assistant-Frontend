import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import labReportService from "../../services/labReportService";
import medicalRecordService from "../../services/medicalRecordService";

import "../../styles/pages/doctor/DoctorLabReports.css";

const DoctorLabReports = () => {
  const [labReports, setLabReports] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [recordFilter, setRecordFilter] = useState("all");

  const [selectedReport, setSelectedReport] = useState(null);

  const [formData, setFormData] = useState({
    recordId: "",
    reportName: "",
    reportType: "",
    filePath: "",
  });

  const loadLabReports = async () => {
    try {
      setLoadingReports(true);

      const data = await labReportService.getMyDoctorReports();

      setLabReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load lab reports:", error);

      const message =
        error.response?.data?.message ||
        "Failed to load lab reports.";

      toast.error(message);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      setLoadingRecords(true);

      const data =
        await medicalRecordService.getMyDoctorRecords();

      setMedicalRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to load medical records:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Failed to load medical records.";

      toast.error(message);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadLabReports();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

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

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredLabReports = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return labReports.filter((report) => {
      const matchesSearch =
        !normalizedSearch ||
        report.patientName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        report.reportName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        report.reportType
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        report.doctorName
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesRecord =
        recordFilter === "all" ||
        report.recordId === recordFilter;

      return matchesSearch && matchesRecord;
    });
  }, [labReports, searchTerm, recordFilter]);

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
      reportName: "",
      reportType: "",
      filePath: "",
    });
  };

  const handleOpenCreatePanel = async () => {
    resetForm();
    setSelectedReport(null);
    setShowCreatePanel(true);

    if (medicalRecords.length === 0) {
      await loadMedicalRecords();
    }
  };

  const handleCloseCreatePanel = () => {
    if (savingReport) return;

    setShowCreatePanel(false);
    resetForm();
  };

  const handleCreateReport = async (event) => {
    event.preventDefault();

    if (!formData.recordId) {
      toast.error("Please select a medical record.");
      return;
    }

    if (!formData.reportName.trim()) {
      toast.error("Report name is required.");
      return;
    }

    try {
      setSavingReport(true);

      const requestData = {
        recordId: formData.recordId,
        reportName: formData.reportName.trim(),
        reportType:
          formData.reportType.trim() || null,
        filePath:
          formData.filePath.trim() || null,
      };

      const createdReport =
        await labReportService.create(requestData);

      toast.success(
        "Lab report created successfully."
      );

      setLabReports((previous) => [
        createdReport,
        ...previous,
      ]);

      setSelectedReport(createdReport);
      setShowCreatePanel(false);
      resetForm();
    } catch (error) {
      console.error(
        "Failed to create lab report:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Failed to create lab report.";

      toast.error(message);
    } finally {
      setSavingReport(false);
    }
  };

  const totalReports = labReports.length;

  const uniquePatients = new Set(
    labReports.map((report) => report.patientId)
  ).size;

  const reportTypes = new Set(
    labReports
      .map((report) => report.reportType)
      .filter(Boolean)
  ).size;

  const recentReports = labReports.filter((report) => {
    if (!report.uploadedAt) return false;

    const uploadedDate = new Date(
      report.uploadedAt
    );

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    return uploadedDate >= sevenDaysAgo;
  }).length;

  return (
    <div className="smarthealth-doctor-lab-reports-page">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="smarthealth-doctor-lab-reports-header">
        <div className="smarthealth-doctor-lab-reports-header-info">
          <span className="smarthealth-doctor-lab-reports-header-label">
            MEDICAL MANAGEMENT
          </span>

          <h1 className="smarthealth-doctor-lab-reports-title">
            Lab Reports
          </h1>

          <p className="smarthealth-doctor-lab-reports-description">
            Manage laboratory reports associated with
            your patients' medical records.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-doctor-lab-reports-create-button"
          onClick={handleOpenCreatePanel}
        >
          <span className="smarthealth-doctor-lab-reports-create-icon">
            +
          </span>

          New Lab Report
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}
      <div className="smarthealth-doctor-lab-reports-summary-grid">
        <div className="smarthealth-doctor-lab-reports-summary-card">
          <div className="smarthealth-doctor-lab-reports-summary-icon">
            LR
          </div>

          <div>
            <span className="smarthealth-doctor-lab-reports-summary-label">
              Total Reports
            </span>

            <strong className="smarthealth-doctor-lab-reports-summary-value">
              {totalReports}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-lab-reports-summary-card">
          <div className="smarthealth-doctor-lab-reports-summary-icon">
            P
          </div>

          <div>
            <span className="smarthealth-doctor-lab-reports-summary-label">
              Patients
            </span>

            <strong className="smarthealth-doctor-lab-reports-summary-value">
              {uniquePatients}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-lab-reports-summary-card">
          <div className="smarthealth-doctor-lab-reports-summary-icon">
            T
          </div>

          <div>
            <span className="smarthealth-doctor-lab-reports-summary-label">
              Report Types
            </span>

            <strong className="smarthealth-doctor-lab-reports-summary-value">
              {reportTypes}
            </strong>
          </div>
        </div>

        <div className="smarthealth-doctor-lab-reports-summary-card">
          <div className="smarthealth-doctor-lab-reports-summary-icon">
            7d
          </div>

          <div>
            <span className="smarthealth-doctor-lab-reports-summary-label">
              Last 7 Days
            </span>

            <strong className="smarthealth-doctor-lab-reports-summary-value">
              {recentReports}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}
      <div className="smarthealth-doctor-lab-reports-toolbar">
        <div className="smarthealth-doctor-lab-reports-search-wrapper">
          <span className="smarthealth-doctor-lab-reports-search-icon">
            ⌕
          </span>

          <input
            type="text"
            className="smarthealth-doctor-lab-reports-search-input"
            placeholder="Search patient, report name, type..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          className="smarthealth-doctor-lab-reports-filter-select"
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
          className="smarthealth-doctor-lab-reports-refresh-button"
          onClick={loadLabReports}
          disabled={loadingReports}
        >
          {loadingReports
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div className="smarthealth-doctor-lab-reports-content">
        {loadingReports ? (
          <div className="smarthealth-doctor-lab-reports-loading">
            <div className="smarthealth-doctor-lab-reports-spinner" />

            <p>Loading lab reports...</p>
          </div>
        ) : filteredLabReports.length === 0 ? (
          <div className="smarthealth-doctor-lab-reports-empty">
            <div className="smarthealth-doctor-lab-reports-empty-icon">
              LR
            </div>

            <h2>No lab reports found</h2>

            <p>
              {searchTerm ||
              recordFilter !== "all"
                ? "Try changing your search or filter."
                : "Create your first lab report to see it here."}
            </p>

            {!searchTerm &&
              recordFilter === "all" && (
                <button
                  type="button"
                  className="smarthealth-doctor-lab-reports-empty-button"
                  onClick={handleOpenCreatePanel}
                >
                  Create Lab Report
                </button>
              )}
          </div>
        ) : (
          <div className="smarthealth-doctor-lab-reports-table-wrapper">
            <table className="smarthealth-doctor-lab-reports-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Medical Record</th>
                  <th>Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLabReports.map(
                  (report) => (
                    <tr key={report.labReportId}>
                      <td>
                        <div className="smarthealth-doctor-lab-reports-patient-cell">
                          <div className="smarthealth-doctor-lab-reports-patient-avatar">
                            {report.patientName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "P"}
                          </div>

                          <div>
                            <strong>
                              {report.patientName ||
                                "Unknown Patient"}
                            </strong>

                            <span>
                              Patient
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="smarthealth-doctor-lab-reports-report-cell">
                          <span className="smarthealth-doctor-lab-reports-report-icon">
                            LR
                          </span>

                          <div>
                            <strong>
                              {report.reportName}
                            </strong>

                            <span>
                              {report.reportType ||
                                "Laboratory Report"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="smarthealth-doctor-lab-reports-type-badge">
                          {report.reportType ||
                            "General"}
                        </span>
                      </td>

                      <td>
                        <span className="smarthealth-doctor-lab-reports-record-text">
                          {report.recordId
                            ? `${report.recordId.slice(
                                0,
                                8
                              )}...`
                            : "N/A"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          report.uploadedAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="smarthealth-doctor-lab-reports-view-button"
                          onClick={() =>
                            setSelectedReport(
                              report
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

      {/* =====================================================
          VIEW REPORT MODAL
      ====================================================== */}
      {selectedReport &&
        !showCreatePanel && (
          <div
            className="smarthealth-doctor-lab-reports-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedReport(null);
              }
            }}
          >
            <div className="smarthealth-doctor-lab-reports-view-modal">
              <div className="smarthealth-doctor-lab-reports-modal-header">
                <div>
                  <span className="smarthealth-doctor-lab-reports-modal-label">
                    LAB REPORT DETAILS
                  </span>

                  <h2>
                    {selectedReport.reportName}
                  </h2>
                </div>

                <button
                  type="button"
                  className="smarthealth-doctor-lab-reports-modal-close"
                  onClick={() =>
                    setSelectedReport(null)
                  }
                >
                  ×
                </button>
              </div>

              <div className="smarthealth-doctor-lab-reports-details">
                {/* Patient */}
                <div className="smarthealth-doctor-lab-reports-detail-patient">
                  <div className="smarthealth-doctor-lab-reports-detail-avatar">
                    {selectedReport.patientName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "P"}
                  </div>

                  <div>
                    <span>Patient</span>

                    <strong>
                      {selectedReport.patientName ||
                        "Unknown Patient"}
                    </strong>
                  </div>
                </div>

                {/* Details */}
                <div className="smarthealth-doctor-lab-reports-detail-grid">
                  <div className="smarthealth-doctor-lab-reports-detail-item">
                    <span>Report Name</span>

                    <strong>
                      {selectedReport.reportName}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-lab-reports-detail-item">
                    <span>Report Type</span>

                    <strong>
                      {selectedReport.reportType ||
                        "General"}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-lab-reports-detail-item">
                    <span>Doctor</span>

                    <strong>
                      {selectedReport.doctorName ||
                        "N/A"}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-lab-reports-detail-item">
                    <span>Uploaded</span>

                    <strong>
                      {formatDateTime(
                        selectedReport.uploadedAt
                      )}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-lab-reports-detail-item smarthealth-doctor-lab-reports-detail-item-wide">
                    <span>Medical Record ID</span>

                    <strong className="smarthealth-doctor-lab-reports-record-id">
                      {selectedReport.recordId ||
                        "N/A"}
                    </strong>
                  </div>

                  <div className="smarthealth-doctor-lab-reports-detail-item smarthealth-doctor-lab-reports-detail-item-wide">
                    <span>Report ID</span>

                    <strong className="smarthealth-doctor-lab-reports-record-id">
                      {selectedReport.labReportId ||
                        "N/A"}
                    </strong>
                  </div>
                </div>

                {/* File Path */}
                <div className="smarthealth-doctor-lab-reports-file-section">
                  <span>Report File</span>

                  {selectedReport.filePath ? (
                    <div className="smarthealth-doctor-lab-reports-file-card">
                      <div className="smarthealth-doctor-lab-reports-file-icon">
                        ↗
                      </div>

                      <div className="smarthealth-doctor-lab-reports-file-info">
                        <strong>
                          Report file available
                        </strong>

                        <span>
                          {selectedReport.filePath}
                        </span>
                      </div>

                      <a
                        href={
                          selectedReport.filePath
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="smarthealth-doctor-lab-reports-file-link"
                      >
                        Open
                      </a>
                    </div>
                  ) : (
                    <div className="smarthealth-doctor-lab-reports-no-file">
                      <span>
                        No report file/path has
                        been provided.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="smarthealth-doctor-lab-reports-modal-footer">
                <button
                  type="button"
                  className="smarthealth-doctor-lab-reports-secondary-button"
                  onClick={() =>
                    setSelectedReport(null)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          CREATE REPORT MODAL
      ====================================================== */}
      {showCreatePanel && (
        <div
          className="smarthealth-doctor-lab-reports-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !savingReport
            ) {
              handleCloseCreatePanel();
            }
          }}
        >
          <div className="smarthealth-doctor-lab-reports-create-modal">
            <div className="smarthealth-doctor-lab-reports-modal-header">
              <div>
                <span className="smarthealth-doctor-lab-reports-modal-label">
                  MEDICAL MANAGEMENT
                </span>

                <h2>Create Lab Report</h2>
              </div>

              <button
                type="button"
                className="smarthealth-doctor-lab-reports-modal-close"
                onClick={
                  handleCloseCreatePanel
                }
                disabled={savingReport}
              >
                ×
              </button>
            </div>

            <form
              className="smarthealth-doctor-lab-reports-form"
              onSubmit={handleCreateReport}
            >
              {/* Medical Record */}
              <div className="smarthealth-doctor-lab-reports-form-group">
                <label htmlFor="smarthealth-lab-report-record">
                  Medical Record
                  <span>*</span>
                </label>

                <select
                  id="smarthealth-lab-report-record"
                  name="recordId"
                  value={formData.recordId}
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    loadingRecords ||
                    savingReport
                  }
                  required
                >
                  <option value="">
                    {loadingRecords
                      ? "Loading medical records..."
                      : "Select a medical record"}
                  </option>

                  {medicalRecords.map(
                    (record) => (
                      <option
                        key={record.recordId}
                        value={
                          record.recordId
                        }
                      >
                        {record.patientName} —{" "}
                        {formatDate(
                          record.appointmentDate
                        )}
                        {record.diagnosis
                          ? ` — ${record.diagnosis}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Report Name */}
              <div className="smarthealth-doctor-lab-reports-form-group">
                <label htmlFor="smarthealth-lab-report-name">
                  Report Name
                  <span>*</span>
                </label>

                <input
                  id="smarthealth-lab-report-name"
                  type="text"
                  name="reportName"
                  placeholder="e.g. Complete Blood Count"
                  value={formData.reportName}
                  onChange={
                    handleInputChange
                  }
                  disabled={savingReport}
                  required
                />
              </div>

              {/* Report Type */}
              <div className="smarthealth-doctor-lab-reports-form-group">
                <label htmlFor="smarthealth-lab-report-type">
                  Report Type
                </label>

                <input
                  id="smarthealth-lab-report-type"
                  type="text"
                  name="reportType"
                  placeholder="e.g. Blood Test, X-Ray, MRI"
                  value={formData.reportType}
                  onChange={
                    handleInputChange
                  }
                  disabled={savingReport}
                />
              </div>

              {/* File Path */}
              <div className="smarthealth-doctor-lab-reports-form-group">
                <label htmlFor="smarthealth-lab-report-file-path">
                  Report File / URL
                </label>

                <input
                  id="smarthealth-lab-report-file-path"
                  type="text"
                  name="filePath"
                  placeholder="e.g. https://example.com/report.pdf"
                  value={formData.filePath}
                  onChange={
                    handleInputChange
                  }
                  disabled={savingReport}
                />

                <small className="smarthealth-doctor-lab-reports-form-help">
                  Enter the stored report path or
                  URL. File uploading is not
                  implemented by the current
                  backend.
                </small>
              </div>

              {/* Footer */}
              <div className="smarthealth-doctor-lab-reports-form-footer">
                <button
                  type="button"
                  className="smarthealth-doctor-lab-reports-secondary-button"
                  onClick={
                    handleCloseCreatePanel
                  }
                  disabled={savingReport}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-doctor-lab-reports-submit-button"
                  disabled={savingReport}
                >
                  {savingReport
                    ? "Creating..."
                    : "Create Lab Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLabReports;