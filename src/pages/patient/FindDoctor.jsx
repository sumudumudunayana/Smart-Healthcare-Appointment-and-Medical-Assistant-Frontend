import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import api from "../../services/api";
import DoctorProfileModal from "../../components/patient/DoctorProfileModal";

import "../../styles/pages/patient/FindDoctor.css";

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState(false);

  // Selected doctor for the profile modal.
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  // Load specialization and department options.
  useEffect(() => {
    let cancelled = false;

    const fetchFilters = async () => {
      setFiltersLoading(true);

      try {
        const [specializationResponse, departmentResponse] = await Promise.all([
          api.get("/Specializations"),
          api.get("/Departments"),
        ]);

        if (cancelled) return;

        const specializationData = specializationResponse.data;
        const departmentData = departmentResponse.data;

        if (
          !Array.isArray(specializationData) ||
          !Array.isArray(departmentData)
        ) {
          throw new Error("Unexpected filter response.");
        }

        setSpecializations(specializationData);
        setDepartments(departmentData);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load doctor filters:", err);

        toast.error("Unable to load specialization and department filters.");
      } finally {
        if (!cancelled) {
          setFiltersLoading(false);
        }
      }
    };

    fetchFilters();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch doctors using the backend's supported query parameters.
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (specializationId) {
        params.specializationId = specializationId;
      }

      if (departmentId) {
        params.departmentId = departmentId;
      }

      const response = await api.get("/Doctors", { params });

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected doctors response.");
      }

      setDoctors(response.data);
    } catch (err) {
      console.error("Failed to load doctors:", err);

      setDoctors([]);
      setError(true);

      toast.error("Unable to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, specializationId, departmentId]);

  // Debounce search input to avoid making a request for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  // Clear search and filters.
  const clearFilters = () => {
    setSearch("");
    setSpecializationId("");
    setDepartmentId("");
  };

  // Open the doctor profile modal.
  const handleViewDoctor = (doctorId) => {
    setSelectedDoctorId(doctorId);
  };

  // Close the doctor profile modal.
  const handleCloseDoctorModal = () => {
    setSelectedDoctorId(null);
  };

  const activeFilterCount = [
    search.trim() !== "",
    specializationId !== "",
    departmentId !== "",
  ].filter(Boolean).length;

  return (
    <main className="smarthealth-find-doctor">
      {/* Page heading */}
      <section className="smarthealth-find-doctor__header">
        <div className="smarthealth-find-doctor__heading-content">
          <span className="smarthealth-find-doctor__eyebrow">
            PATIENT PORTAL
          </span>

          <h1>Find a Doctor</h1>

          <p>
            Find the right healthcare professional for your needs. Search
            doctors and explore their specializations.
          </p>
        </div>

        <div
          className="smarthealth-find-doctor__header-icon"
          aria-hidden="true"
        >
          ⚕
        </div>
      </section>

      {/* Search and filters */}
      <section className="smarthealth-find-doctor__filter-panel">
        <div className="smarthealth-find-doctor__section-heading">
          <div>
            <h2>Find your specialist</h2>
            <p>Search by name, specialization, or department.</p>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="smarthealth-find-doctor__clear-button"
              onClick={clearFilters}
            >
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="smarthealth-find-doctor__filters">
          {/* Search field */}
          <div className="smarthealth-find-doctor__field smarthealth-find-doctor__search-field">
            <label htmlFor="find-doctor-search">Search doctors</label>

            <div className="smarthealth-find-doctor__search-input">
              <span aria-hidden="true">⌕</span>

              <input
                id="find-doctor-search"
                type="search"
                placeholder="Doctor name, specialization..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Specialization filter */}
          <div className="smarthealth-find-doctor__field">
            <label htmlFor="find-doctor-specialization">Specialization</label>

            <select
              id="find-doctor-specialization"
              value={specializationId}
              onChange={(event) => setSpecializationId(event.target.value)}
              disabled={filtersLoading}
            >
              <option value="">All specializations</option>

              {specializations.map((specialization) => (
                <option
                  key={specialization.specializationId}
                  value={specialization.specializationId}
                >
                  {specialization.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department filter */}
          <div className="smarthealth-find-doctor__field">
            <label htmlFor="find-doctor-department">Department</label>

            <select
              id="find-doctor-department"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              disabled={filtersLoading}
            >
              <option value="">All departments</option>

              {departments.map((department) => (
                <option
                  key={department.departmentId}
                  value={department.departmentId}
                >
                  {department.departmentName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Doctor results */}
      <section className="smarthealth-find-doctor__results-section">
        <div className="smarthealth-find-doctor__results-heading">
          <div>
            <h2>Available Doctors</h2>

            <p>
              {loading
                ? "Finding doctors..."
                : `${doctors.length} ${
                    doctors.length === 1 ? "doctor" : "doctors"
                  } found`}
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div
            className="smarthealth-find-doctor__state"
            role="status"
            aria-live="polite"
          >
            <div className="smarthealth-find-doctor__spinner" />

            <h3>Finding doctors</h3>

            <p>Please wait while we retrieve doctor information.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="smarthealth-find-doctor__state">
            <div className="smarthealth-find-doctor__state-icon">⚠</div>

            <h3>Unable to load doctors</h3>

            <p>
              Something went wrong while retrieving the doctor list. Please try
              again.
            </p>

            <button
              type="button"
              className="smarthealth-find-doctor__primary-button"
              onClick={fetchDoctors}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && doctors.length === 0 && (
          <div className="smarthealth-find-doctor__state">
            <div className="smarthealth-find-doctor__state-icon">⚕</div>

            <h3>No doctors found</h3>

            <p>
              Try another search term or change your filters to explore more
              doctors.
            </p>

            <button
              type="button"
              className="smarthealth-find-doctor__primary-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Doctor cards */}
        {!loading && !error && doctors.length > 0 && (
          <div className="smarthealth-find-doctor__grid">
            {doctors.map((doctor) => {
              const isActive =
                String(doctor.status || "").toLowerCase() === "active";

              return (
                <article
                  className="smarthealth-find-doctor__card"
                  key={doctor.doctorId}
                >
                  <div className="smarthealth-find-doctor__card-top">
                    <div className="smarthealth-find-doctor__avatar">
                      {doctor.fullName?.trim()?.charAt(0)?.toUpperCase() || "D"}
                    </div>

                    <span
                      className={`smarthealth-find-doctor__status ${
                        isActive
                          ? "smarthealth-find-doctor__status--active"
                          : "smarthealth-find-doctor__status--inactive"
                      }`}
                    >
                      <span className="smarthealth-find-doctor__status-dot" />

                      {doctor.status || "Unknown"}
                    </span>
                  </div>

                  <div className="smarthealth-find-doctor__card-content">
                    <h3>{doctor.fullName}</h3>

                    <p className="smarthealth-find-doctor__specialization">
                      {doctor.specialization}
                    </p>

                    <div className="smarthealth-find-doctor__details">
                      {/* Department */}
                      <div className="smarthealth-find-doctor__detail">
                        <span aria-hidden="true">▦</span>

                        <div>
                          <span className="smarthealth-find-doctor__detail-label">
                            Department
                          </span>

                          <strong>{doctor.department || "Not assigned"}</strong>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="smarthealth-find-doctor__detail">
                        <span aria-hidden="true">◷</span>

                        <div>
                          <span className="smarthealth-find-doctor__detail-label">
                            Experience
                          </span>

                          <strong>
                            {doctor.experience}{" "}
                            {doctor.experience === 1 ? "year" : "years"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Open doctor profile modal */}
                  <div className="smarthealth-find-doctor__card-footer">
                    <button
                      type="button"
                      className="smarthealth-find-doctor__profile-link"
                      onClick={() => handleViewDoctor(doctor.doctorId)}
                      aria-label={`View profile of ${doctor.fullName}`}
                    >
                      View doctor profile
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Doctor profile and appointment booking modal */}
      {selectedDoctorId && (
        <DoctorProfileModal
          doctorId={selectedDoctorId}
          onClose={handleCloseDoctorModal}
        />
      )}
    </main>
  );
};

export default FindDoctor;
