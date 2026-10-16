import { useEffect, useState } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiDroplet,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiHeart,
  FiClock,
} from "react-icons/fi";
import { toast } from "sonner";

import api from "../../services/api";
import "../../styles/pages/patient/PatientProfile.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateInput = (value) => {
  if (!value) return "";

  // DateOnly values are expected as YYYY-MM-DD.
  return String(value).slice(0, 10);
};

const getInitials = (name) => {
  if (!name?.trim()) return "P";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/PatientProfile/my");
      const data = response.data;

      setProfile(data);

      setForm({
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        dateOfBirth: formatDateInput(data.dateOfBirth),
        gender: data.gender ?? "",
        bloodGroup: data.bloodGroup ?? "",
        address: data.address ?? "",
        emergencyContact: data.emergencyContact ?? "",
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load your profile. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    if (!profile) return;

    // Keep the form synchronized with the saved profile.
    setForm({
      fullName: profile.fullName ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      dateOfBirth: formatDateInput(profile.dateOfBirth),
      gender: profile.gender ?? "",
      bloodGroup: profile.bloodGroup ?? "",
      address: profile.address ?? "",
      emergencyContact: profile.emergencyContact ?? "",
    });

    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        dateOfBirth: formatDateInput(profile.dateOfBirth),
        gender: profile.gender ?? "",
        bloodGroup: profile.bloodGroup ?? "",
        address: profile.address ?? "",
        emergencyContact: profile.emergencyContact ?? "",
      });
    }

    setEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (form.dateOfBirth) {
      const selectedDate = new Date(
        `${form.dateOfBirth}T00:00:00`
      );

      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate > new Date()
      ) {
        toast.error("Please enter a valid date of birth.");
        return;
      }
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || null,
      bloodGroup: form.bloodGroup || null,
      address: form.address.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
    };

    setSaving(true);

    try {
      const response = await api.put(
        "/PatientProfile/my",
        payload
      );

      const data = response.data;

      setProfile(data);

      setForm({
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        dateOfBirth: formatDateInput(data.dateOfBirth),
        gender: data.gender ?? "",
        bloodGroup: data.bloodGroup ?? "",
        address: data.address ?? "",
        emergencyContact: data.emergencyContact ?? "",
      });

      setEditing(false);
      toast.success("Your profile has been updated successfully.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to update your profile. Please try again.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const renderField = ({
    name,
    label,
    icon: Icon,
    type = "text",
    placeholder = "",
    required = false,
    options = null,
    rows = null,
    readOnly = false,
  }) => {
    const value = editing ? form[name] : profile?.[name];

    return (
      <div className="patient-profile-field" key={name}>
        <label htmlFor={`profile-${name}`}>
          {label}
          {editing && required && (
            <span className="patient-profile-required"> *</span>
          )}
        </label>

        <div
          className={`patient-profile-input-wrapper ${
            editing ? "is-editing" : "is-readonly"
          }`}
        >
          <span className="patient-profile-input-icon">
            <Icon />
          </span>

          {editing && !readOnly ? (
            options ? (
              <select
                id={`profile-${name}`}
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={required}
              >
                <option value="">Select {label.toLowerCase()}</option>

                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : rows ? (
              <textarea
                id={`profile-${name}`}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                rows={rows}
                required={required}
              />
            ) : (
              <input
                id={`profile-${name}`}
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
              />
            )
          ) : (
            <div className="patient-profile-field-value">
              {name === "dateOfBirth"
                ? formatDate(value)
                : value || "Not provided"}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="patient-profile-page">
        <div className="patient-profile-state">
          <div className="patient-profile-loader" />
          <h3>Loading your profile</h3>
          <p>Please wait while we retrieve your information.</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="patient-profile-page">
        <div className="patient-profile-state">
          <div className="patient-profile-state-icon error">
            <FiAlertCircle />
          </div>

          <h3>Unable to load your profile</h3>
          <p>{error}</p>

          <button
            type="button"
            className="patient-profile-primary-btn"
            onClick={fetchProfile}
          >
            <FiRefreshCw />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="patient-profile-page">
      {/* Page heading */}
      <div className="patient-profile-page-header">
        <div>
          <h1>My Profile</h1>
          <p>
            Manage your personal information and keep your healthcare
            details up to date.
          </p>
        </div>

        {!editing ? (
          <button
            type="button"
            className="patient-profile-primary-btn"
            onClick={handleEdit}
          >
            <FiEdit2 />
            Edit profile
          </button>
        ) : (
          <div className="patient-profile-header-actions">
            <button
              type="button"
              className="patient-profile-secondary-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <FiX />
              Cancel
            </button>

            <button
              type="submit"
              form="patient-profile-form"
              className="patient-profile-primary-btn"
              disabled={saving}
            >
              <FiSave />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </div>

      {/* Profile overview */}
      <section className="patient-profile-overview">
        <div className="patient-profile-avatar">
          {getInitials(profile.fullName)}
        </div>

        <div className="patient-profile-overview-info">
          <span className="patient-profile-overline">
            PATIENT PROFILE
          </span>

          <h2>{profile.fullName}</h2>

          <div className="patient-profile-overview-email">
            <FiMail />
            <span>{profile.email}</span>
          </div>

          <div className="patient-profile-overview-meta">
            <span className="patient-profile-status">
              <span className="patient-profile-status-dot" />
              {profile.status || "Unknown status"}
            </span>

            <span className="patient-profile-member-date">
              <FiClock />
              Member since {formatDate(profile.createdAt)}
            </span>
          </div>
        </div>

        <div className="patient-profile-overview-badge">
          <FiShield />
          <span>Patient account</span>
        </div>
      </section>

      {/* Profile form */}
      <form
        id="patient-profile-form"
        onSubmit={handleSubmit}
        className="patient-profile-form"
      >
        {/* Personal information */}
        <section className="patient-profile-section">
          <div className="patient-profile-section-header">
            <div className="patient-profile-section-icon">
              <FiUser />
            </div>

            <div>
              <h2>Personal information</h2>
              <p>Your basic personal details.</p>
            </div>
          </div>

          <div className="patient-profile-fields-grid">
            {renderField({
              name: "fullName",
              label: "Full name",
              icon: FiUser,
              placeholder: "Enter your full name",
              required: true,
            })}

            {renderField({
              name: "dateOfBirth",
              label: "Date of birth",
              icon: FiCalendar,
              type: "date",
            })}

            {renderField({
              name: "gender",
              label: "Gender",
              icon: FiUser,
              options: [
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ],
            })}
          </div>
        </section>

        {/* Contact information */}
        <section className="patient-profile-section">
          <div className="patient-profile-section-header">
            <div className="patient-profile-section-icon">
              <FiPhone />
            </div>

            <div>
              <h2>Contact information</h2>
              <p>How your healthcare provider can contact you.</p>
            </div>
          </div>

          <div className="patient-profile-fields-grid">
            {renderField({
              name: "email",
              label: "Email address",
              icon: FiMail,
              type: "email",
              placeholder: "Enter your email address",
              required: true,
            })}

            {renderField({
              name: "phone",
              label: "Phone number",
              icon: FiPhone,
              type: "tel",
              placeholder: "Enter your phone number",
            })}

            <div className="patient-profile-field patient-profile-field-full">
              {renderField({
                name: "address",
                label: "Home address",
                icon: FiMapPin,
                placeholder: "Enter your home address",
                rows: 3,
              })}
            </div>
          </div>
        </section>

        {/* Medical information */}
        <section className="patient-profile-section">
          <div className="patient-profile-section-header">
            <div className="patient-profile-section-icon">
              <FiHeart />
            </div>

            <div>
              <h2>Medical information</h2>
              <p>Basic medical information associated with your account.</p>
            </div>
          </div>

          <div className="patient-profile-fields-grid">
            {renderField({
              name: "bloodGroup",
              label: "Blood group",
              icon: FiDroplet,
              options: [
                { value: "A+", label: "A+" },
                { value: "A-", label: "A-" },
                { value: "B+", label: "B+" },
                { value: "B-", label: "B-" },
                { value: "AB+", label: "AB+" },
                { value: "AB-", label: "AB-" },
                { value: "O+", label: "O+" },
                { value: "O-", label: "O-" },
              ],
            })}
          </div>
        </section>

        {/* Emergency contact */}
        <section className="patient-profile-section">
          <div className="patient-profile-section-header">
            <div className="patient-profile-section-icon">
              <FiAlertCircle />
            </div>

            <div>
              <h2>Emergency contact</h2>
              <p>Contact information to use in an emergency.</p>
            </div>
          </div>

          <div className="patient-profile-fields-grid">
            {renderField({
              name: "emergencyContact",
              label: "Emergency contact number",
              icon: FiPhone,
              type: "tel",
              placeholder: "Enter an emergency contact number",
            })}
          </div>
        </section>

        {/* Edit mode footer */}
        {editing && (
          <div className="patient-profile-form-footer">
            <p>
              <FiAlertCircle />
              Make sure your information is accurate before saving.
            </p>

            <div className="patient-profile-header-actions">
              <button
                type="button"
                className="patient-profile-secondary-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="patient-profile-primary-btn"
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Account information */}
      <section className="patient-profile-account-note">
        <div className="patient-profile-account-note-icon">
          <FiShield />
        </div>

        <div>
          <h3>Your information matters</h3>
          <p>
            Keep your contact and medical information accurate. Your profile
            is associated with your healthcare appointments and medical
            records.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PatientProfile;