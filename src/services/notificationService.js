import api from "./api";

const notificationService = {
  // Retrieve notifications addressed to the logged-in user
  getMyNotifications: async () => {
    const response = await api.get("/Notifications/my");
    return response.data;
  },

  // Retrieve notifications created by the logged-in user
  getCreatedByMe: async () => {
    const response = await api.get("/Notifications/created-by-me");
    return response.data;
  },

  // Retrieve users who can receive notifications
  getNotificationUsers: async () => {
    const response = await api.get("/Notifications/users");
    return response.data;
  },

  // Mark the logged-in user's own notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(
      `/Notifications/${notificationId}/read`
    );

    return response.data;
  },

  // Create a notification for a selected recipient
  create: async (notificationData) => {
    const response = await api.post(
      "/Notifications",
      notificationData
    );

    return response.data;
  },
};

export default notificationService;