import api from "./api";

const userService = {
  getAll: async () => {
    const response = await api.get("/Users");
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/Users/${userId}`, userData);
    return response.data;
  },

  updateStatus: async (userId, status) => {
    const response = await api.put(`/Users/${userId}/status`, {
      status,
    });

    return response.data;
  },
};

export default userService;