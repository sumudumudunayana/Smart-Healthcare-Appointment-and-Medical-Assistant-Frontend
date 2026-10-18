import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import departmentService from "../../services/departmentService";
import "../../styles/pages/admin/Departments.css";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Add department form
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Update department modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editForm, setEditForm] = useState({
    departmentName: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  // =========================================================
  // LOAD DEPARTMENTS
  // =========================================================

  const loadDepartments = async () => {
    setLoading(true);

    try {
      const data = await departmentService.getAll();
      setDepartments(data || []);
    } catch (error) {
      console.error("Failed to load departments:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load departments.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return departments;
    }

    return departments.filter((department) => {
      const name = department.departmentName?.toLowerCase() || "";
      const departmentDescription =
        department.description?.toLowerCase() || "";
      const departmentLocation = department.location?.toLowerCase() || "";

      return (
        name.includes(term) ||
        departmentDescription.includes(term) ||
        departmentLocation.includes(term)
      );
    });
  }, [departments, searchTerm]);

  // =========================================================
  // RESET ADD FORM
  // =========================================================

  const resetForm = () => {
    setDepartmentName("");
    setDescription("");
    setLocation("");
  };

  // =========================================================
  // CREATE DEPARTMENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = departmentName.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (!name) {
      toast.error("Department name is required.");
      return;
    }

    setCreating(true);

    try {
      const created = await departmentService.create({
        departmentName: name,
        description: trimmedDescription || null,
        location: trimmedLocation || null,
      });

      setDepartments((current) =>
        [...current, created].sort((a, b) =>
          a.departmentName.localeCompare(b.departmentName),
        ),
      );

      resetForm();
      toast.success("Department created successfully.");
    } catch (error) {
      console.error("Failed to create department:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to create department.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // OPEN UPDATE MODAL
  // =========================================================

  const handleEditClick = (department) => {
    setEditingDepartmentId(department.departmentId);

    setEditForm({
      departmentName: department.departmentName || "",
      description: department.description || "",
      location: department.location || "",
    });

    setIsEditModalOpen(true);
  };

  // =========================================================
  // CLOSE UPDATE MODAL
  // =========================================================

  const handleCloseEditModal = () => {
    if (updating) {
      return;
    }

    setIsEditModalOpen(false);
    setEditingDepartmentId(null);

    setEditForm({
      departmentName: "",
      description: "",
      location: "",
    });
  };

  // =========================================================
  // UPDATE FORM INPUTS
  // =========================================================

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // UPDATE DEPARTMENT
  // =========================================================

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    const name = editForm.departmentName.trim();
    const trimmedDescription = editForm.description.trim();
    const trimmedLocation = editForm.location.trim();

    if (!name) {
      toast.error("Department name is required.");
      return;
    }

    if (!editingDepartmentId) {
      toast.error("Unable to identify the department to update.");
      return;
    }

    setUpdating(true);

    try {
      const updated = await departmentService.update(editingDepartmentId, {
        departmentName: name,
        description: trimmedDescription || null,
        location: trimmedLocation || null,
      });

      // Update the department in the existing list.
      // Use the returned object when the API returns one.
      setDepartments((current) =>
        current
          .map((department) =>
            department.departmentId === editingDepartmentId
              ? {
                  ...department,
                  ...(updated || {}),
                  departmentId: editingDepartmentId,
                  departmentName: name,
                  description: trimmedDescription || null,
                  location: trimmedLocation || null,
                }
              : department,
          )
          .sort((a, b) => a.departmentName.localeCompare(b.departmentName)),
      );

      setIsEditModalOpen(false);
      setEditingDepartmentId(null);

      setEditForm({
        departmentName: "",
        description: "",
        location: "",
      });

      toast.success("Department updated successfully.");
    } catch (error) {
      console.error("Failed to update department:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to update department.";

      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // DELETE DEPARTMENT
  // =========================================================

  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.departmentName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(department.departmentId);

    try {
      await departmentService.delete(department.departmentId);

      setDepartments((current) =>
        current.filter(
          (item) => item.departmentId !== department.departmentId,
        ),
      );

      // Close the edit modal if this department is being edited.
      if (editingDepartmentId === department.departmentId) {
        setIsEditModalOpen(false);
        setEditingDepartmentId(null);
      }

      toast.success("Department deleted successfully.");
    } catch (error) {
      console.error("Failed to delete department:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to delete department.";

      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="smarthealth-admin-departments">
      {/* PAGE HEADER */}

      <section className="smarthealth-admin-departments-header">
        <div>
          <span className="smarthealth-admin-departments-eyebrow">
            Management
          </span>

          <h1>Departments</h1>

          <p>Manage the departments available in the healthcare system.</p>
        </div>

        <div className="smarthealth-admin-departments-count">
          <span>Total</span>
          <strong>{departments.length}</strong>
        </div>
      </section>

      {/* ADD DEPARTMENT */}

      <section className="smarthealth-admin-department-form-card">
        <div className="smarthealth-admin-department-form-header">
          <div className="smarthealth-admin-department-form-icon">+</div>

          <div>
            <h2>Add Department</h2>
            <p>Create a new healthcare department.</p>
          </div>
        </div>

        <form
          className="smarthealth-admin-department-form"
          onSubmit={handleSubmit}
        >
          <div className="smarthealth-admin-department-field">
            <label htmlFor="departmentName">Department Name</label>

            <input
              id="departmentName"
              type="text"
              value={departmentName}
              onChange={(event) => setDepartmentName(event.target.value)}
              placeholder="e.g. Cardiology Department"
              maxLength={100}
              disabled={creating}
              required
            />
          </div>

          <div className="smarthealth-admin-department-field">
            <label htmlFor="departmentLocation">Location</label>

            <input
              id="departmentLocation"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Main Building - Floor 2"
              maxLength={150}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-department-field smarthealth-admin-department-description-field">
            <label htmlFor="departmentDescription">Description</label>

            <input
              id="departmentDescription"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Brief department description"
              maxLength={300}
              disabled={creating}
            />
          </div>

          <button
            type="submit"
            className="smarthealth-admin-department-submit"
            disabled={creating}
          >
            {creating ? (
              <>
                <span className="smarthealth-admin-department-button-spinner" />
                Creating...
              </>
            ) : (
              <>
                <span>+</span>
                Add Department
              </>
            )}
          </button>
        </form>
      </section>

      {/* DEPARTMENT LIST */}

      <section className="smarthealth-admin-departments-list-card">
        <div className="smarthealth-admin-departments-list-header">
          <div>
            <h2>All Departments</h2>
            <p>View, search, update, and delete registered departments.</p>
          </div>

          <div className="smarthealth-admin-departments-search">
            <span>⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search departments..."
              aria-label="Search departments"
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
          <div className="smarthealth-admin-departments-loading">
            <div className="smarthealth-admin-departments-spinner" />
            <p>Loading departments...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          /* EMPTY STATE */

          <div className="smarthealth-admin-departments-empty">
            <div className="smarthealth-admin-departments-empty-icon">▦</div>

            {searchTerm ? (
              <>
                <h3>No matching departments</h3>
                <p>No department matches "{searchTerm}".</p>

                <button type="button" onClick={() => setSearchTerm("")}>
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3>No departments found</h3>
                <p>
                  Add your first healthcare department using the form above.
                </p>
              </>
            )}
          </div>
        ) : (
          /* DEPARTMENT TABLE */

          <div className="smarthealth-admin-departments-table-wrapper">
            <table className="smarthealth-admin-departments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th className="smarthealth-admin-department-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map((department, index) => (
                  <tr key={department.departmentId}>
                    <td>
                      <span className="smarthealth-admin-department-number">
                        {index + 1}
                      </span>
                    </td>

                    <td>
                      <div className="smarthealth-admin-department-name">
                        <span className="smarthealth-admin-department-icon">
                          ▦
                        </span>

                        <strong>{department.departmentName}</strong>
                      </div>
                    </td>

                    <td>
                      {department.location ? (
                        <span className="smarthealth-admin-department-location">
                          <span>⌖</span>
                          {department.location}
                        </span>
                      ) : (
                        <span className="smarthealth-admin-department-muted">
                          Not specified
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="smarthealth-admin-department-description">
                        {department.description || "No description"}
                      </span>
                    </td>

                    <td>
                      <div className="smarthealth-admin-department-actions">
                        <button
                          type="button"
                          className="smarthealth-admin-department-action-button smarthealth-admin-department-edit-button"
                          onClick={() => handleEditClick(department)}
                          disabled={deletingId === department.departmentId}
                          aria-label={`Edit ${department.departmentName}`}
                          title="Edit department"
                        >
                          <span aria-hidden="true">✎</span>
                          Edit
                        </button>

                        <button
                          type="button"
                          className="smarthealth-admin-department-action-button smarthealth-admin-department-delete-button"
                          onClick={() => handleDelete(department)}
                          disabled={
                            deletingId === department.departmentId ||
                            updating
                          }
                          aria-label={`Delete ${department.departmentName}`}
                          title="Delete department"
                        >
                          {deletingId === department.departmentId ? (
                            <>
                              <span className="smarthealth-admin-department-button-spinner" />
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* UPDATE DEPARTMENT MODAL */}

      {isEditModalOpen && (
        <div
          className="smarthealth-admin-department-modal-overlay"
          role="presentation"
        >
          <section
            className="smarthealth-admin-department-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-department-modal-title"
          >
            <div className="smarthealth-admin-department-modal-header">
              <div>
                <span className="smarthealth-admin-department-modal-eyebrow">
                  Department Management
                </span>

                <h2 id="smarthealth-department-modal-title">
                  Update Department
                </h2>

                <p>Edit the department details below.</p>
              </div>

              <button
                type="button"
                className="smarthealth-admin-department-modal-close"
                onClick={handleCloseEditModal}
                disabled={updating}
                aria-label="Close update modal"
              >
                ×
              </button>
            </div>

            <form
              className="smarthealth-admin-department-modal-form"
              onSubmit={handleUpdateSubmit}
            >
              <div className="smarthealth-admin-department-modal-field">
                <label htmlFor="editDepartmentName">Department Name</label>

                <input
                  id="editDepartmentName"
                  name="departmentName"
                  type="text"
                  value={editForm.departmentName}
                  onChange={handleEditFormChange}
                  placeholder="e.g. Cardiology Department"
                  maxLength={100}
                  required
                  disabled={updating}
                />
              </div>

              <div className="smarthealth-admin-department-modal-field">
                <label htmlFor="editDepartmentLocation">Location</label>

                <input
                  id="editDepartmentLocation"
                  name="location"
                  type="text"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  placeholder="e.g. Main Building - Floor 2"
                  maxLength={150}
                  disabled={updating}
                />
              </div>

              <div className="smarthealth-admin-department-modal-field">
                <label htmlFor="editDepartmentDescription">Description</label>

                <textarea
                  id="editDepartmentDescription"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  placeholder="Enter a brief department description"
                  maxLength={300}
                  rows={4}
                  disabled={updating}
                />
              </div>

              <div className="smarthealth-admin-department-modal-actions">
                <button
                  type="button"
                  className="smarthealth-admin-department-modal-cancel"
                  onClick={handleCloseEditModal}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-admin-department-modal-save"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="smarthealth-admin-department-button-spinner" />
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

export default Departments;