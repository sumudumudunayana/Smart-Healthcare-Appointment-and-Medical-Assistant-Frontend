import api from "./api";

const authService = {
  register: async (registerData) => {
    const response = await api.post("/Auth/register", registerData);
    return response.data;
  },

  login: async (loginData) => {
    const response = await api.post("/Auth/login", loginData);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post("/Auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  logout: async (refreshToken) => {
    if (!refreshToken) {
      return;
    }

    await api.post("/Auth/logout", {
      refreshToken,
    });
  },
};

export default authService;