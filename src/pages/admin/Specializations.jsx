import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import specializationService from "../../services/specializationService";

import "../../styles/pages/admin/Specializations.css";

const Specializations = () => {
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationName, setSpecializationName] = useState("");

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    setLoading(true);

    try {
      const data = await specializationService.getAll();

      setSpecializations(data || []);
    } catch (error) {
      console.error(
        "Failed to load specializations:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load specializations.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpecializations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return specializations;
    }

    return specializations.filter((specialization) =>
      specialization.name
        ?.toLowerCase()
        .includes(term)
    );
  }, [specializations, searchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = specializationName.trim();

    if (!name) {
      toast.error("Specialization name is required.");
      return;
    }

    setCreating(true);

    try {
      const created =
        await specializationService.create({
          name,
        });

      setSpecializations((current) =>
        [...current, created].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setSpecializationName("");

      toast.success(
        "Specialization created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create specialization:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to create specialization.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="smarthealth-admin-specializations">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="smarthealth-admin-specializations-header">

        <div>
          <span className="smarthealth-admin-specializations-eyebrow">
            Management
          </span>

          <h1>Specializations</h1>

          <p>
            Manage the medical specializations available
            in the healthcare system.
          </p>
        </div>

        <div className="smarthealth-admin-specializations-count">
          <span>Total</span>
          <strong>{specializations.length}</strong>
        </div>

      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="smarthealth-admin-specializations-content">

        {/* ===================================================
            ADD SPECIALIZATION
        ==================================================== */}

        <div className="smarthealth-admin-specialization-form-card">

          <div className="smarthealth-admin-specialization-form-header">
            <div className="smarthealth-admin-specialization-form-icon">
              +
            </div>

            <div>
              <h2>Add Specialization</h2>

              <p>
                Create a new medical specialization.
              </p>
            </div>
          </div>

          <form
            className="smarthealth-admin-specialization-form"
            onSubmit={handleSubmit}
          >
            <div className="smarthealth-admin-specialization-field">

              <label htmlFor="specializationName">
                Specialization Name
              </label>

              <input
                id="specializationName"
                type="text"
                value={specializationName}
                onChange={(event) =>
                  setSpecializationName(
                    event.target.value
                  )
                }
                placeholder="e.g. Cardiology"
                maxLength={100}
                disabled={creating}
              />

            </div>

            <button
              type="submit"
              className="smarthealth-admin-specialization-submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="smarthealth-admin-button-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span>+</span>
                  Add Specialization
                </>
              )}
            </button>

          </form>

        </div>

        {/* ===================================================
            LIST CARD
        ==================================================== */}

        <div className="smarthealth-admin-specializations-list-card">

          <div className="smarthealth-admin-specializations-list-header">

            <div>
              <h2>All Specializations</h2>

              <p>
                View and search registered medical
                specializations.
              </p>
            </div>

            <div className="smarthealth-admin-specializations-search">

              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search specializations..."
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
            <div className="smarthealth-admin-specializations-loading">

              <div className="smarthealth-admin-specializations-spinner"></div>

              <p>
                Loading specializations...
              </p>

            </div>
          ) : filteredSpecializations.length === 0 ? (

            /* ===============================================
               EMPTY STATE
            ================================================ */

            <div className="smarthealth-admin-specializations-empty">

              <div className="smarthealth-admin-specializations-empty-icon">
                ✦
              </div>

              {searchTerm ? (
                <>
                  <h3>
                    No matching specializations
                  </h3>

                  <p>
                    No specialization matches "{searchTerm}".
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
                    No specializations found
                  </h3>

                  <p>
                    Add your first medical specialization
                    using the form above.
                  </p>
                </>
              )}

            </div>
          ) : (

            /* ===============================================
               TABLE
            ================================================ */

            <div className="smarthealth-admin-specializations-table-wrapper">

              <table className="smarthealth-admin-specializations-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Specialization</th>
                    <th>ID</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredSpecializations.map(
                    (specialization, index) => (
                      <tr
                        key={
                          specialization.specializationId
                        }
                      >

                        <td>
                          <span className="smarthealth-admin-specialization-number">
                            {index + 1}
                          </span>
                        </td>

                        <td>
                          <div className="smarthealth-admin-specialization-name">

                            <span className="smarthealth-admin-specialization-icon">
                              ✦
                            </span>

                            <strong>
                              {specialization.name}
                            </strong>

                          </div>
                        </td>

                        <td>
                          <span className="smarthealth-admin-specialization-id">
                            {specialization.specializationId}
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

    </div>
  );
};

export default Specializations;