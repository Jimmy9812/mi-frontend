import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const navigate = useNavigate();

  // 🔹 Permisos por rol
  const ROLE_PERMISSIONS = {
    Administrador: [
      "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
      "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT",
      "TESTPRODUCCION_VIEW", "TESTPRODUCCION_WRITE", "TESTPRODUCCION_EXPORT"
    ],
    "ADMINISTRACIÓN": [
      "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
      "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT",
      "TESTPRODUCCION_VIEW", "TESTPRODUCCION_WRITE", "TESTPRODUCCION_EXPORT"
    ],
    OPERADOR: [
      "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
      "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT",
      "TESTPRODUCCION_VIEW", "TESTPRODUCCION_WRITE", "TESTPRODUCCION_EXPORT"
    ],
    ANALISTA: [
      "INCIDENTES_VIEW", "INCIDENTES_EXPORT",
      "ACCIDENTES_VIEW", "ACCIDENTES_EXPORT",
      "TESTPRODUCCION_VIEW", "TESTPRODUCCION_EXPORT"
    ],
    TÉCNICO: [
      "INCIDENTES_VIEW", "INCIDENTES_WRITE",
      "ACCIDENTES_VIEW", "ACCIDENTES_WRITE",
      "TESTPRODUCCION_VIEW", "TESTPRODUCCION_WRITE"
    ],
    USUARIO: [
      "INCIDENTES_VIEW",
      "ACCIDENTES_VIEW",
      "TESTPRODUCCION_VIEW"
    ],
  };

  const login = async (data) => {
    const { usuario, token } = data;
    setUser(usuario);
    setToken(token);

    if (usuario.roles.length > 1) {
      setShowRoleSelector(true);
    } else {
      setActiveRole(usuario.roles[0]);
    }

    navigate("/dashboard", { replace: true });
  };

  const selectRole = (role) => {
    setActiveRole(role);
    setShowRoleSelector(false);
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole(null);
    setShowRoleSelector(false);
    navigate("/login", { replace: true });
  };

  // 🔹 Calcula permisos del rol activo
  const permissions = activeRole ? (ROLE_PERMISSIONS[activeRole] || []) : [];
  const hasPermission = (...perms) => perms.every((p) => permissions.includes(p));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        showRoleSelector,
        isAuthenticated: !!user,
        login,
        logout,
        selectRole,
        permissions,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
