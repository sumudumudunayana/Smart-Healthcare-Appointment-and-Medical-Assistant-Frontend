import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import userService from "../../services/userService";
import "../../styles/pages/admin/Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
  });

  const [updating, setUpdating] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch) ||
        user.phone?.toLowerCase().includes(normalizedSearch);

      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const roleOptions = useMemo(
    () => [...new Set(users.map((user) => user.role).filter(Boolean))].sort(),
    [users],
  );

  const statusOptions = useMemo(
    () => [...new Set(users.map((user) => user.status).filter(Boolean))].sort(),
    [users],
  );

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitials = (name) => {
    if (!name) return "U";

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getRoleClass = (role) => {
    switch (role?.toLowerCase()) {
      case "administrator":
        return "smarthealth-admin-users-role smarthealth-admin-users-role-administrator";
      case "doctor":
        return "smarthealth-admin-users-role smarthealth-admin-users-role-doctor";
      case "receptionist":
        return "smarthealth-admin-users-role smarthealth-admin-users-role-receptionist";
      case "patient":
        return "smarthealth-admin-users-role smarthealth-admin-users-role-patient";
      default:
        return "smarthealth-admin-users-role";
    }
  };

  const getStatusClass = (status) => {
    if (status?.toLowerCase() === "active") {
      return "smarthealth-admin-users-status smarthealth-admin-users-status-active";
    }

    return "smarthealth-admin-users-status smarthealth-admin-users-status-inactive";
  };

  const formatCreatedDate = (createdAt) => {
    if (!createdAt) return "—";

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status?.toLowerCase() === "active",
  ).length;

  const doctorUsers = users.filter(
    (user) => user.role?.toLowerCase() === "doctor",
  ).length;

  const patientUsers = users.filter(
    (user) => user.role?.toLowerCase() === "patient",
  ).length;

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleEditClick = (user) => {
    setEditingUser(user);

    setEditForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
    });
  };

  const handleCloseEditModal = () => {
    if (updating) return;

    setEditingUser(null);
    setEditForm({
      fullName: "",
      phone: "",
    });
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // UPDATE USER
  // =========================================================

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    const fullName = editForm.fullName.trim();
    const phone = editForm.phone.trim();

    if (!fullName) {
      toast.error("Full name is required.");
      return;
    }

    if (!editingUser) {
      toast.error("Unable to identify the user to update.");
      return;
    }

    setUpdating(true);

    try {
      const updatedUser = await userService.update(editingUser.userId, {
        fullName,
        phone: phone || null,
      });

      setUsers((current) =>
        current.map((user) =>
          user.userId === editingUser.userId
            ? {
                ...user,
                ...(updatedUser || {}),
                userId: editingUser.userId,
                fullName,
                phone: phone || null,
              }
            : user,
        ),
      );

      setEditingUser(null);
      setEditForm({
        fullName: "",
        phone: "",
      });

      toast.success("User updated successfully.");
    } catch (error) {
      console.error("Failed to update user:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to update user.",
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // ACTIVATE / DEACTIVATE USER
  // =========================================================

  const handleToggleUserStatus = async (user) => {
    const isActive = user.status?.toLowerCase() === "active";
    const newStatus = isActive ? "Inactive" : "Active";
    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} the account for "${user.fullName}"?`,
    );

    if (!confirmed) return;

    setChangingStatusId(user.userId);

    try {
      const updatedUser = await userService.updateStatus(
        user.userId,
        newStatus,
      );

      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId
            ? {
                ...item,
                ...(updatedUser || {}),
                userId: user.userId,
                status: updatedUser?.status || newStatus,
              }
            : item,
        ),
      );

      toast.success(
        `User ${isActive ? "deactivated" : "activated"} successfully.`,
      );
    } catch (error) {
      console.error("Failed to change user status:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          `Failed to ${action} user.`,
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="smarthealth-admin-users">
      {/* PAGE HEADER */}

      <section className="smarthealth-admin-users-header">
        <div className="smarthealth-admin-users-header-content">
          <span className="smarthealth-admin-users-eyebrow">
            User Management
          </span>

          <h1>Users</h1>

          <p>
            View registered users, manage account details, and control account
            status.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-admin-users-refresh-button"
          onClick={loadUsers}
          disabled={loading}
        >
          <span
            className={
              loading
                ? "smarthealth-admin-users-refresh-icon smarthealth-admin-users-refresh-spinning"
                : "smarthealth-admin-users-refresh-icon"
            }
          >
            ↻
          </span>
          Refresh
        </button>
      </section>

      {/* SUMMARY CARDS */}

      <section className="smarthealth-admin-users-summary">
        <div className="smarthealth-admin-users-summary-card">
          <div className="smarthealth-admin-users-summary-icon smarthealth-admin-users-summary-icon-total">
            U
          </div>

          <div className="smarthealth-admin-users-summary-content">
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-users-summary-card">
          <div className="smarthealth-admin-users-summary-icon smarthealth-admin-users-summary-icon-active">
            ✓
          </div>

          <div className="smarthealth-admin-users-summary-content">
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-users-summary-card">
          <div className="smarthealth-admin-users-summary-icon smarthealth-admin-users-summary-icon-doctor">
            D
          </div>

          <div className="smarthealth-admin-users-summary-content">
            <span>Doctors</span>
            <strong>{doctorUsers}</strong>
          </div>
        </div>

        <div className="smarthealth-admin-users-summary-card">
          <div className="smarthealth-admin-users-summary-icon smarthealth-admin-users-summary-icon-patient">
            P
          </div>

          <div className="smarthealth-admin-users-summary-content">
            <span>Patients</span>
            <strong>{patientUsers}</strong>
          </div>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}

      <section className="smarthealth-admin-users-filter-card">
        <div className="smarthealth-admin-users-filter-heading">
          <div>
            <h2>Find Users</h2>
            <p>Search and filter registered accounts.</p>
          </div>

          {(searchTerm || roleFilter || statusFilter) && (
            <button
              type="button"
              className="smarthealth-admin-users-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="smarthealth-admin-users-filter-controls">
          <div className="smarthealth-admin-users-search-box">
            <span className="smarthealth-admin-users-search-icon">⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, or phone..."
              aria-label="Search users"
            />

            {searchTerm && (
              <button
                type="button"
                className="smarthealth-admin-users-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            className="smarthealth-admin-users-filter-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>

            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            className="smarthealth-admin-users-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* USER LIST */}

      <section className="smarthealth-admin-users-list-card">
        <div className="smarthealth-admin-users-list-header">
          <div>
            <h2>All Users</h2>

            <p>
              {loading
                ? "Loading user records..."
                : `${filteredUsers.length} of ${users.length} user${
                    users.length === 1 ? "" : "s"
                  } shown`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="smarthealth-admin-users-loading">
            <div className="smarthealth-admin-users-spinner" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="smarthealth-admin-users-empty">
            <div className="smarthealth-admin-users-empty-icon">U</div>

            <h3>No users found</h3>

            <p>
              {users.length === 0
                ? "There are no registered users yet."
                : "No users match the selected search or filters."}
            </p>

            {(searchTerm || roleFilter || statusFilter) && (
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="smarthealth-admin-users-table-wrapper">
            <table className="smarthealth-admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="smarthealth-admin-users-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const isActive = user.status?.toLowerCase() === "active";
                  const isChangingStatus = changingStatusId === user.userId;

                  return (
                    <tr key={user.userId}>
                      <td>
                        <div className="smarthealth-admin-users-person">
                          <div className="smarthealth-admin-users-avatar">
                            {getInitials(user.fullName)}
                          </div>

                          <div className="smarthealth-admin-users-person-info">
                            <strong>{user.fullName}</strong>
                            <span>ID: {user.userId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="smarthealth-admin-users-contact">
                          <span>{user.email}</span>
                          <small>{user.phone || "No phone number"}</small>
                        </div>
                      </td>

                      <td>
                        <span className={getRoleClass(user.role)}>
                          {user.role || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(user.status)}>
                          <span className="smarthealth-admin-users-status-dot" />
                          {user.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span className="smarthealth-admin-users-created-date">
                          {formatCreatedDate(user.createdAt)}
                        </span>
                      </td>

                      <td>
                        <div className="smarthealth-admin-users-actions">
                          <button
                            type="button"
                            className="smarthealth-admin-users-action-button smarthealth-admin-users-edit-button"
                            onClick={() => handleEditClick(user)}
                            disabled={isChangingStatus || updating}
                            title="Edit user"
                            aria-label={`Edit ${user.fullName}`}
                          >
                            <span aria-hidden="true">✎</span>
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`smarthealth-admin-users-action-button ${
                              isActive
                                ? "smarthealth-admin-users-deactivate-button"
                                : "smarthealth-admin-users-activate-button"
                            }`}
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={isChangingStatus || updating}
                            title={
                              isActive ? "Deactivate user" : "Activate user"
                            }
                            aria-label={`${
                              isActive ? "Deactivate" : "Activate"
                            } ${user.fullName}`}
                          >
                            {isChangingStatus ? (
                              <>
                                <span className="smarthealth-admin-users-action-spinner" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <span aria-hidden="true">
                                  {isActive ? "⊘" : "✓"}
                                </span>
                                {isActive ? "Deactivate" : "Activate"}
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* EDIT USER MODAL */}

      {editingUser && (
        <div
          className="smarthealth-admin-users-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >
          <section
            className="smarthealth-admin-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smarthealth-admin-users-modal-title"
          >
            <div className="smarthealth-admin-users-modal-header">
              <div>
                <span className="smarthealth-admin-users-modal-eyebrow">
                  User Management
                </span>

                <h2 id="smarthealth-admin-users-modal-title">Edit User</h2>

                <p>Update this user's profile information.</p>
              </div>

              <button
                type="button"
                className="smarthealth-admin-users-modal-close"
                onClick={handleCloseEditModal}
                disabled={updating}
                aria-label="Close edit modal"
              >
                ×
              </button>
            </div>

            <form
              className="smarthealth-admin-users-modal-form"
              onSubmit={handleUpdateUser}
            >
              <div className="smarthealth-admin-users-modal-field">
                <label htmlFor="adminEditFullName">Full Name</label>

                <input
                  id="adminEditFullName"
                  name="fullName"
                  type="text"
                  value={editForm.fullName}
                  onChange={handleEditFormChange}
                  placeholder="Enter full name"
                  maxLength={200}
                  required
                  disabled={updating}
                />
              </div>

              <div className="smarthealth-admin-users-modal-field">
                <label htmlFor="adminEditEmail">Email Address</label>

                <input
                  id="adminEditEmail"
                  type="email"
                  value={editingUser.email || ""}
                  disabled
                />

                <small>Email cannot be changed from this screen.</small>
              </div>

              <div className="smarthealth-admin-users-modal-field">
                <label htmlFor="adminEditPhone">Phone Number</label>

                <input
                  id="adminEditPhone"
                  name="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={handleEditFormChange}
                  placeholder="Enter phone number"
                  maxLength={30}
                  disabled={updating}
                />
              </div>

              <div className="smarthealth-admin-users-modal-info">
                <span>Role</span>
                <strong>{editingUser.role || "Unknown"}</strong>
                <span className="smarthealth-admin-users-modal-info-note">
                  Role changes are not available here.
                </span>
              </div>

              <div className="smarthealth-admin-users-modal-actions">
                <button
                  type="button"
                  className="smarthealth-admin-users-modal-cancel"
                  onClick={handleCloseEditModal}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-admin-users-modal-save"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="smarthealth-admin-users-action-spinner" />
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

export default Users;
