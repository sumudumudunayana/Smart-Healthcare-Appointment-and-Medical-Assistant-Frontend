import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import notificationService from "../../services/notificationService";
import "../../styles/pages/receptionist/ReceptionistNotifications.css";

const ReceptionistNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [notificationType, setNotificationType] =
    useState("Appointment");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const loadNotifications = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data =
          await notificationService.getMyNotifications();

        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            "Failed to load notifications."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);

      const data =
        await notificationService.getNotificationUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to load notification users:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (showCreateForm && users.length === 0) {
      loadUsers();
    }
  }, [showCreateForm, users.length, loadUsers]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status?.toLowerCase() === "unread"
      ).length,
    [notifications]
  );

  const readCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status?.toLowerCase() === "read"
      ).length,
    [notifications]
  );

  const todayCount = useMemo(() => {
    const today = new Date();

    return notifications.filter((notification) => {
      const date = new Date(notification.createdAt);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [notifications]);

  const notificationTypes = useMemo(() => {
    const types = notifications
      .map((notification) => notification.notificationType)
      .filter(Boolean);

    return [...new Set(types)];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !search ||
        notification.message
          ?.toLowerCase()
          .includes(search) ||
        notification.notificationType
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        notification.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "All" ||
        notification.notificationType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    notifications,
    searchTerm,
    statusFilter,
    typeFilter,
  ]);

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);

    if (users.length === 0) {
      loadUsers();
    }
  };

  const handleCloseCreateForm = () => {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setSelectedUserId("");
    setNotificationType("Appointment");
    setMessage("");
  };

  const handleCreateNotification = async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a recipient.");
      return;
    }

    if (!notificationType.trim()) {
      toast.error("Please select a notification type.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a notification message.");
      return;
    }

    try {
      setCreating(true);

      await notificationService.create({
        userId: selectedUserId,
        message: message.trim(),
        notificationType: notificationType.trim(),
      });

      toast.success("Notification created successfully.");

      handleCloseCreateForm();

      await loadNotifications(true);
    } catch (error) {
      console.error(
        "Failed to create notification:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to create notification."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);

      const updatedNotification =
        await notificationService.markAsRead(
          notificationId
        );

      setNotifications((current) =>
        current.map((notification) =>
          notification.notificationId === notificationId
            ? updatedNotification
            : notification
        )
      );

      toast.success("Notification marked as read.");
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to mark notification as read."
      );
    } finally {
      setMarkingId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Unknown date";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const difference =
      new Date().getTime() - date.getTime();

    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(difference / 3600000);
    const days = Math.floor(difference / 86400000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} minute${
        minutes === 1 ? "" : "s"
      } ago`;
    }

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    if (days < 7) {
      return `${days} day${
        days === 1 ? "" : "s"
      } ago`;
    }

    return formatDate(dateValue);
  };

  const getNotificationIcon = (type) => {
    const normalized = type?.toLowerCase() || "";

    if (
      normalized.includes("appointment") ||
      normalized.includes("schedule")
    ) {
      return "📅";
    }

    if (
      normalized.includes("payment") ||
      normalized.includes("bill")
    ) {
      return "💳";
    }

    if (
      normalized.includes("insurance") ||
      normalized.includes("claim")
    ) {
      return "🛡️";
    }

    if (
      normalized.includes("medical") ||
      normalized.includes("record")
    ) {
      return "🩺";
    }

    if (
      normalized.includes("system") ||
      normalized.includes("admin")
    ) {
      return "⚙️";
    }

    return "🔔";
  };

  const getTypeClass = (type) => {
    const normalized = type?.toLowerCase() || "";

    if (normalized.includes("appointment")) {
      return "smarthealth-receptionist-notification-type-appointment";
    }

    if (
      normalized.includes("payment") ||
      normalized.includes("bill")
    ) {
      return "smarthealth-receptionist-notification-type-payment";
    }

    if (
      normalized.includes("insurance") ||
      normalized.includes("claim")
    ) {
      return "smarthealth-receptionist-notification-type-insurance";
    }

    if (
      normalized.includes("medical") ||
      normalized.includes("record")
    ) {
      return "smarthealth-receptionist-notification-type-medical";
    }

    return "smarthealth-receptionist-notification-type-default";
  };

  return (
    <div className="smarthealth-receptionist-notification-page">
      {/* HEADER */}
      <div className="smarthealth-receptionist-notification-header">
        <div>
          <h1 className="smarthealth-receptionist-notification-title">
            Notifications
          </h1>

          <p className="smarthealth-receptionist-notification-subtitle">
            Review and manage healthcare system notifications.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-notification-refresh-button"
          onClick={() => loadNotifications(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SUMMARY */}
      <div className="smarthealth-receptionist-notification-summary-grid">
        <div className="smarthealth-receptionist-notification-summary-card">
          <div className="smarthealth-receptionist-notification-summary-icon">
            🔔
          </div>

          <div>
            <span className="smarthealth-receptionist-notification-summary-label">
              Total Notifications
            </span>

            <strong className="smarthealth-receptionist-notification-summary-value">
              {notifications.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-notification-summary-card">
          <div className="smarthealth-receptionist-notification-summary-icon smarthealth-receptionist-notification-summary-icon-unread">
            ●
          </div>

          <div>
            <span className="smarthealth-receptionist-notification-summary-label">
              Unread
            </span>

            <strong className="smarthealth-receptionist-notification-summary-value">
              {unreadCount}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-notification-summary-card">
          <div className="smarthealth-receptionist-notification-summary-icon">
            ✓
          </div>

          <div>
            <span className="smarthealth-receptionist-notification-summary-label">
              Read
            </span>

            <strong className="smarthealth-receptionist-notification-summary-value">
              {readCount}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-notification-summary-card">
          <div className="smarthealth-receptionist-notification-summary-icon">
            📆
          </div>

          <div>
            <span className="smarthealth-receptionist-notification-summary-label">
              Today
            </span>

            <strong className="smarthealth-receptionist-notification-summary-value">
              {todayCount}
            </strong>
          </div>
        </div>
      </div>

      {/* MAIN SECTION */}
      <section className="smarthealth-receptionist-notification-section">
        <div className="smarthealth-receptionist-notification-section-header">
          <div>
            <h2 className="smarthealth-receptionist-notification-section-title">
              Notification Center
            </h2>

            <p className="smarthealth-receptionist-notification-section-description">
              Search, filter, and manage notifications.
            </p>
          </div>

          <div className="smarthealth-receptionist-notification-section-actions">
            <span className="smarthealth-receptionist-notification-count">
              {filteredNotifications.length}
            </span>

            <button
              type="button"
              className="smarthealth-receptionist-notification-create-button"
              onClick={handleOpenCreateForm}
            >
              + Create Notification
            </button>
          </div>
        </div>

        {/* CREATE FORM */}
        {showCreateForm && (
          <div className="smarthealth-receptionist-notification-create-panel">
            <div className="smarthealth-receptionist-notification-create-header">
              <div>
                <h3 className="smarthealth-receptionist-notification-create-title">
                  Create Notification
                </h3>

                <p className="smarthealth-receptionist-notification-create-description">
                  Send a notification to a registered system user.
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-receptionist-notification-close-button"
                onClick={handleCloseCreateForm}
                disabled={creating}
              >
                ×
              </button>
            </div>

            <form
              className="smarthealth-receptionist-notification-create-form"
              onSubmit={handleCreateNotification}
            >
              <div className="smarthealth-receptionist-notification-form-group">
                <label htmlFor="notification-recipient">
                  Recipient
                </label>

                <select
                  id="notification-recipient"
                  value={selectedUserId}
                  onChange={(event) =>
                    setSelectedUserId(event.target.value)
                  }
                  disabled={loadingUsers || creating}
                >
                  <option value="">
                    {loadingUsers
                      ? "Loading users..."
                      : "Select a recipient"}
                  </option>

                  {users
                    .filter(
                      (user) =>
                        user.status?.toLowerCase() ===
                        "active"
                    )
                    .map((user) => (
                      <option
                        key={user.userId}
                        value={user.userId}
                      >
                        {user.fullName} — {user.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="smarthealth-receptionist-notification-form-group">
                <label htmlFor="notification-type">
                  Notification Type
                </label>

                <select
                  id="notification-type"
                  value={notificationType}
                  onChange={(event) =>
                    setNotificationType(event.target.value)
                  }
                  disabled={creating}
                >
                  <option value="Appointment">
                    Appointment
                  </option>

                  <option value="Payment">
                    Payment
                  </option>

                  <option value="Insurance">
                    Insurance
                  </option>

                  <option value="Medical">
                    Medical
                  </option>

                  <option value="System">
                    System
                  </option>

                  <option value="General">
                    General
                  </option>
                </select>
              </div>

              <div className="smarthealth-receptionist-notification-form-group smarthealth-receptionist-notification-form-group-wide">
                <label htmlFor="notification-message">
                  Message
                </label>

                <textarea
                  id="notification-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="Enter notification message..."
                  disabled={creating}
                  rows={4}
                />
              </div>

              <div className="smarthealth-receptionist-notification-form-actions">
                <button
                  type="button"
                  className="smarthealth-receptionist-notification-cancel-button"
                  onClick={handleCloseCreateForm}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-receptionist-notification-submit-button"
                  disabled={creating || loadingUsers}
                >
                  {creating
                    ? "Creating..."
                    : "Create Notification"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTERS */}
        <div className="smarthealth-receptionist-notification-filter-bar">
          <input
            type="text"
            className="smarthealth-receptionist-notification-search"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          <select
            className="smarthealth-receptionist-notification-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Status</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>

          <select
            className="smarthealth-receptionist-notification-filter-select"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="All">All Types</option>

            {notificationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* NOTIFICATIONS */}
        {loading ? (
          <div className="smarthealth-receptionist-notification-loading">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="smarthealth-receptionist-notification-empty">
            <div className="smarthealth-receptionist-notification-empty-icon">
              🔔
            </div>

            <h3 className="smarthealth-receptionist-notification-empty-title">
              No notifications found
            </h3>

            <p className="smarthealth-receptionist-notification-empty-text">
              {notifications.length === 0
                ? "You don't have any notifications yet."
                : "No notifications match your current search or filters."}
            </p>
          </div>
        ) : (
          <div className="smarthealth-receptionist-notification-list">
            {filteredNotifications.map((notification) => {
              const isUnread =
                notification.status?.toLowerCase() ===
                "unread";

              return (
                <article
                  key={notification.notificationId}
                  className={`smarthealth-receptionist-notification-item ${
                    isUnread
                      ? "smarthealth-receptionist-notification-item-unread"
                      : "smarthealth-receptionist-notification-item-read"
                  }`}
                >
                  <div
                    className={`smarthealth-receptionist-notification-item-icon ${getTypeClass(
                      notification.notificationType
                    )}`}
                  >
                    {getNotificationIcon(
                      notification.notificationType
                    )}
                  </div>

                  <div className="smarthealth-receptionist-notification-item-content">
                    <div className="smarthealth-receptionist-notification-item-top">
                      <div className="smarthealth-receptionist-notification-item-heading">
                        <span className="smarthealth-receptionist-notification-type">
                          {notification.notificationType ||
                            "Notification"}
                        </span>

                        {isUnread && (
                          <span className="smarthealth-receptionist-notification-unread-badge">
                            Unread
                          </span>
                        )}
                      </div>

                      <span className="smarthealth-receptionist-notification-relative-time">
                        {formatRelativeTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>

                    <p className="smarthealth-receptionist-notification-message">
                      {notification.message}
                    </p>

                    <div className="smarthealth-receptionist-notification-item-bottom">
                      <span className="smarthealth-receptionist-notification-date">
                        {formatDate(notification.createdAt)}
                      </span>

                      {isUnread && (
                        <button
                          type="button"
                          className="smarthealth-receptionist-notification-read-button"
                          onClick={() =>
                            handleMarkAsRead(
                              notification.notificationId
                            )
                          }
                          disabled={
                            markingId ===
                            notification.notificationId
                          }
                        >
                          {markingId ===
                          notification.notificationId
                            ? "Updating..."
                            : "Mark as Read"}
                        </button>
                      )}

                      {!isUnread && notification.readAt && (
                        <span className="smarthealth-receptionist-notification-read-time">
                          Read{" "}
                          {formatRelativeTime(
                            notification.readAt
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReceptionistNotifications;