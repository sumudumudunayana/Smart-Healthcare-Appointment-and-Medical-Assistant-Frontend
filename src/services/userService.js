import api from "./api";

const userService = {
  // Get all users (Administrator)
  getAll: async () => {
    const response = await api.get("/Users");
    return response.data;
  },

  // Get the currently logged-in user's profile
  getMyProfile: async () => {
    const response = await api.get("/Users/me");
    return response.data;
  },

  // Update the currently logged-in user's profile
  updateMyProfile: async (profileData) => {
    const response = await api.put("/Users/me", profileData);
    return response.data;
  },

  // Update a specific user's information (Administrator)
  update: async (userId, userData) => {
    const response = await api.put(`/Users/${userId}`, userData);
    return response.data;
  },

  // Activate or deactivate a user (Administrator)
  updateStatus: async (userId, status) => {
    const response = await api.put(`/Users/${userId}/status`, {
      status,
    });

    return response.data;
  },
};

export default userService;