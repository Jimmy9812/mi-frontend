import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

// Función para determinar la ruta inicial según los roles
const getInitialRoute = (roles = []) => {
  if (roles.includes("ADMIN")) return "/dashboard";
  if (roles.includes("OPERADOR")) return "/incidentes";
  return "/dashboard"; // ruta por defecto
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Recuperar datos de autenticación al cargar
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.usuario) {
          setToken(parsed.token);
          setUser(parsed.usuario);
        }
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  // Login
  const login = ({ token, usuario }) => {
    setToken(token);
    setUser(usuario);
    
    // Guardar en localStorage
    localStorage.setItem("auth", JSON.stringify({ token, usuario }));
    
    // Redireccionar según roles
    const initialRoute = getInitialRoute(usuario.roles);
    navigate(initialRoute);
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
    navigate("/");
  };

  // Verificar autenticación
  const isAuthenticated = !!token;

  // Verificar si tiene un rol específico
  const hasRole = (roleToCheck) => {
    if (!user?.roles) return false;
    return user.roles.includes(roleToCheck);
  };

  // Verificar si tiene al menos uno de los roles requeridos
  const hasAnyRole = (requiredRoles = []) => {
    if (!user?.roles) return false;
    if (user.roles.includes("ADMIN")) return true; // ADMIN tiene acceso a todo
    return requiredRoles.some(role => user.roles.includes(role));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      hasRole,
      hasAnyRole,
      // Exponer datos específicos del usuario para fácil acceso
      nombreCompleto: user ? `${user.nombre_usuario} ${user.apellidos_usuario}` : '',
      roles: user?.roles || [],
    }),
    [token, user, loading]
  );

  // No mostrar nada mientras se verifica la autenticación inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
