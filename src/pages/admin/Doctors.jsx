import { useEffect, useState } from "react";
import { toast } from "sonner";

import doctorService from "../../services/doctorService";
import specializationService from "../../services/specializationService";
import departmentService from "../../services/departmentService";

import "../../styles/pages/admin/Doctors.css";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [creating, setCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] =
    useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specializationId, setSpecializationId] =
    useState("");
  const [departmentId, setDepartmentId] =
    useState("");
  const [licenseNumber, setLicenseNumber] =
    useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [
    searchTerm,
    specializationFilter,
    departmentFilter,
  ]);

  const loadInitialData = async () => {
    setLoadingOptions(true);

    try {
      const [
        specializationData,
        departmentData,
      ] = await Promise.all([
        specializationService.getAll(),
        departmentService.getAll(),
      ]);

      setSpecializations(
        specializationData || []
      );

      setDepartments(
        departmentData || []
      );
    } catch (error) {
      console.error(
        "Failed to load doctor form options:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load specializations and departments.";

      toast.error(message);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);

    try {
      const data = await doctorService.getAll({
        search: searchTerm,
        specializationId:
          specializationFilter,
        departmentId:
          departmentFilter,
      });

      setDoctors(data || []);
    } catch (error) {
      console.error(
        "Failed to load doctors:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load doctors.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSpecializationId("");
    setDepartmentId("");
    setLicenseNumber("");
    setExperience("");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSpecializationFilter("");
    setDepartmentFilter("");
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedLicense = licenseNumber.trim();

    if (!trimmedName) {
      toast.error("Full name is required.");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Email is required.");
      return;
    }

    if (!trimmedPassword) {
      toast.error("Password is required.");
      return;
    }

    if (trimmedPassword.length < 6) {
      toast.error(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (!specializationId) {
      toast.error(
        "Please select a specialization."
      );
      return;
    }

    if (!trimmedLicense) {
      toast.error(
        "License number is required."
      );
      return;
    }

    if (
      experience === "" ||
      Number(experience) < 0
    ) {
      toast.error(
        "Experience cannot be negative."
      );
      return;
    }

    setCreating(true);

    try {
      const created =
        await doctorService.create({
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || null,
          password: trimmedPassword,
          specializationId,
          departmentId:
            departmentId || null,
          licenseNumber: trimmedLicense,
          experience: Number(experience),
        });

      setDoctors((current) =>
        [...current, created].sort((a, b) =>
          a.fullName.localeCompare(
            b.fullName
          )
        )
      );

      resetForm();

      toast.success(
        "Doctor created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create doctor:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to create doctor.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) {
      return "DR";
    }

    const parts = name
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getStatusClass = (status) => {
    if (
      status?.toLowerCase() === "active"
    ) {
      return "smarthealth-admin-doctors-status smarthealth-admin-doctors-status-active";
    }

    return "smarthealth-admin-doctors-status smarthealth-admin-doctors-status-inactive";
  };

  return (
    <div className="smarthealth-admin-doctors">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="smarthealth-admin-doctors-header">

        <div>
          <span className="smarthealth-admin-doctors-eyebrow">
            Management
          </span>

          <h1>Doctors</h1>

          <p>
            Manage doctors, specializations,
            departments, and professional details.
          </p>
        </div>

        <div className="smarthealth-admin-doctors-count">

          <span>Total Doctors</span>

          <strong>
            {doctors.length}
          </strong>

        </div>

      </section>

      {/* =====================================================
          ADD DOCTOR
      ====================================================== */}

      <section className="smarthealth-admin-doctors-form-card">

        <div className="smarthealth-admin-doctors-form-header">

          <div className="smarthealth-admin-doctors-form-icon">
            +
          </div>

          <div>
            <h2>Add Doctor</h2>

            <p>
              Create a doctor account and assign
              their medical department.
            </p>
          </div>

        </div>

        {loadingOptions ? (
          <div className="smarthealth-admin-doctors-form-loading">

            <div className="smarthealth-admin-doctors-small-spinner"></div>

            <span>
              Loading specializations and departments...
            </span>

          </div>
        ) : (
          <form
            className="smarthealth-admin-doctors-form"
            onSubmit={handleCreateDoctor}
          >

            {/* Full Name */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorFullName">
                Full Name
              </label>

              <input
                id="doctorFullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="e.g. Dr. Sarah Perera"
                disabled={creating}
              />
            </div>

            {/* Email */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorEmail">
                Email
              </label>

              <input
                id="doctorEmail"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="doctor@hospital.com"
                disabled={creating}
              />
            </div>

            {/* Phone */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorPhone">
                Phone
              </label>

              <input
                id="doctorPhone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="Optional"
                disabled={creating}
              />
            </div>

            {/* Password */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorPassword">
                Password
              </label>

              <input
                id="doctorPassword"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Minimum 6 characters"
                disabled={creating}
              />
            </div>

            {/* Specialization */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorSpecialization">
                Specialization
              </label>

              <select
                id="doctorSpecialization"
                value={specializationId}
                onChange={(event) =>
                  setSpecializationId(
                    event.target.value
                  )
                }
                disabled={creating}
              >
                <option value="">
                  Select specialization
                </option>

                {specializations.map(
                  (specialization) => (
                    <option
                      key={
                        specialization.specializationId
                      }
                      value={
                        specialization.specializationId
                      }
                    >
                      {specialization.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Department */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorDepartment">
                Department
              </label>

              <select
                id="doctorDepartment"
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value
                  )
                }
                disabled={creating}
              >
                <option value="">
                  No department
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={
                        department.departmentId
                      }
                      value={
                        department.departmentId
                      }
                    >
                      {department.departmentName}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* License Number */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorLicense">
                License Number
              </label>

              <input
                id="doctorLicense"
                type="text"
                value={licenseNumber}
                onChange={(event) =>
                  setLicenseNumber(
                    event.target.value
                  )
                }
                placeholder="e.g. SLMC-12345"
                disabled={creating}
              />
            </div>

            {/* Experience */}

            <div className="smarthealth-admin-doctors-field">
              <label htmlFor="doctorExperience">
                Experience (Years)
              </label>

              <input
                id="doctorExperience"
                type="number"
                min="0"
                step="1"
                value={experience}
                onChange={(event) =>
                  setExperience(
                    event.target.value
                  )
                }
                placeholder="e.g. 8"
                disabled={creating}
              />
            </div>

            {/* Submit */}

            <div className="smarthealth-admin-doctors-form-actions">

              <button
                type="submit"
                className="smarthealth-admin-doctors-submit"
                disabled={
                  creating ||
                  loadingOptions
                }
              >
                {creating ? (
                  <>
                    <span className="smarthealth-admin-doctors-button-spinner"></span>
                    Creating Doctor...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Create Doctor
                  </>
                )}
              </button>

            </div>

          </form>
        )}

      </section>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="smarthealth-admin-doctors-filter-card">

        <div className="smarthealth-admin-doctors-filter-header">

          <div>
            <h2>Find Doctors</h2>

            <p>
              Search and filter doctors by
              name, specialization, or department.
            </p>
          </div>

          {(searchTerm ||
            specializationFilter ||
            departmentFilter) && (
            <button
              type="button"
              className="smarthealth-admin-doctors-clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>

        <div className="smarthealth-admin-doctors-filter-controls">

          {/* Search */}

          <div className="smarthealth-admin-doctors-search">

            <span>⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search doctor name..."
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
                aria-label="Clear doctor search"
              >
                ×
              </button>
            )}

          </div>

          {/* Specialization */}

          <select
            className="smarthealth-admin-doctors-filter-select"
            value={specializationFilter}
            onChange={(event) =>
              setSpecializationFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Specializations
            </option>

            {specializations.map(
              (specialization) => (
                <option
                  key={
                    specialization.specializationId
                  }
                  value={
                    specialization.specializationId
                  }
                >
                  {specialization.name}
                </option>
              )
            )}
          </select>

          {/* Department */}

          <select
            className="smarthealth-admin-doctors-filter-select"
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={
                    department.departmentId
                  }
                  value={
                    department.departmentId
                  }
                >
                  {department.departmentName}
                </option>
              )
            )}
          </select>

        </div>

      </section>

      {/* =====================================================
          DOCTOR LIST
      ====================================================== */}

      <section className="smarthealth-admin-doctors-list-card">

        <div className="smarthealth-admin-doctors-list-header">

          <div>
            <h2>All Doctors</h2>

            <p>
              {loading
                ? "Loading doctor records..."
                : `${doctors.length} doctor${
                    doctors.length === 1
                      ? ""
                      : "s"
                  } found`}
            </p>
          </div>

        </div>

        {/* Loading */}

        {loading ? (
          <div className="smarthealth-admin-doctors-loading">

            <div className="smarthealth-admin-doctors-spinner"></div>

            <p>
              Loading doctors...
            </p>

          </div>
        ) : doctors.length === 0 ? (

          /* Empty */

          <div className="smarthealth-admin-doctors-empty">

            <div className="smarthealth-admin-doctors-empty-icon">
              ⚕
            </div>

            <h3>
              No doctors found
            </h3>

            <p>
              {searchTerm ||
              specializationFilter ||
              departmentFilter
                ? "Try changing your search or filters."
                : "No doctors have been registered yet."}
            </p>

            {(searchTerm ||
              specializationFilter ||
              departmentFilter) && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (

          /* Table */

          <div className="smarthealth-admin-doctors-table-wrapper">

            <table className="smarthealth-admin-doctors-table">

              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Department</th>
                  <th>License</th>
                  <th>Experience</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {doctors.map((doctor) => (
                  <tr key={doctor.doctorId}>

                    {/* Doctor */}

                    <td>
                      <div className="smarthealth-admin-doctor-person">

                        <div className="smarthealth-admin-doctor-avatar">
                          {getInitials(
                            doctor.fullName
                          )}
                        </div>

                        <div className="smarthealth-admin-doctor-person-details">

                          <strong>
                            {doctor.fullName}
                          </strong>

                          <span>
                            {doctor.email}
                          </span>

                        </div>

                      </div>
                    </td>

                    {/* Specialization */}

                    <td>
                      <span className="smarthealth-admin-doctor-specialization">
                        {doctor.specialization ||
                          "Not specified"}
                      </span>
                    </td>

                    {/* Department */}

                    <td>
                      {doctor.department ? (
                        <span className="smarthealth-admin-doctor-department">
                          {doctor.department}
                        </span>
                      ) : (
                        <span className="smarthealth-admin-doctor-not-specified">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* License */}

                    <td>
                      <span className="smarthealth-admin-doctor-license">
                        {doctor.licenseNumber}
                      </span>
                    </td>

                    {/* Experience */}

                    <td>
                      <span className="smarthealth-admin-doctor-experience">
                        {doctor.experience}{" "}
                        {doctor.experience === 1
                          ? "year"
                          : "years"}
                      </span>
                    </td>

                    {/* Status */}

                    <td>
                      <span
                        className={getStatusClass(
                          doctor.status
                        )}
                      >
                        {doctor.status ||
                          "Unknown"}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
};

export default Doctors;