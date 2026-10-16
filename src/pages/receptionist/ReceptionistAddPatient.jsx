import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import patientService from "../../services/patientService";
import "../../styles/pages/receptionist/ReceptionistPatients.css";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

const ReceptionistAddPatient = () => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const update = ({ target: { name, value } }) =>
    setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      toast.error("Full name, email, and password are required.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      await patientService.create({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        address: form.address.trim() || null,
        emergencyContact: form.emergencyContact.trim() || null,
      });
      toast.success("Patient added successfully.");
      navigate("/receptionist/patients");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to add the patient.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="smarthealth-receptionist-patients-page">
      <div className="smarthealth-receptionist-patients-header">
        <div>
          <span className="smarthealth-receptionist-patients-eyebrow">
            Patient management
          </span>
          <h1>Add Patient</h1>
          <p>
            Create a patient account and record their contact and care details.
          </p>
        </div>
        <button
          type="button"
          className="smarthealth-receptionist-patients-secondary-button"
          onClick={() => navigate("/receptionist/patients")}
        >
          View Patients
        </button>
      </div>
      <form className="smarthealth-receptionist-patient-form" onSubmit={submit}>
        <section>
          <h2>Account details</h2>
          <p>These details are used for the patient’s secure account.</p>
          <div className="smarthealth-receptionist-patient-form-grid">
            <Field
              label="Full name *"
              name="fullName"
              value={form.fullName}
              onChange={update}
              placeholder="e.g. Nimal Perera"
              disabled={saving}
            />
            <Field
              label="Email *"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              placeholder="e.g. nimal@email.com"
              disabled={saving}
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={update}
              placeholder="e.g. 077 123 4567"
              disabled={saving}
            />
            <Field
              label="Temporary password *"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              placeholder="At least 6 characters"
              disabled={saving}
            />
          </div>
        </section>
        <section>
          <h2>Personal & care details</h2>
          <p>Optional information helps the care team support the patient.</p>
          <div className="smarthealth-receptionist-patient-form-grid">
            <Field
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={update}
              disabled={saving}
            />
            <label className="smarthealth-receptionist-patient-field">
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={update}
                disabled={saving}
              >
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <label className="smarthealth-receptionist-patient-field">
              Blood group
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={update}
                disabled={saving}
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (group) => (
                    <option key={group}>{group}</option>
                  ),
                )}
              </select>
            </label>
            <Field
              label="Emergency contact"
              name="emergencyContact"
              value={form.emergencyContact}
              onChange={update}
              placeholder="Name or phone number"
              disabled={saving}
            />
            <label className="smarthealth-receptionist-patient-field smarthealth-receptionist-patient-field-wide">
              Address
              <textarea
                name="address"
                value={form.address}
                onChange={update}
                placeholder="Patient's address"
                disabled={saving}
                rows="3"
              />
            </label>
          </div>
        </section>
        <div className="smarthealth-receptionist-patient-form-actions">
          <button
            type="button"
            className="smarthealth-receptionist-patients-secondary-button"
            onClick={() => navigate("/receptionist/patients")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="smarthealth-receptionist-patients-primary-button"
            disabled={saving}
          >
            {saving ? "Adding patient..." : "Add Patient"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, ...props }) => (
  <label className="smarthealth-receptionist-patient-field">
    {label}
    <input {...props} />
  </label>
);
export default ReceptionistAddPatient;
