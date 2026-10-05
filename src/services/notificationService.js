import api from "./api";

const notificationService = {
  getMyNotifications: async () => {
    const response = await api.get("/Notifications/my");
    return response.data;
  },

  getNotificationUsers: async () => {
    const response = await api.get("/Notifications/users");
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.patch(
      `/Notifications/${notificationId}/read`
    );

    return response.data;
  },

  create: async (notificationData) => {
    const response = await api.post(
      "/Notifications",
      notificationData
    );

    return response.data;
  },
};

export default notificationService;