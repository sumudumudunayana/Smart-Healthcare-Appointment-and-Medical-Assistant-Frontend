import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiFilter,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

import api from "../../services/api";
import "../../styles/pages/patient/LabReports.css";

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

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

const getReportType = (report) =>
  report.reportType?.trim() || "General report";

const isValidHttpUrl = (value) => {
  if (!value || typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/LabReports/my");

      if (!Array.isArray(response.data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setReports(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load your lab reports.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const now = new Date();

    return reports.filter((report) => {
      const matchesSearch =
        !search ||
        report.reportName?.toLowerCase().includes(search) ||
        report.reportType?.toLowerCase().includes(search) ||
        report.doctorName?.toLowerCase().includes(search);

      let matchesDate = true;

      if (dateFilter !== "all") {
        const uploadedDate = new Date(report.uploadedAt);

        if (Number.isNaN(uploadedDate.getTime())) {
          matchesDate = false;
        } else {
          const days = Number(dateFilter);
          const cutoff = new Date(now);
          cutoff.setDate(cutoff.getDate() - days);

          matchesDate =
            uploadedDate >= cutoff && uploadedDate <= now;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [reports, searchTerm, dateFilter]);

  const recentReports = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    return reports.filter((report) => {
      const uploadedDate = new Date(report.uploadedAt);

      return (
        !Number.isNaN(uploadedDate.getTime()) &&
        uploadedDate >= cutoff &&
        uploadedDate <= new Date()
      );
    }).length;
  }, [reports]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
  };

  const handleOpenReport = (report) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  return (
    <div className="lab-reports-page">
      {/* Page heading */}
      <div className="lab-reports-header">
        <div className="lab-reports-heading-content">
          <div className="lab-reports-heading-icon">
            <FiActivity />
          </div>

          <div>
            <h1>Lab Reports</h1>
            <p>
              Access and review laboratory reports associated with your
              medical records.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="lab-reports-refresh-btn"
          onClick={fetchLabReports}
          disabled={loading}
        >
          <FiActivity className={loading ? "lab-reports-spinning" : ""} />
          {loading ? "Loading..." : "Refresh reports"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="lab-reports-stats">
        <div className="lab-reports-stat-card">
          <div className="lab-reports-stat-icon lab-reports-stat-icon-teal">
            <FiFileText />
          </div>

          <div className="lab-reports-stat-info">
            <span>Total reports</span>
            <h2>{loading ? "—" : reports.length}</h2>
            <p>Reports in your medical history</p>
          </div>
        </div>

        <div className="lab-reports-stat-card">
          <div className="lab-reports-stat-icon lab-reports-stat-icon-green">
            <FiClock />
          </div>

          <div className="lab-reports-stat-info">
            <span>Recently uploaded</span>
            <h2>{loading ? "—" : recentReports}</h2>
            <p>Uploaded within the last 30 days</p>
          </div>
        </div>

        <div className="lab-reports-stat-card">
          <div className="lab-reports-stat-icon lab-reports-stat-icon-light">
            <FiCheckCircle />
          </div>

          <div className="lab-reports-stat-info">
            <span>Matching reports</span>
            <h2>{loading ? "—" : filteredReports.length}</h2>
            <p>Based on your current filters</p>
          </div>
        </div>
      </div>

      {/* Reports section */}
      <section className="lab-reports-content">
        <div className="lab-reports-section-header">
          <div>
            <h2>Your laboratory reports</h2>
            <p>Review the reports uploaded by your healthcare provider.</p>
          </div>

          <span className="lab-reports-count">
            {filteredReports.length}{" "}
            {filteredReports.length === 1 ? "report" : "reports"}
          </span>
        </div>

        {/* Search and filters */}
        <div className="lab-reports-toolbar">
          <div className="lab-reports-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search reports, types, or doctors..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search lab reports"
            />

            {searchTerm && (
              <button
                type="button"
                className="lab-reports-clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="lab-reports-filter">
            <FiFilter />

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter reports by upload date"
            >
              <option value="all">All dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {(searchTerm || dateFilter !== "all") && (
            <button
              type="button"
              className="lab-reports-reset-btn"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="lab-reports-state">
            <div className="lab-reports-loader" />
            <h3>Loading your lab reports</h3>
            <p>Please wait while we retrieve your reports.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="lab-reports-state lab-reports-error-state">
            <div className="lab-reports-state-icon">
              <FiActivity />
            </div>

            <h3>Unable to load reports</h3>
            <p>{error}</p>

            <button
              type="button"
              className="lab-reports-primary-btn"
              onClick={fetchLabReports}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="lab-reports-state">
            <div className="lab-reports-state-icon">
              <FiFileText />
            </div>

            <h3>No lab reports yet</h3>
            <p>
              Laboratory reports uploaded by your healthcare provider will
              appear here.
            </p>
          </div>
        )}

        {/* No matching reports */}
        {!loading &&
          !error &&
          reports.length > 0 &&
          filteredReports.length === 0 && (
            <div className="lab-reports-state">
              <div className="lab-reports-state-icon">
                <FiSearch />
              </div>

              <h3>No matching reports</h3>
              <p>
                Try another search term or change your selected date range.
              </p>

              <button
                type="button"
                className="lab-reports-primary-btn"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Report cards */}
        {!loading && !error && filteredReports.length > 0 && (
          <div className="lab-reports-grid">
            {filteredReports.map((report) => (
              <article
                className="lab-report-card"
                key={report.labReportId}
              >
                <div className="lab-report-card-top">
                  <div className="lab-report-file-icon">
                    <FiFileText />
                  </div>

                  <span className="lab-report-type">
                    {getReportType(report)}
                  </span>
                </div>

                <div className="lab-report-card-body">
                  <h3>{report.reportName || "Untitled report"}</h3>

                  <div className="lab-report-meta">
                    <FiUser />
                    <span>
                      {report.doctorName || "Doctor unavailable"}
                    </span>
                  </div>

                  <div className="lab-report-meta">
                    <FiCalendar />
                    <span>{formatDate(report.uploadedAt)}</span>
                  </div>
                </div>

                <div className="lab-report-card-footer">
                  <span className="lab-report-uploaded-label">
                    <FiCheckCircle />
                    Report available
                  </span>

                  <button
                    type="button"
                    className="lab-report-view-btn"
                    onClick={() => handleOpenReport(report)}
                  >
                    View details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Report details modal */}
      {selectedReport && (
        <div
          className="lab-report-modal-overlay"
          onClick={handleCloseModal}
        >
          <div
            className="lab-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lab-report-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lab-report-modal-header">
              <div className="lab-report-modal-title-group">
                <div className="lab-report-file-icon">
                  <FiFileText />
                </div>

                <div>
                  <span>Laboratory report</span>
                  <h2 id="lab-report-modal-title">
                    {selectedReport.reportName || "Untitled report"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="lab-report-modal-close"
                onClick={handleCloseModal}
                aria-label="Close report details"
              >
                <FiX />
              </button>
            </div>

            <div className="lab-report-modal-body">
              <div className="lab-report-detail-item">
                <span>Report name</span>
                <strong>
                  {selectedReport.reportName || "Not specified"}
                </strong>
              </div>

              <div className="lab-report-detail-item">
                <span>Report type</span>
                <strong>{getReportType(selectedReport)}</strong>
              </div>

              <div className="lab-report-detail-item">
                <span>Doctor</span>
                <strong>
                  {selectedReport.doctorName || "Not available"}
                </strong>
              </div>

              <div className="lab-report-detail-item">
                <span>Upload date</span>
                <strong>{formatDateTime(selectedReport.uploadedAt)}</strong>
              </div>

              <div className="lab-report-detail-item">
                <span>Associated medical record</span>
                <strong className="lab-report-record-id">
                  {selectedReport.recordId || "Not available"}
                </strong>
              </div>

              {isValidHttpUrl(selectedReport.filePath) && (
                <div className="lab-report-file-link-container">
                  <a
                    href={selectedReport.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lab-report-file-link"
                  >
                    <FiDownload />
                    Open report file
                  </a>
                </div>
              )}

              {selectedReport.filePath &&
                !isValidHttpUrl(selectedReport.filePath) && (
                  <p className="lab-report-file-unavailable">
                    A file path is recorded, but it is not a directly
                    accessible web URL.
                  </p>
                )}

              {!selectedReport.filePath && (
                <p className="lab-report-file-unavailable">
                  No report file has been attached to this entry.
                </p>
              )}
            </div>

            <div className="lab-report-modal-footer">
              <button
                type="button"
                className="lab-reports-primary-btn"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReports;