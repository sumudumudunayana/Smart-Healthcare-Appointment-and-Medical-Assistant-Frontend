import api from "./api";

const userService = {
  getMyProfile: async () => {
    const response = await api.get("/Users/me");
    return response.data;
  },

  updateMyProfile: async (profileData) => {
    const response = await api.put("/Users/me", profileData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/Users");
    return response.data;
  },
};

export default userService;
