import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import specializationService from "../../services/specializationService";
import "../../styles/pages/admin/Specializations.css";

const Specializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add specialization
  const [creating, setCreating] = useState(false);
  const [specializationName, setSpecializationName] = useState("");
  const [specializationDescription, setSpecializationDescription] =
    useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal
  const [editingSpecialization, setEditingSpecialization] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadSpecializations();
  }, []);

  // ============================================================
  // LOAD SPECIALIZATIONS
  // ============================================================

  const loadSpecializations = async () => {
    setLoading(true);

    try {
      const data = await specializationService.getAll();

      setSpecializations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load specializations:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load specializations."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredSpecializations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return specializations;
    }

    return specializations.filter((specialization) => {
      const name = specialization.name?.toLowerCase() || "";
      const description = specialization.description?.toLowerCase() || "";

      return name.includes(term) || description.includes(term);
    });
  }, [specializations, searchTerm]);

  // ============================================================
  // CREATE SPECIALIZATION
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = specializationName.trim();
    const description = specializationDescription.trim();

    if (!name) {
      toast.error("Specialization name is required.");
      return;
    }

    if (name.length > 100) {
      toast.error("Specialization name cannot exceed 100 characters.");
      return;
    }

    if (description.length > 1000) {
      toast.error("Description cannot exceed 1000 characters.");
      return;
    }

    setCreating(true);

    try {
      const created = await specializationService.create({
        name,
        description: description || null,
      });

      setSpecializations((current) =>
        [...current, created].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        )
      );

      setSpecializationName("");
      setSpecializationDescription("");

      toast.success("Specialization created successfully.");
    } catch (error) {
      console.error("Failed to create specialization:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to create specialization."
      );
    } finally {
      setCreating(false);
    }
  };

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const openEditModal = (specialization) => {
    setEditingSpecialization(specialization);
    setEditName(specialization.name || "");
    setEditDescription(specialization.description || "");
  };

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  const closeEditModal = () => {
    if (updating) {
      return;
    }

    setEditingSpecialization(null);
    setEditName("");
    setEditDescription("");
  };

  // ============================================================
  // UPDATE SPECIALIZATION
  // ============================================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingSpecialization) {
      return;
    }

    const name = editName.trim();
    const description = editDescription.trim();

    if (!name) {
      toast.error("Specialization name is required.");
      return;
    }

    if (name.length > 100) {
      toast.error("Specialization name cannot exceed 100 characters.");
      return;
    }

    if (description.length > 1000) {
      toast.error("Description cannot exceed 1000 characters.");
      return;
    }

    setUpdating(true);

    try {
      const updated = await specializationService.update(
        editingSpecialization.specializationId,
        {
          name,
          description: description || null,
        }
      );

      setSpecializations((current) =>
        current
          .map((specialization) =>
            specialization.specializationId ===
            editingSpecialization.specializationId
              ? {
                  ...specialization,
                  ...updated,
                  name: updated?.name ?? name,
                  description:
                    updated?.description ?? (description || null),
                }
              : specialization
          )
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      );

      toast.success("Specialization updated successfully.");

      setEditingSpecialization(null);
      setEditName("");
      setEditDescription("");
    } catch (error) {
      console.error("Failed to update specialization:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to update specialization."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // DELETE SPECIALIZATION
  // ============================================================

  const handleDelete = async (specialization) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${specialization.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(specialization.specializationId);

    try {
      await specializationService.delete(
        specialization.specializationId
      );

      setSpecializations((current) =>
        current.filter(
          (item) =>
            item.specializationId !== specialization.specializationId
        )
      );

      toast.success("Specialization deleted successfully.");
    } catch (error) {
      console.error("Failed to delete specialization:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to delete specialization."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-admin-specializations">
      {/* PAGE HEADER */}

      <section className="smarthealth-admin-specializations-header">
        <div>
          <span className="smarthealth-admin-specializations-eyebrow">
            Management
          </span>

          <h1>Specializations</h1>

          <p>
            Manage the medical specializations available in the
            healthcare system.
          </p>
        </div>

        <div className="smarthealth-admin-specializations-count">
          <span>Total Specializations</span>
          <strong>{specializations.length}</strong>
        </div>
      </section>

      {/* CONTENT */}

      <section className="smarthealth-admin-specializations-content">
        {/* ADD SPECIALIZATION */}

        <div className="smarthealth-admin-specialization-form-card">
          <div className="smarthealth-admin-specialization-form-header">
            <div className="smarthealth-admin-specialization-form-icon">
              +
            </div>

            <div>
              <h2>Add Specialization</h2>
              <p>Create a new medical specialization.</p>
            </div>
          </div>

          <form
            className="smarthealth-admin-specialization-form smarthealth-admin-specialization-add-form"
            onSubmit={handleSubmit}
          >
            <div className="smarthealth-admin-specialization-field">
              <label htmlFor="specializationName">
                Specialization Name <span>*</span>
              </label>

              <input
                id="specializationName"
                type="text"
                value={specializationName}
                onChange={(event) =>
                  setSpecializationName(event.target.value)
                }
                placeholder="e.g. Cardiology"
                maxLength={100}
                disabled={creating}
                required
              />
            </div>

            <div className="smarthealth-admin-specialization-field smarthealth-admin-specialization-description-field">
              <label htmlFor="specializationDescription">
                Description
              </label>

              <textarea
                id="specializationDescription"
                value={specializationDescription}
                onChange={(event) =>
                  setSpecializationDescription(event.target.value)
                }
                placeholder="Describe this medical specialization..."
                maxLength={1000}
                rows={3}
                disabled={creating}
              />

              <span className="smarthealth-admin-specialization-character-count">
                {specializationDescription.length}/1000
              </span>
            </div>

            <button
              type="submit"
              className="smarthealth-admin-specialization-submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="smarthealth-admin-button-spinner" />
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

        {/* SPECIALIZATION LIST */}

        <div className="smarthealth-admin-specializations-list-card">
          <div className="smarthealth-admin-specializations-list-header">
            <div>
              <h2>All Specializations</h2>
              <p>
                View, search, edit, and remove medical specializations.
              </p>
            </div>

            <div className="smarthealth-admin-specializations-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or description..."
                aria-label="Search specializations"
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

          {/* LOADING */}

          {loading ? (
            <div className="smarthealth-admin-specializations-loading">
              <div className="smarthealth-admin-specializations-spinner" />
              <p>Loading specializations...</p>
            </div>
          ) : filteredSpecializations.length === 0 ? (
            /* EMPTY STATE */

            <div className="smarthealth-admin-specializations-empty">
              <div className="smarthealth-admin-specializations-empty-icon">
                ✦
              </div>

              {searchTerm ? (
                <>
                  <h3>No matching specializations</h3>
                  <p>
                    No specialization matches &quot;{searchTerm}&quot;.
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
                  <h3>No specializations found</h3>
                  <p>
                    Add your first medical specialization using the
                    form above.
                  </p>
                </>
              )}
            </div>
          ) : (
            /* TABLE */

            <div className="smarthealth-admin-specializations-table-wrapper">
              <table className="smarthealth-admin-specializations-table">
                <thead>
                  <tr>
                    <th className="smarthealth-admin-specialization-number-column">
                      #
                    </th>
                    <th>Specialization</th>
                    <th>Description</th>
                    <th className="smarthealth-admin-specialization-actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSpecializations.map(
                    (specialization, index) => (
                      <tr key={specialization.specializationId}>
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

                            <strong>{specialization.name}</strong>
                          </div>
                        </td>

                        <td>
                          <p className="smarthealth-admin-specialization-description-text">
                            {specialization.description?.trim() ||
                              "No description provided."}
                          </p>
                        </td>

                        <td>
                          <div className="smarthealth-admin-specialization-actions">
                            <button
                              type="button"
                              className="smarthealth-admin-specialization-action-button smarthealth-admin-specialization-edit-button"
                              onClick={() =>
                                openEditModal(specialization)
                              }
                              disabled={deletingId !== null}
                              aria-label={`Edit ${specialization.name}`}
                              title="Edit specialization"
                            >
                              <span aria-hidden="true">✎</span>
                              Edit
                            </button>

                            <button
                              type="button"
                              className="smarthealth-admin-specialization-action-button smarthealth-admin-specialization-delete-button"
                              onClick={() =>
                                handleDelete(specialization)
                              }
                              disabled={
                                deletingId !== null ||
                                updating
                              }
                              aria-label={`Delete ${specialization.name}`}
                              title="Delete specialization"
                            >
                              {deletingId ===
                              specialization.specializationId ? (
                                <>
                                  <span className="smarthealth-admin-specialization-delete-spinner" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <span aria-hidden="true">⌫</span>
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
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

      {/* EDIT SPECIALIZATION MODAL */}

      {editingSpecialization && (
        <div
          className="smarthealth-admin-specialization-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updating
            ) {
              closeEditModal();
            }
          }}
        >
          <section
            className="smarthealth-admin-specialization-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-specialization-modal-title"
          >
            <div className="smarthealth-admin-specialization-modal-header">
              <div className="smarthealth-admin-specialization-modal-heading">
                <div className="smarthealth-admin-specialization-modal-icon">
                  ✎
                </div>

                <div>
                  <h2 id="smarthealth-specialization-modal-title">
                    Edit Specialization
                  </h2>
                  <p>Update the specialization details below.</p>
                </div>
              </div>

              <button
                type="button"
                className="smarthealth-admin-specialization-modal-close"
                onClick={closeEditModal}
                disabled={updating}
                aria-label="Close edit dialog"
              >
                ×
              </button>
            </div>

            <form
              className="smarthealth-admin-specialization-modal-form"
              onSubmit={handleUpdate}
            >
              <div className="smarthealth-admin-specialization-modal-field">
                <label htmlFor="editSpecializationName">
                  Specialization Name <span>*</span>
                </label>

                <input
                  id="editSpecializationName"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter specialization name"
                  maxLength={100}
                  required
                  disabled={updating}
                  autoFocus
                />
              </div>

              <div className="smarthealth-admin-specialization-modal-field">
                <label htmlFor="editSpecializationDescription">
                  Description
                </label>

                <textarea
                  id="editSpecializationDescription"
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(event.target.value)
                  }
                  placeholder="Enter specialization description..."
                  maxLength={1000}
                  rows={5}
                  disabled={updating}
                />

                <span className="smarthealth-admin-specialization-character-count">
                  {editDescription.length}/1000
                </span>
              </div>

              <div className="smarthealth-admin-specialization-modal-footer">
                <button
                  type="button"
                  className="smarthealth-admin-specialization-modal-cancel"
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-admin-specialization-modal-save"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="smarthealth-admin-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✓</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Specializations;