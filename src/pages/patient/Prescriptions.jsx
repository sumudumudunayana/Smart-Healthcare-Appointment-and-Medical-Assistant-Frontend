import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaPills,
  FaSearch,
  FaCalendarAlt,
  FaUserMd,
  FaFileMedical,
  FaClock,
  FaPrescriptionBottleAlt,
  FaInfoCircle,
  FaTimes,
  FaNotesMedical,
  FaSyncAlt,
} from "react-icons/fa";

import api from "../../services/api";
import "../../styles/pages/patient/Prescriptions.css";

const formatDate = (dateString) => {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name?.trim()) return "DR";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getPrescriptionDate = (prescription) => {
  if (!prescription.createdAt) return null;

  const date = new Date(prescription.createdAt);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isWithinDays = (prescription, days) => {
  const date = getPrescriptionDate(prescription);

  if (!date) return false;

  const now = new Date();
  const startDate = new Date(now);

  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return date >= startDate && date <= now;
};

const isWithinCurrentYear = (prescription) => {
  const date = getPrescriptionDate(prescription);

  if (!date) return false;

  return date.getFullYear() === new Date().getFullYear();
};

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchPrescriptions = useCallback(async (showToast = false) => {
    try {
      setLoading(true);

      const response = await api.get("/Prescriptions/my");

      const data = Array.isArray(response.data) ? response.data : [];

      setPrescriptions(data);

      if (showToast) {
        toast.success("Prescriptions refreshed successfully.");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);

      const message =
        error.response?.data?.message ||
        "Unable to load your prescriptions. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions(true);
  };

  const filteredPrescriptions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return prescriptions.filter((prescription) => {
      const matchesSearch =
        !search ||
        [
          prescription.medicine,
          prescription.dosage,
          prescription.duration,
          prescription.frequency,
          prescription.instructions,
          prescription.doctorName,
          prescription.recordId,
          prescription.prescriptionId,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search),
        );

      let matchesDate = true;

      switch (dateFilter) {
        case "30days":
          matchesDate = isWithinDays(prescription, 30);
          break;

        case "90days":
          matchesDate = isWithinDays(prescription, 90);
          break;

        case "year":
          matchesDate = isWithinCurrentYear(prescription);
          break;

        default:
          matchesDate = true;
      }

      return matchesSearch && matchesDate;
    });
  }, [prescriptions, searchTerm, dateFilter]);

  const prescriptionsWithInstructions = useMemo(
    () =>
      prescriptions.filter((prescription) => prescription.instructions?.trim())
        .length,
    [prescriptions],
  );

  const recentPrescriptions = useMemo(
    () =>
      prescriptions.filter((prescription) => isWithinDays(prescription, 30))
        .length,
    [prescriptions],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
  };

  return (
    <div className="smarthealth-prescriptions-page">
      {/* Page Header */}
      <div className="smarthealth-prescriptions-header">
        <div className="smarthealth-prescriptions-header-content">
          <div className="smarthealth-prescriptions-title-icon">
            <FaPills />
          </div>

          <div>
            <h1>My Prescriptions</h1>
            <p>
              View your prescribed medicines, dosage details, and instructions
              from your doctors.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="smarthealth-prescriptions-refresh-button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          aria-label="Refresh prescriptions"
        >
          <FaSyncAlt
            className={refreshing ? "smarthealth-prescriptions-spinning" : ""}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="smarthealth-prescriptions-summary">
        <div className="smarthealth-prescriptions-summary-card">
          <div className="smarthealth-prescriptions-summary-icon prescriptions-icon-purple">
            <FaPrescriptionBottleAlt />
          </div>

          <div>
            <span className="smarthealth-prescriptions-summary-label">
              Total Prescriptions
            </span>
            <strong>{loading ? "—" : prescriptions.length}</strong>
          </div>
        </div>

        <div className="smarthealth-prescriptions-summary-card">
          <div className="smarthealth-prescriptions-summary-icon prescriptions-icon-blue">
            <FaCalendarAlt />
          </div>

          <div>
            <span className="smarthealth-prescriptions-summary-label">
              Prescribed in Last 30 Days
            </span>
            <strong>{loading ? "—" : recentPrescriptions}</strong>
          </div>
        </div>

        <div className="smarthealth-prescriptions-summary-card">
          <div className="smarthealth-prescriptions-summary-icon prescriptions-icon-green">
            <FaNotesMedical />
          </div>

          <div>
            <span className="smarthealth-prescriptions-summary-label">
              With Instructions
            </span>
            <strong>{loading ? "—" : prescriptionsWithInstructions}</strong>
          </div>
        </div>
      </div>

      {/* Prescription List */}
      <section className="smarthealth-prescriptions-section">
        <div className="smarthealth-prescriptions-section-header">
          <div>
            <h2>Prescription History</h2>
            <p>Your prescriptions are displayed with the most recent first.</p>
          </div>

          <span className="smarthealth-prescriptions-count">
            {loading
              ? "Loading..."
              : `${filteredPrescriptions.length} ${
                  filteredPrescriptions.length === 1
                    ? "prescription"
                    : "prescriptions"
                }`}
          </span>
        </div>

        {/* Search and Filters */}
        <div className="smarthealth-prescriptions-toolbar">
          <div className="smarthealth-prescriptions-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search medicine, doctor, dosage..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search prescriptions"
            />

            {searchTerm && (
              <button
                type="button"
                className="smarthealth-prescriptions-clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="smarthealth-prescriptions-date-filter">
            <FaCalendarAlt />

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter prescriptions by date"
            >
              <option value="all">All Dates</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="smarthealth-prescriptions-state">
            <div className="smarthealth-prescriptions-loader" />
            <h3>Loading prescriptions</h3>
            <p>Please wait while we retrieve your prescription history.</p>
          </div>
        ) : prescriptions.length === 0 ? (
          /* Empty State */
          <div className="smarthealth-prescriptions-state">
            <div className="smarthealth-prescriptions-empty-icon">
              <FaPills />
            </div>

            <h3>No prescriptions yet</h3>

            <p>
              Prescriptions issued by your doctor will appear here after they
              have been added to your medical records.
            </p>

            <button
              type="button"
              className="smarthealth-prescriptions-secondary-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FaSyncAlt />
              Check Again
            </button>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          /* No Search Results */
          <div className="smarthealth-prescriptions-state">
            <div className="smarthealth-prescriptions-empty-icon">
              <FaSearch />
            </div>

            <h3>No matching prescriptions</h3>

            <p>
              We couldn't find prescriptions matching your search or selected
              date range.
            </p>

            <button
              type="button"
              className="smarthealth-prescriptions-secondary-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Prescription Cards */
          <div className="smarthealth-prescriptions-list">
            {filteredPrescriptions.map((prescription) => (
              <article
                className="smarthealth-prescription-card"
                key={prescription.prescriptionId}
              >
                <div className="smarthealth-prescription-card-top">
                  <div className="smarthealth-prescription-medicine">
                    <div className="smarthealth-prescription-medicine-icon">
                      <FaPills />
                    </div>

                    <div className="smarthealth-prescription-medicine-info">
                      <h3>{prescription.medicine || "Unnamed medicine"}</h3>

                      <p>{prescription.dosage || "Dosage not specified"}</p>
                    </div>
                  </div>

                  <span className="smarthealth-prescription-date">
                    <FaCalendarAlt />
                    {formatDate(prescription.createdAt)}
                  </span>
                </div>

                <div className="smarthealth-prescription-details">
                  <div className="smarthealth-prescription-detail">
                    <span className="smarthealth-prescription-detail-label">
                      <FaClock />
                      Duration
                    </span>

                    <strong>{prescription.duration || "Not specified"}</strong>
                  </div>

                  <div className="smarthealth-prescription-detail">
                    <span className="smarthealth-prescription-detail-label">
                      <FaPrescriptionBottleAlt />
                      Frequency
                    </span>

                    <strong>{prescription.frequency || "Not specified"}</strong>
                  </div>
                </div>

                <div className="smarthealth-prescription-doctor">
                  <div className="smarthealth-prescription-doctor-avatar">
                    {getInitials(prescription.doctorName)}
                  </div>

                  <div className="smarthealth-prescription-doctor-info">
                    <span>Prescribed by</span>
                    <strong>
                      {prescription.doctorName || "Doctor unavailable"}
                    </strong>
                  </div>
                </div>

                {prescription.instructions?.trim() && (
                  <div className="smarthealth-prescription-instructions">
                    <FaInfoCircle />

                    <div>
                      <strong>Instructions</strong>
                      <p>{prescription.instructions}</p>
                    </div>
                  </div>
                )}

                <div className="smarthealth-prescription-card-footer">
                  <span className="smarthealth-prescription-record-reference">
                    <FaFileMedical />
                    Record ID:{" "}
                    {prescription.recordId
                      ? `${prescription.recordId.slice(0, 8)}...`
                      : "Unavailable"}
                  </span>

                  <button
                    type="button"
                    className="smarthealth-prescription-view-button"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div
          className="smarthealth-prescriptions-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPrescription(null);
            }
          }}
        >
          <section
            className="smarthealth-prescriptions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-prescriptions-modal-title"
          >
            <div className="smarthealth-prescriptions-modal-header">
              <div className="smarthealth-prescriptions-modal-heading">
                <div className="smarthealth-prescription-modal-icon">
                  <FaPills />
                </div>

                <div>
                  <h2 id="smarthealth-prescriptions-modal-title">
                    Prescription Details
                  </h2>
                  <p>Complete information about your prescription</p>
                </div>
              </div>

              <button
                type="button"
                className="smarthealth-prescriptions-modal-close"
                onClick={() => setSelectedPrescription(null)}
                aria-label="Close prescription details"
              >
                <FaTimes />
              </button>
            </div>

            <div className="smarthealth-prescriptions-modal-body">
              <div className="smarthealth-prescription-modal-medicine">
                <span>Medicine</span>
                <h3>{selectedPrescription.medicine || "Unnamed medicine"}</h3>
              </div>

              <div className="smarthealth-prescription-modal-grid">
                <div className="smarthealth-prescription-modal-field">
                  <span>Dosage</span>
                  <strong>
                    {selectedPrescription.dosage || "Not specified"}
                  </strong>
                </div>

                <div className="smarthealth-prescription-modal-field">
                  <span>Frequency</span>
                  <strong>
                    {selectedPrescription.frequency || "Not specified"}
                  </strong>
                </div>

                <div className="smarthealth-prescription-modal-field">
                  <span>Duration</span>
                  <strong>
                    {selectedPrescription.duration || "Not specified"}
                  </strong>
                </div>

                <div className="smarthealth-prescription-modal-field">
                  <span>Prescription Date</span>
                  <strong>{formatDate(selectedPrescription.createdAt)}</strong>
                </div>
              </div>

              <div className="smarthealth-prescription-modal-doctor">
                <div className="smarthealth-prescription-doctor-avatar">
                  {getInitials(selectedPrescription.doctorName)}
                </div>

                <div>
                  <span>
                    <FaUserMd /> Prescribing Doctor
                  </span>

                  <strong>
                    {selectedPrescription.doctorName || "Doctor unavailable"}
                  </strong>
                </div>
              </div>

              <div className="smarthealth-prescription-modal-field smarthealth-prescription-modal-full-field">
                <span>Additional Instructions</span>

                <p>
                  {selectedPrescription.instructions?.trim() ||
                    "No additional instructions were provided."}
                </p>
              </div>

              <div className="smarthealth-prescription-modal-reference">
                <div>
                  <span>Prescription ID</span>
                  <p>{selectedPrescription.prescriptionId}</p>
                </div>

                <div>
                  <span>Medical Record ID</span>
                  <p>{selectedPrescription.recordId}</p>
                </div>

                <div>
                  <span>Created At</span>
                  <p>{formatDateTime(selectedPrescription.createdAt)}</p>
                </div>
              </div>

              <div className="smarthealth-prescription-medical-notice">
                <FaInfoCircle />

                <p>
                  Follow the instructions provided by your healthcare
                  professional. If you are unsure how to take a medicine,
                  contact your doctor or pharmacist for clarification.
                </p>
              </div>
            </div>

            <div className="smarthealth-prescriptions-modal-footer">
              <button
                type="button"
                className="smarthealth-prescriptions-modal-done"
                onClick={() => setSelectedPrescription(null)}
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

export default Prescriptions;
