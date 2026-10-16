import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import patientService from "../../services/patientService";
import "../../styles/pages/receptionist/ReceptionistPatients.css";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

const ReceptionistPatients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalMode, setModalMode] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // LOAD PATIENTS
  // --------------------------------------------------

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await patientService.getAll();
      setPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------------------------------
  // SEARCH PATIENTS
  // --------------------------------------------------

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return patients.filter((patient) =>
      [
        patient.fullName,
        patient.email,
        patient.phone,
        patient.emergencyContact,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [patients, search]);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const initials = (name) =>
    name
      ?.split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";

  const formatDate = (date) =>
    date
      ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || error.response?.data?.title || fallback;

  // --------------------------------------------------
  // OPEN VIEW / EDIT MODAL
  // --------------------------------------------------

  const openModal = async (patient, mode) => {
    setModalMode(mode);
    setSelectedPatient(patient);
    setModalLoading(true);
    setFormData(EMPTY_FORM);

    try {
      const details = await patientService.getById(patient.patientId);

      setSelectedPatient(details);

      setFormData({
        fullName: details.fullName || "",
        email: details.email || "",
        phone: details.phone || "",
        dateOfBirth: details.dateOfBirth || "",
        gender: details.gender || "",
        bloodGroup: details.bloodGroup || "",
        address: details.address || "",
        emergencyContact: details.emergencyContact || "",
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load patient details."));
      setModalMode(null);
      setSelectedPatient(null);
    } finally {
      setModalLoading(false);
    }
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const closeModal = () => {
    if (saving) return;

    setModalMode(null);
    setSelectedPatient(null);
    setFormData(EMPTY_FORM);
  };

  // --------------------------------------------------
  // HANDLE FORM CHANGES
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // UPDATE PATIENT
  // --------------------------------------------------

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedPatient) return;

    if (!formData.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender.trim() || null,
        bloodGroup: formData.bloodGroup.trim() || null,
        address: formData.address.trim() || null,
        emergencyContact: formData.emergencyContact.trim() || null,
      };

      const updatedPatient = await patientService.update(
        selectedPatient.patientId,
        payload,
      );

      setPatients((previous) =>
        previous.map((patient) =>
          patient.patientId === updatedPatient.patientId
            ? updatedPatient
            : patient,
        ),
      );

      toast.success("Patient details updated successfully.");

      setModalMode(null);
      setSelectedPatient(null);
      setFormData(EMPTY_FORM);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update patient details."));
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DEACTIVATE PATIENT
  // --------------------------------------------------

  const handleDeactivate = async (patient) => {
    if (patient.status?.toLowerCase() === "inactive") {
      toast.info("This patient account is already inactive.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${patient.fullName}'s account?\n\n` +
        "The account will be marked inactive. Existing medical records and appointment history will be preserved.",
    );

    if (!confirmed) return;

    try {
      await patientService.deactivate(patient.patientId);

      setPatients((previous) =>
        previous.map((item) =>
          item.patientId === patient.patientId
            ? { ...item, status: "Inactive" }
            : item,
        ),
      );

      toast.success("Patient account deactivated successfully.");

      if (selectedPatient?.patientId === patient.patientId) {
        setSelectedPatient((previous) =>
          previous ? { ...previous, status: "Inactive" } : previous,
        );
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to deactivate patient account."),
      );
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="smarthealth-receptionist-patients-page">
      {/* PAGE HEADER */}
      <div className="smarthealth-receptionist-patients-header">
        <div>
          <span className="smarthealth-receptionist-patients-eyebrow">
            Patient management
          </span>

          <h1>Manage Patients</h1>

          <p>
            Search, review, and manage patients registered through the reception
            desk.
          </p>
        </div>

        <Link
          className="smarthealth-receptionist-patients-primary-button"
          to="/receptionist/patients/add"
        >
          + Add Patient
        </Link>
      </div>

      {/* SUMMARY CARDS */}
      <div className="smarthealth-receptionist-patient-summary">
        <div>
          <span>Registered patients</span>
          <strong>{patients.length}</strong>
        </div>

        <div>
          <span>Active accounts</span>
          <strong>
            {
              patients.filter(
                (patient) => patient.status?.toLowerCase() === "active",
              ).length
            }
          </strong>
        </div>
      </div>

      {/* SEARCH AND REFRESH */}
      <div className="smarthealth-receptionist-patient-toolbar">
        <div className="smarthealth-receptionist-patient-search">
          <span>⌕</span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or emergency contact"
            aria-label="Search patients"
          />
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-patients-secondary-button"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* PATIENT TABLE */}
      <div className="smarthealth-receptionist-patient-table-card">
        <div className="smarthealth-receptionist-patient-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Date of birth</th>
                <th>Blood group</th>
                <th>Emergency contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="smarthealth-receptionist-patient-empty"
                  >
                    Loading patients...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((patient) => {
                  const isInactive =
                    patient.status?.toLowerCase() === "inactive";

                  return (
                    <tr key={patient.patientId}>
                      <td>
                        <div className="smarthealth-receptionist-patient-identity">
                          <span>{initials(patient.fullName)}</span>

                          <div>
                            <strong>{patient.fullName}</strong>
                            <small>{patient.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>{patient.phone || "—"}</td>

                      <td>{formatDate(patient.dateOfBirth)}</td>

                      <td>{patient.bloodGroup || "—"}</td>

                      <td>{patient.emergencyContact || "—"}</td>

                      <td>
                        <span
                          className={`smarthealth-receptionist-patient-status ${
                            isInactive
                              ? "smarthealth-patient-status-inactive"
                              : ""
                          }`}
                        >
                          {patient.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="smarthealth-receptionist-patient-actions">
                          <button
                            type="button"
                            className="smarthealth-patient-action-view"
                            onClick={() => openModal(patient, "view")}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="smarthealth-patient-action-edit"
                            onClick={() => openModal(patient, "edit")}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="smarthealth-patient-action-deactivate"
                            onClick={() => handleDeactivate(patient)}
                            disabled={isInactive}
                            title={
                              isInactive
                                ? "This account is already inactive"
                                : "Deactivate patient account"
                            }
                          >
                            {isInactive ? "Inactive" : "Deactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="smarthealth-receptionist-patient-empty"
                  >
                    {patients.length === 0
                      ? "No patients have been registered yet."
                      : "No patients match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW / EDIT MODAL */}
      {modalMode && (
        <div
          className="smarthealth-patient-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="smarthealth-patient-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-patient-modal-title"
          >
            {/* MODAL HEADER */}
            <div className="smarthealth-patient-modal-header">
              <div>
                <span className="smarthealth-receptionist-patients-eyebrow">
                  Patient management
                </span>

                <h2 id="smarthealth-patient-modal-title">
                  {modalMode === "view" ? "Patient Details" : "Update Patient"}
                </h2>

                <p>
                  {modalMode === "view"
                    ? "Review the patient's registered information."
                    : "Update the patient's personal and contact information."}
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-patient-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* MODAL CONTENT */}
            {modalLoading ? (
              <div className="smarthealth-patient-modal-loading">
                Loading patient details...
              </div>
            ) : (
              <>
                {/* PATIENT PROFILE */}
                <div className="smarthealth-patient-modal-profile">
                  <span>{initials(formData.fullName)}</span>

                  <div>
                    <strong>{formData.fullName || "Patient"}</strong>

                    <small>{formData.email || "No email address"}</small>
                  </div>

                  {selectedPatient?.status && (
                    <span
                      className={`smarthealth-receptionist-patient-status ${
                        selectedPatient.status.toLowerCase() === "inactive"
                          ? "smarthealth-patient-status-inactive"
                          : ""
                      }`}
                    >
                      {selectedPatient.status}
                    </span>
                  )}
                </div>

                {modalMode === "view" ? (
                  /* VIEW MODE */
                  <div className="smarthealth-patient-modal-body">
                    <div className="smarthealth-patient-details-grid">
                      <div>
                        <span>Full name</span>
                        <strong>{formData.fullName || "—"}</strong>
                      </div>

                      <div>
                        <span>Email address</span>
                        <strong>{formData.email || "—"}</strong>
                      </div>

                      <div>
                        <span>Phone number</span>
                        <strong>{formData.phone || "—"}</strong>
                      </div>

                      <div>
                        <span>Date of birth</span>
                        <strong>{formatDate(formData.dateOfBirth)}</strong>
                      </div>

                      <div>
                        <span>Gender</span>
                        <strong>{formData.gender || "—"}</strong>
                      </div>

                      <div>
                        <span>Blood group</span>
                        <strong>{formData.bloodGroup || "—"}</strong>
                      </div>

                      <div>
                        <span>Emergency contact</span>
                        <strong>{formData.emergencyContact || "—"}</strong>
                      </div>

                      <div>
                        <span>Account status</span>
                        <strong>{selectedPatient?.status || "Unknown"}</strong>
                      </div>

                      <div className="smarthealth-patient-detail-wide">
                        <span>Address</span>
                        <strong>{formData.address || "—"}</strong>
                      </div>

                      <div className="smarthealth-patient-detail-wide">
                        <span>Patient ID</span>
                        <strong className="smarthealth-patient-id">
                          {selectedPatient?.patientId || "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="smarthealth-patient-modal-footer">
                      <button
                        type="button"
                        className="smarthealth-receptionist-patients-secondary-button"
                        onClick={closeModal}
                      >
                        Close
                      </button>

                      {selectedPatient?.status?.toLowerCase() !==
                        "inactive" && (
                        <button
                          type="button"
                          className="smarthealth-receptionist-patients-primary-button"
                          onClick={() => setModalMode("edit")}
                        >
                          Edit Patient
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE */
                  <form onSubmit={handleUpdate}>
                    <div className="smarthealth-patient-modal-body">
                      {selectedPatient?.status?.toLowerCase() ===
                        "inactive" && (
                        <div className="smarthealth-patient-inactive-notice">
                          This account is inactive. You can review or update its
                          details, but the account remains inactive.
                        </div>
                      )}

                      <div className="smarthealth-patient-edit-grid">
                        <label className="smarthealth-receptionist-patient-field">
                          Full name *
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            maxLength={150}
                            required
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Email address *
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            maxLength={254}
                            required
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Phone number
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            maxLength={30}
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Date of birth
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Gender
                          <input
                            type="text"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            placeholder="Enter gender"
                            maxLength={50}
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Blood group
                          <select
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                          >
                            <option value="">Select blood group</option>
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                            {formData.bloodGroup &&
                              ![
                                "A+",
                                "A-",
                                "B+",
                                "B-",
                                "AB+",
                                "AB-",
                                "O+",
                                "O-",
                              ].includes(formData.bloodGroup) && (
                                <option value={formData.bloodGroup}>
                                  {formData.bloodGroup}
                                </option>
                              )}
                          </select>
                        </label>

                        <label className="smarthealth-receptionist-patient-field">
                          Emergency contact
                          <input
                            type="text"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleChange}
                            placeholder="Enter emergency contact"
                            maxLength={100}
                          />
                        </label>

                        <label className="smarthealth-receptionist-patient-field smarthealth-patient-edit-wide">
                          Address
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter patient's address"
                            rows={3}
                            maxLength={500}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="smarthealth-patient-modal-footer">
                      <button
                        type="button"
                        className="smarthealth-receptionist-patients-secondary-button"
                        onClick={() => {
                          setModalMode("view");
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="smarthealth-receptionist-patients-primary-button"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistPatients;
