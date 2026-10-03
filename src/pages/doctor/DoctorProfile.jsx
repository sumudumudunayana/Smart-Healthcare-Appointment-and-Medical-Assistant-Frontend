import { useEffect, useState } from "react";
import { toast } from "sonner";

import userService from "../../services/userService";

import "../../styles/pages/doctor/DoctorProfile.css";

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const data = await userService.getMyProfile();

      setProfile(data);

      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
      });
    } catch (error) {
      console.error("Failed to load doctor profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
    });

    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedFullName = formData.fullName.trim();

    if (!trimmedFullName) {
      toast.error("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      const updatedProfile =
        await userService.updateMyProfile({
          fullName: trimmedFullName,
          phone: formData.phone.trim() || null,
        });

      setProfile(updatedProfile);

      setFormData({
        fullName: updatedProfile.fullName || "",
        phone: updatedProfile.phone || "",
      });

      setIsEditing(false);

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update doctor profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="smarthealth-doctor-profile-page">
        <div className="smarthealth-doctor-profile-loading">
          <div className="smarthealth-doctor-profile-spinner"></div>

          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="smarthealth-doctor-profile-page">
        <div className="smarthealth-doctor-profile-error">
          <div className="smarthealth-doctor-profile-error-icon">
            !
          </div>

          <h2>Profile Not Found</h2>

          <p>
            We could not load your profile information.
          </p>

          <button
            type="button"
            className="smarthealth-doctor-profile-retry-button"
            onClick={loadProfile}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smarthealth-doctor-profile-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="smarthealth-doctor-profile-header">
        <div>
          <span className="smarthealth-doctor-profile-eyebrow">
            DOCTOR PORTAL
          </span>

          <h1 className="smarthealth-doctor-profile-title">
            My Profile
          </h1>

          <p className="smarthealth-doctor-profile-subtitle">
            View and manage your personal account information.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="smarthealth-doctor-profile-edit-button"
            onClick={handleEdit}
          >
            <span>✎</span>
            Edit Profile
          </button>
        )}
      </div>

      {/* =====================================================
          PROFILE CONTENT
      ====================================================== */}

      <div className="smarthealth-doctor-profile-content">

        {/* PROFILE SUMMARY */}

        <section className="smarthealth-doctor-profile-summary-card">

          <div className="smarthealth-doctor-profile-avatar">
            {profile.fullName?.charAt(0)?.toUpperCase() || "D"}
          </div>

          <div className="smarthealth-doctor-profile-summary-info">

            <h2 className="smarthealth-doctor-profile-name">
              {profile.fullName}
            </h2>

            <p className="smarthealth-doctor-profile-email">
              {profile.email}
            </p>

            <div className="smarthealth-doctor-profile-badges">

              <span className="smarthealth-doctor-profile-role-badge">
                {profile.role}
              </span>

              <span
                className={`smarthealth-doctor-profile-status-badge ${
                  profile.status?.toLowerCase() === "active"
                    ? "smarthealth-doctor-profile-status-active"
                    : "smarthealth-doctor-profile-status-inactive"
                }`}
              >
                <span className="smarthealth-doctor-profile-status-dot"></span>
                {profile.status}
              </span>

            </div>
          </div>

        </section>

        {/* PROFILE DETAILS */}

        <section className="smarthealth-doctor-profile-details-card">

          <div className="smarthealth-doctor-profile-card-header">
            <div>
              <h2 className="smarthealth-doctor-profile-card-title">
                Personal Information
              </h2>

              <p className="smarthealth-doctor-profile-card-description">
                Your account information stored in the healthcare system.
              </p>
            </div>
          </div>

          <form
            className="smarthealth-doctor-profile-form"
            onSubmit={handleSubmit}
          >

            {/* FULL NAME */}

            <div className="smarthealth-doctor-profile-field">

              <label
                htmlFor="smarthealth-doctor-profile-full-name"
                className="smarthealth-doctor-profile-label"
              >
                Full Name
              </label>

              <input
                id="smarthealth-doctor-profile-full-name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className="smarthealth-doctor-profile-input"
                placeholder="Enter your full name"
              />

            </div>

            {/* EMAIL */}

            <div className="smarthealth-doctor-profile-field">

              <label
                htmlFor="smarthealth-doctor-profile-email"
                className="smarthealth-doctor-profile-label"
              >
                Email Address
              </label>

              <input
                id="smarthealth-doctor-profile-email"
                type="email"
                value={profile.email || ""}
                disabled
                className="smarthealth-doctor-profile-input smarthealth-doctor-profile-input-readonly"
              />

              <span className="smarthealth-doctor-profile-field-note">
                Email address cannot be changed from this page.
              </span>

            </div>

            {/* PHONE */}

            <div className="smarthealth-doctor-profile-field">

              <label
                htmlFor="smarthealth-doctor-profile-phone"
                className="smarthealth-doctor-profile-label"
              >
                Phone Number
              </label>

              <input
                id="smarthealth-doctor-profile-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className="smarthealth-doctor-profile-input"
                placeholder="Enter your phone number"
              />

            </div>

            {/* ROLE */}

            <div className="smarthealth-doctor-profile-field">

              <label
                htmlFor="smarthealth-doctor-profile-role"
                className="smarthealth-doctor-profile-label"
              >
                Account Role
              </label>

              <input
                id="smarthealth-doctor-profile-role"
                type="text"
                value={profile.role || ""}
                disabled
                className="smarthealth-doctor-profile-input smarthealth-doctor-profile-input-readonly"
              />

              <span className="smarthealth-doctor-profile-field-note">
                Your account role is managed by the administrator.
              </span>

            </div>

            {/* STATUS */}

            <div className="smarthealth-doctor-profile-field">

              <label
                htmlFor="smarthealth-doctor-profile-status"
                className="smarthealth-doctor-profile-label"
              >
                Account Status
              </label>

              <input
                id="smarthealth-doctor-profile-status"
                type="text"
                value={profile.status || ""}
                disabled
                className="smarthealth-doctor-profile-input smarthealth-doctor-profile-input-readonly"
              />

            </div>

            {/* ACTIONS */}

            {isEditing && (
              <div className="smarthealth-doctor-profile-actions">

                <button
                  type="button"
                  className="smarthealth-doctor-profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-doctor-profile-save-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>
            )}

          </form>

        </section>

      </div>
    </div>
  );
};

export default DoctorProfile;