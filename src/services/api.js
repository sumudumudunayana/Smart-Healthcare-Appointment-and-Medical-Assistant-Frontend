import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

/**
 * Refresh the access token.
 * A shared promise prevents multiple simultaneous refresh requests.
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured.");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/Auth/refresh`, {
        refreshToken,
      })
      .then((response) => {
        const data = response.data;

        if (!data?.token || !data?.refreshToken) {
          throw new Error("Invalid token refresh response.");
        }

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

/**
 * REQUEST INTERCEPTOR
 *
 * Attach the current access token to API requests.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR
 *
 * Refresh the access token when an authenticated request
 * returns 401, then retry the original request once.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    const isAuthRequest =
      requestUrl.includes("/Auth/login") ||
      requestUrl.includes("/Auth/register") ||
      requestUrl.includes("/Auth/refresh");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      // Remove expired credentials.
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Let the calling authentication layer handle the logout.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:session-expired"));
      }

      return Promise.reject(refreshError);
    }
  },
);

export default api;