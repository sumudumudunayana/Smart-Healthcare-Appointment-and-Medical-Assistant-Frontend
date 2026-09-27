import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RESTORE LOGIN SESSION
  // ============================================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (token && refreshToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (email, password) => {
    const response = await authService.login({
      email,
      password,
    });

    localStorage.setItem("token", response.token);

    localStorage.setItem(
      "refreshToken",
      response.refreshToken
    );

    const userData = {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setUser(userData);

    return response;
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (
    fullName,
    email,
    phone,
    password
  ) => {
    const response = await authService.register({
      fullName,
      email,
      phone,
      password,
    });

    return response;
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken");

    try {
      await authService.logout(refreshToken);
    } catch {
      // Even if the server request fails,
      // continue clearing the local session.
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};