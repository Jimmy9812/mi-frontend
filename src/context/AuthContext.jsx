// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // 👈 aquí lo agregamos

  // Hidratar desde localStorage al cargar la app
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  // Login
  const login = async ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("auth", JSON.stringify({ token, user }));

    navigate("/dashboard"); // 👈 redirige automáticamente
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");

    navigate("/"); // 👈 vuelve al login
  };

  const isAuthenticated = !!token;

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return Array.isArray(user.permissions) && user.permissions.includes(perm);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      hasPermission,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
