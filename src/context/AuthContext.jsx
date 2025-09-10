import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const navigate = useNavigate();

  // 👇👇👇 NUEVO: matriz simple de permisos por rol (ajusta nombres si tu backend usa otros)
  const ROLE_PERMISSIONS = {
  ADMIN: [
    "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
    "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT"
  ],
  "ADMINISTRACIÓN": [
    "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
    "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT"
  ],
  OPERADOR: [
    "INCIDENTES_VIEW", "INCIDENTES_WRITE", "INCIDENTES_EXPORT",
    "ACCIDENTES_VIEW", "ACCIDENTES_WRITE", "ACCIDENTES_EXPORT"
  ],
  ANALISTA: [
    "INCIDENTES_VIEW", "INCIDENTES_EXPORT",
    "ACCIDENTES_VIEW", "ACCIDENTES_EXPORT"
  ],
  TÉCNICO: [
    "INCIDENTES_VIEW", "INCIDENTES_WRITE",
    "ACCIDENTES_VIEW", "ACCIDENTES_WRITE"
  ],
  USUARIO: [
    "INCIDENTES_VIEW",
    "ACCIDENTES_VIEW"
  ],
};

  // 👆👆👆 NUEVO

  const login = async (data) => {
    const { usuario, token } = data;
    setUser(usuario);
    setToken(token);

    // Si tiene múltiples roles, mostrar selector
    if (usuario.roles.length > 1) {
      setShowRoleSelector(true);
    } else {
      // Si solo tiene un rol, establecerlo directamente
      setActiveRole(usuario.roles[0]);
    }

    // Siempre redirigir al dashboard después del login
    navigate("/dashboard", { replace: true });
  };

  const selectRole = (role) => {
    setActiveRole(role);
    setShowRoleSelector(false);
    // Aquí puedes agregar lógica adicional según el rol seleccionado
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole(null);
    setShowRoleSelector(false);
    navigate("/login", { replace: true });
  };

  // 👇👇👇 NUEVO: calcula permisos del rol activo y expone hasPermission
  const permissions = activeRole ? (ROLE_PERMISSIONS[activeRole] || []) : [];
  const hasPermission = (...perms) => perms.every(p => permissions.includes(p));
  // 👆👆👆 NUEVO

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
        // 👇👇👇 NUEVO: expongo permisos y hasPermission
        permissions,
        hasPermission,
        // 👆👆👆 NUEVO
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
