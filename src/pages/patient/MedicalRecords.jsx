import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import api from "../../services/api";
import "../../styles/pages/patient/MedicalRecords.css";

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const normalizeStatusText = (value) =>
  String(value ?? "").trim().toLowerCase();

const normalizeDate = (value) =>
  String(value ?? "").slice(0, 10);

const normalizeTime = (value) =>
  String(value ?? "").slice(0, 5);

const formatDate = (value) => {
  const dateString = normalizeDate(value);

  if (!dateString) {
    return "Date unavailable";
  }

  // Use noon to avoid date shifts caused by timezone conversion.
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  const timeString = normalizeTime(value);

  if (!timeString) {
    return "Time unavailable";
  }

  const [hours, minutes] = timeString.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.title ||
  fallback;

const getRecordDate = (record) => {
  const date = normalizeDate(record.appointmentDate);

  if (!date) {
    return "";
  }

  return date;
};

/* =========================================================
   MEDICAL RECORDS COMPONENT
========================================================= */

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /* =======================================================
     LOAD PATIENT MEDICAL RECORDS
  ======================================================= */

  const loadMedicalRecords = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const response = await api.get("/MedicalRecords/my");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      // Sort newest appointment dates first.
      data.sort((a, b) => {
        const dateA = getRecordDate(a);
        const dateB = getRecordDate(b);

        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }

        return normalizeTime(b.appointmentTime).localeCompare(
          normalizeTime(a.appointmentTime),
        );
      });

      setRecords(data);
    } catch (error) {
      console.error("Failed to load medical records:", error);

      setRecords([]);
      setLoadError(true);

      toast.error(
        getErrorMessage(
          error,
          "Unable to load your medical records. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicalRecords();
  }, [loadMedicalRecords, refreshKey]);

  /* =======================================================
     SEARCH AND FILTER
  ======================================================= */

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const doctorName = String(
        record.doctorName ?? "",
      ).toLowerCase();

      const diagnosis = String(
        record.diagnosis ?? "",
      ).toLowerCase();

      const treatment = String(
        record.treatment ?? "",
      ).toLowerCase();

      const notes = String(
        record.notes ?? "",
      ).toLowerCase();

      const appointmentId = String(
        record.appointmentId ?? "",
      ).toLowerCase();

      const recordId = String(
        record.recordId ?? "",
      ).toLowerCase();

      const matchesSearch =
        !search ||
        doctorName.includes(search) ||
        diagnosis.includes(search) ||
        treatment.includes(search) ||
        notes.includes(search) ||
        appointmentId.includes(search) ||
        recordId.includes(search);

      const appointmentDate = getRecordDate(record);

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "30days" &&
          isWithinDays(appointmentDate, 30)) ||
        (dateFilter === "90days" &&
          isWithinDays(appointmentDate, 90)) ||
        (dateFilter === "year" &&
          isWithinCurrentYear(appointmentDate));

      return matchesSearch && matchesDate;
    });
  }, [records, searchTerm, dateFilter]);

  /* =======================================================
     SUMMARY COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    const diagnosisCount = records.filter(
      (record) => String(record.diagnosis ?? "").trim(),
    ).length;

    const treatmentCount = records.filter(
      (record) => String(record.treatment ?? "").trim(),
    ).length;

    return {
      total: records.length,
      diagnoses: diagnosisCount,
      treatments: treatmentCount,
    };
  }, [records]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="smarthealth-medical-records">
      {/* PAGE HEADER */}
      <header className="smarthealth-medical-records-header">
        <div>
          <p className="smarthealth-medical-records-eyebrow">
            PATIENT PORTAL
          </p>

          <h1>Medical Records</h1>

          <p className="smarthealth-medical-records-subtitle">
            View your medical history, diagnoses, treatments, and
            doctor's notes in one place.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-medical-records-refresh"
          onClick={() => setRefreshKey((previous) => previous + 1)}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          Refresh
        </button>
      </header>

      {/* SUMMARY CARDS */}
      <section
        className="smarthealth-medical-records-stats"
        aria-label="Medical records summary"
      >
        <article className="smarthealth-medical-records-stat">
          <div className="smarthealth-medical-records-stat-icon total">
            ▤
          </div>

          <div>
            <span>Total records</span>
            <strong>{counts.total}</strong>
          </div>
        </article>

        <article className="smarthealth-medical-records-stat">
          <div className="smarthealth-medical-records-stat-icon diagnosis">
            ✚
          </div>

          <div>
            <span>Records with diagnosis</span>
            <strong>{counts.diagnoses}</strong>
          </div>
        </article>

        <article className="smarthealth-medical-records-stat">
          <div className="smarthealth-medical-records-stat-icon treatment">
            ✓
          </div>

          <div>
            <span>Records with treatment</span>
            <strong>{counts.treatments}</strong>
          </div>
        </article>
      </section>

      {/* SEARCH AND FILTERS */}
      <section className="smarthealth-medical-records-filters">
        <div className="smarthealth-medical-records-search">
          <label htmlFor="medical-records-search">
            Search medical records
          </label>

          <input
            id="medical-records-search"
            type="search"
            placeholder="Search doctor, diagnosis, treatment..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="smarthealth-medical-records-filter">
          <label htmlFor="medical-records-date-filter">
            Appointment date
          </label>

          <select
            id="medical-records-date-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            <option value="all">All dates</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </select>
        </div>

        <button
          type="button"
          className="smarthealth-medical-records-clear"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </section>

      {/* MEDICAL RECORDS LIST */}
      <section className="smarthealth-medical-records-list-section">
        <div className="smarthealth-medical-records-list-heading">
          <div>
            <h2>Your Medical History</h2>

            <p>
              {filteredRecords.length}{" "}
              {filteredRecords.length === 1 ? "record" : "records"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="smarthealth-medical-records-state">
            <div className="smarthealth-medical-records-spinner" />

            <h3>Loading medical records</h3>

            <p>
              Please wait while we retrieve your medical history.
            </p>
          </div>
        ) : loadError ? (
          <div className="smarthealth-medical-records-state">
            <div className="smarthealth-medical-records-state-icon error">
              !
            </div>

            <h3>Unable to load medical records</h3>

            <p>
              We couldn't retrieve your medical history. Please check
              your connection and try again.
            </p>

            <button
              type="button"
              className="smarthealth-medical-records-primary-button"
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              Try again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="smarthealth-medical-records-state">
            <div className="smarthealth-medical-records-state-icon">
              ▤
            </div>

            <h3>No medical records yet</h3>

            <p>
              Your medical records will appear here after your doctor
              creates a record for one of your appointments.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="smarthealth-medical-records-state">
            <div className="smarthealth-medical-records-state-icon">
              ⌕
            </div>

            <h3>No matching records</h3>

            <p>
              Try changing your search or date filter to find a medical
              record.
            </p>

            <button
              type="button"
              className="smarthealth-medical-records-primary-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="smarthealth-medical-records-list">
            {filteredRecords.map((record) => (
              <article
                key={record.recordId}
                className="smarthealth-medical-records-card"
              >
                <div className="smarthealth-medical-records-card-main">
                  <div className="smarthealth-medical-records-doctor-avatar">
                    {record.doctorName
                      ?.replace(/^Dr\.?\s*/i, "")
                      .charAt(0)
                      .toUpperCase() || "D"}
                  </div>

                  <div className="smarthealth-medical-records-doctor-details">
                    <div className="smarthealth-medical-records-doctor-heading">
                      <h3>
                        {record.doctorName
                          ? /^Dr\.?\s*/i.test(record.doctorName)
                            ? record.doctorName
                            : `Dr. ${record.doctorName}`
                          : "Doctor unavailable"}
                      </h3>

                      <span className="smarthealth-medical-records-badge">
                        Medical Record
                      </span>
                    </div>

                    <p className="smarthealth-medical-records-id">
                      Record ID: {record.recordId}
                    </p>

                    <div className="smarthealth-medical-records-details-grid">
                      <div className="smarthealth-medical-records-detail">
                        <span
                          className="detail-icon"
                          aria-hidden="true"
                        >
                          ▦
                        </span>

                        <div>
                          <span>Appointment date</span>
                          <strong>
                            {formatDate(record.appointmentDate)}
                          </strong>
                        </div>
                      </div>

                      <div className="smarthealth-medical-records-detail">
                        <span
                          className="detail-icon"
                          aria-hidden="true"
                        >
                          ◷
                        </span>

                        <div>
                          <span>Appointment time</span>
                          <strong>
                            {formatTime(record.appointmentTime)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="smarthealth-medical-records-summary">
                      <span>Diagnosis</span>

                      <p>
                        {record.diagnosis?.trim() ||
                          "No diagnosis provided"}
                      </p>
                    </div>

                    {record.treatment && (
                      <div className="smarthealth-medical-records-summary">
                        <span>Treatment</span>

                        <p>{record.treatment}</p>
                      </div>
                    )}

                    <div className="smarthealth-medical-records-created">
                      Record created: {formatDateTime(record.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="smarthealth-medical-records-card-actions">
                  <button
                    type="button"
                    className="smarthealth-medical-records-view-button"
                    onClick={() => setSelectedRecord(record)}
                  >
                    View Details
                    <span aria-hidden="true"> →</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MEDICAL RECORD DETAILS MODAL */}
      {selectedRecord && (
        <div
          className="smarthealth-medical-records-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <section
            className="smarthealth-medical-records-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="medical-record-details-title"
          >
            <div className="smarthealth-medical-records-modal-header">
              <div>
                <p className="smarthealth-medical-records-eyebrow">
                  PATIENT HEALTH RECORD
                </p>

                <h2 id="medical-record-details-title">
                  Medical Record Details
                </h2>
              </div>

              <button
                type="button"
                className="smarthealth-medical-records-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close medical record details"
              >
                ×
              </button>
            </div>

            <div className="smarthealth-medical-records-modal-content">
              <div className="smarthealth-medical-records-modal-doctor">
                <div className="smarthealth-medical-records-doctor-avatar">
                  {selectedRecord.doctorName
                    ?.replace(/^Dr\.?\s*/i, "")
                    .charAt(0)
                    .toUpperCase() || "D"}
                </div>

                <div>
                  <span>Attending doctor</span>

                  <h3>
                    {selectedRecord.doctorName
                      ? /^Dr\.?\s*/i.test(selectedRecord.doctorName)
                        ? selectedRecord.doctorName
                        : `Dr. ${selectedRecord.doctorName}`
                      : "Doctor unavailable"}
                  </h3>
                </div>
              </div>

              <div className="smarthealth-medical-records-modal-grid">
                <div className="smarthealth-medical-records-modal-field">
                  <span>Record ID</span>
                  <strong>{selectedRecord.recordId}</strong>
                </div>

                <div className="smarthealth-medical-records-modal-field">
                  <span>Appointment ID</span>
                  <strong>{selectedRecord.appointmentId}</strong>
                </div>

                <div className="smarthealth-medical-records-modal-field">
                  <span>Appointment date</span>
                  <strong>
                    {formatDate(selectedRecord.appointmentDate)}
                  </strong>
                </div>

                <div className="smarthealth-medical-records-modal-field">
                  <span>Appointment time</span>
                  <strong>
                    {formatTime(selectedRecord.appointmentTime)}
                  </strong>
                </div>

                <div className="smarthealth-medical-records-modal-field">
                  <span>Record created</span>
                  <strong>{formatDateTime(selectedRecord.createdAt)}</strong>
                </div>
              </div>

              <div className="smarthealth-medical-records-modal-section">
                <h3>Diagnosis</h3>

                <p>
                  {selectedRecord.diagnosis?.trim() ||
                    "No diagnosis provided."}
                </p>
              </div>

              <div className="smarthealth-medical-records-modal-section">
                <h3>Treatment</h3>

                <p>
                  {selectedRecord.treatment?.trim() ||
                    "No treatment information provided."}
                </p>
              </div>

              <div className="smarthealth-medical-records-modal-section">
                <h3>Doctor's Notes</h3>

                <p>
                  {selectedRecord.notes?.trim() ||
                    "No additional notes provided."}
                </p>
              </div>
            </div>

            <div className="smarthealth-medical-records-modal-footer">
              <button
                type="button"
                className="smarthealth-medical-records-primary-button"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   DATE FILTER HELPERS
========================================================= */

function isWithinDays(dateString, numberOfDays) {
  if (!dateString) {
    return false;
  }

  const appointmentDate = new Date(`${dateString}T12:00:00`);
  const today = new Date();

  if (Number.isNaN(appointmentDate.getTime())) {
    return false;
  }

  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (numberOfDays - 1));

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  return appointmentDate >= startDate && appointmentDate <= endDate;
}

function isWithinCurrentYear(dateString) {
  if (!dateString) {
    return false;
  }

  const appointmentDate = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(appointmentDate.getTime())) {
    return false;
  }

  return appointmentDate.getFullYear() === new Date().getFullYear();
}

export default MedicalRecords;