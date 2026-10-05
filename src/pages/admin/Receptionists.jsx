import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import receptionistService from "../../services/receptionistService";

import "../../styles/pages/admin/Receptionists.css";

const Receptionists = () => {
  const [receptionists, setReceptionists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadReceptionists();
  }, []);

  const loadReceptionists = async () => {
    setLoading(true);

    try {
      const data = await receptionistService.getAll();

      setReceptionists(data || []);
    } catch (error) {
      console.error("Failed to load receptionists:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load receptionists.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceptionists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return receptionists;
    }

    return receptionists.filter((receptionist) => {
      const name =
        receptionist.fullName?.toLowerCase() || "";

      const receptionistEmail =
        receptionist.email?.toLowerCase() || "";

      const receptionistPhone =
        receptionist.phone?.toLowerCase() || "";

      const status =
        receptionist.status?.toLowerCase() || "";

      return (
        name.includes(term) ||
        receptionistEmail.includes(term) ||
        receptionistPhone.includes(term) ||
        status.includes(term)
      );
    });
  }, [receptionists, searchTerm]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedFullName) {
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
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setCreating(true);

    try {
      const created = await receptionistService.create({
        fullName: trimmedFullName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        password: trimmedPassword,
      });

      setReceptionists((current) =>
        [...current, created].sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        )
      );

      resetForm();

      toast.success("Receptionist created successfully.");
    } catch (error) {
      console.error(
        "Failed to create receptionist:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to create receptionist.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="smarthealth-admin-receptionists">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="smarthealth-admin-receptionists-header">

        <div>
          <span className="smarthealth-admin-receptionists-eyebrow">
            Management
          </span>

          <h1>Receptionists</h1>

          <p>
            Manage receptionists who support hospital
            administration and patient services.
          </p>
        </div>

        <div className="smarthealth-admin-receptionists-count">
          <span>Total</span>

          <strong>
            {receptionists.length}
          </strong>
        </div>

      </section>

      {/* =====================================================
          ADD RECEPTIONIST
      ====================================================== */}

      <section className="smarthealth-admin-receptionist-form-card">

        <div className="smarthealth-admin-receptionist-form-header">

          <div className="smarthealth-admin-receptionist-form-icon">
            +
          </div>

          <div>
            <h2>Add Receptionist</h2>

            <p>
              Create a new receptionist account.
            </p>
          </div>

        </div>

        <form
          className="smarthealth-admin-receptionist-form"
          onSubmit={handleSubmit}
        >

          <div className="smarthealth-admin-receptionist-field">
            <label htmlFor="receptionistFullName">
              Full Name
            </label>

            <input
              id="receptionistFullName"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="e.g. Sarah Perera"
              maxLength={150}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-receptionist-field">
            <label htmlFor="receptionistEmail">
              Email
            </label>

            <input
              id="receptionistEmail"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="e.g. sarah@hospital.com"
              maxLength={150}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-receptionist-field">
            <label htmlFor="receptionistPhone">
              Phone
            </label>

            <input
              id="receptionistPhone"
              type="text"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="e.g. 0771234567"
              maxLength={30}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-receptionist-field">
            <label htmlFor="receptionistPassword">
              Temporary Password
            </label>

            <input
              id="receptionistPassword"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter initial password"
              maxLength={100}
              disabled={creating}
            />
          </div>

          <button
            type="submit"
            className="smarthealth-admin-receptionist-submit"
            disabled={creating}
          >
            {creating ? (
              <>
                <span className="smarthealth-admin-receptionist-button-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <span>+</span>
                Add Receptionist
              </>
            )}
          </button>

        </form>

      </section>

      {/* =====================================================
          RECEPTIONIST LIST
      ====================================================== */}

      <section className="smarthealth-admin-receptionists-list-card">

        <div className="smarthealth-admin-receptionists-list-header">

          <div>
            <h2>All Receptionists</h2>

            <p>
              View and search registered receptionists.
            </p>
          </div>

          <div className="smarthealth-admin-receptionists-search">

            <span>⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search receptionists..."
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================== */}

        {loading ? (

          <div className="smarthealth-admin-receptionists-loading">

            <div className="smarthealth-admin-receptionists-spinner"></div>

            <p>
              Loading receptionists...
            </p>

          </div>

        ) : filteredReceptionists.length === 0 ? (

          /* ===============================================
             EMPTY STATE
          ================================================ */

          <div className="smarthealth-admin-receptionists-empty">

            <div className="smarthealth-admin-receptionists-empty-icon">
              ♟
            </div>

            {searchTerm ? (
              <>
                <h3>
                  No matching receptionists
                </h3>

                <p>
                  No receptionist matches "{searchTerm}".
                </p>

                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3>
                  No receptionists found
                </h3>

                <p>
                  Add your first receptionist using
                  the form above.
                </p>
              </>
            )}

          </div>

        ) : (

          /* ===============================================
             TABLE
          ================================================ */

          <div className="smarthealth-admin-receptionists-table-wrapper">

            <table className="smarthealth-admin-receptionists-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Receptionist</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredReceptionists.map(
                  (receptionist, index) => (

                    <tr
                      key={receptionist.userId}
                    >

                      <td>
                        <span className="smarthealth-admin-receptionist-number">
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <div className="smarthealth-admin-receptionist-name">

                          <span className="smarthealth-admin-receptionist-icon">
                            ♟
                          </span>

                          <strong>
                            {receptionist.fullName}
                          </strong>

                        </div>
                      </td>

                      <td>
                        <span className="smarthealth-admin-receptionist-email">
                          {receptionist.email}
                        </span>
                      </td>

                      <td>
                        {receptionist.phone ? (
                          <span className="smarthealth-admin-receptionist-phone">
                            <span>☎</span>
                            {receptionist.phone}
                          </span>
                        ) : (
                          <span className="smarthealth-admin-receptionist-muted">
                            Not specified
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`smarthealth-admin-receptionist-status ${
                            receptionist.status?.toLowerCase() ===
                            "active"
                              ? "smarthealth-admin-receptionist-status-active"
                              : "smarthealth-admin-receptionist-status-inactive"
                          }`}
                        >
                          {receptionist.status || "Unknown"}
                        </span>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
};

export default Receptionists;