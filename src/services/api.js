import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5244/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post("http://localhost:5244/api/Auth/refresh", {
        refreshToken,
      })
      .then((response) => {
        const data = response.data;

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);

        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/Auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      return Promise.reject(refreshError);
    }
  }
);

export default api;