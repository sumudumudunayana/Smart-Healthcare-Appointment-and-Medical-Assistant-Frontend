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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await userService.getAll();

      setUsers(data || []);
    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load users.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        user.email
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        user.phone
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesRole =
        !roleFilter ||
        user.role === roleFilter;

      const matchesStatus =
        !statusFilter ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    statusFilter,
  ]);

  const roleOptions = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.role)
          .filter(Boolean)
      ),
    ].sort();
  }, [users]);

  const statusOptions = useMemo(() => {
    return [
      ...new Set(
        users
          .map((user) => user.status)
          .filter(Boolean)
      ),
    ].sort();
  }, [users]);

  const getInitials = (name) => {
    if (!name) {
      return "U";
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
    if (
      status?.toLowerCase() === "active"
    ) {
      return "smarthealth-admin-users-status smarthealth-admin-users-status-active";
    }

    return "smarthealth-admin-users-status smarthealth-admin-users-status-inactive";
  };

  const formatCreatedDate = (createdAt) => {
    if (!createdAt) {
      return "—";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) =>
      user.status?.toLowerCase() ===
      "active"
  ).length;

  const doctorUsers = users.filter(
    (user) =>
      user.role?.toLowerCase() ===
      "doctor"
  ).length;

  const patientUsers = users.filter(
    (user) =>
      user.role?.toLowerCase() ===
      "patient"
  ).length;

  return (
    <div className="smarthealth-admin-users">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="smarthealth-admin-users-header">

        <div className="smarthealth-admin-users-header-content">

          <span className="smarthealth-admin-users-eyebrow">
            User Management
          </span>

          <h1>Users</h1>

          <p>
            View registered users, their roles,
            account status, and registration details.
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

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

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

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section className="smarthealth-admin-users-filter-card">

        <div className="smarthealth-admin-users-filter-heading">

          <div>
            <h2>Find Users</h2>

            <p>
              Search and filter registered accounts.
            </p>
          </div>

          {(searchTerm ||
            roleFilter ||
            statusFilter) && (
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

          {/* Search */}

          <div className="smarthealth-admin-users-search-box">

            <span className="smarthealth-admin-users-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search by name, email, or phone..."
            />

            {searchTerm && (
              <button
                type="button"
                className="smarthealth-admin-users-search-clear"
                onClick={() =>
                  setSearchTerm("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

          {/* Role */}

          <select
            className="smarthealth-admin-users-filter-select"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Roles
            </option>

            {roleOptions.map((role) => (
              <option
                key={role}
                value={role}
              >
                {role}
              </option>
            ))}
          </select>

          {/* Status */}

          <select
            className="smarthealth-admin-users-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Statuses
            </option>

            {statusOptions.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>

        </div>

      </section>

      {/* =====================================================
          USER LIST
      ====================================================== */}

      <section className="smarthealth-admin-users-list-card">

        <div className="smarthealth-admin-users-list-header">

          <div>
            <h2>All Users</h2>

            <p>
              {loading
                ? "Loading user records..."
                : `${filteredUsers.length} of ${users.length} user${
                    users.length === 1
                      ? ""
                      : "s"
                  } shown`}
            </p>
          </div>

        </div>

        {loading ? (

          /* =================================================
             LOADING
          ================================================== */

          <div className="smarthealth-admin-users-loading">

            <div className="smarthealth-admin-users-spinner"></div>

            <p>
              Loading users...
            </p>

          </div>

        ) : filteredUsers.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================== */

          <div className="smarthealth-admin-users-empty">

            <div className="smarthealth-admin-users-empty-icon">
              U
            </div>

            <h3>
              No users found
            </h3>

            <p>
              {users.length === 0
                ? "There are no registered users yet."
                : "No users match the selected search or filters."}
            </p>

            {(searchTerm ||
              roleFilter ||
              statusFilter) && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================== */

          <div className="smarthealth-admin-users-table-wrapper">

            <table className="smarthealth-admin-users-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>

                {filteredUsers.map(
                  (user) => (
                    <tr key={user.userId}>

                      {/* User */}

                      <td>
                        <div className="smarthealth-admin-users-person">

                          <div className="smarthealth-admin-users-avatar">
                            {getInitials(
                              user.fullName
                            )}
                          </div>

                          <div className="smarthealth-admin-users-person-info">

                            <strong>
                              {user.fullName}
                            </strong>

                            <span>
                              ID:{" "}
                              {user.userId}
                            </span>

                          </div>

                        </div>
                      </td>

                      {/* Contact */}

                      <td>
                        <div className="smarthealth-admin-users-contact">

                          <span>
                            {user.email}
                          </span>

                          <small>
                            {user.phone ||
                              "No phone number"}
                          </small>

                        </div>
                      </td>

                      {/* Role */}

                      <td>
                        <span
                          className={getRoleClass(
                            user.role
                          )}
                        >
                          {user.role ||
                            "Unknown"}
                        </span>
                      </td>

                      {/* Status */}

                      <td>
                        <span
                          className={getStatusClass(
                            user.status
                          )}
                        >
                          <span className="smarthealth-admin-users-status-dot"></span>

                          {user.status ||
                            "Unknown"}
                        </span>
                      </td>

                      {/* Created */}

                      <td>
                        <span className="smarthealth-admin-users-created-date">
                          {formatCreatedDate(
                            user.createdAt
                          )}
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

export default Users;