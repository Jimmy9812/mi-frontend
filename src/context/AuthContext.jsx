import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Definición de módulos y rutas por rol
  const ROLE_ACCESS = {
    "Técnico Incidentes": {
      modules: ["INCIDENTES"],
      routes: ["/incidentes", "/incidentes/nuevo", "/incidentes/:id", "/dashboard", "/dashboard-home"],
      defaultRoute: "/dashboard"
    },
    "Técnico Accidentes": {
      modules: ["ACCIDENTES"],
      routes: ["/accidentes", "/accidentes/nuevo", "/accidentes/:id", "/dashboard", "/dashboard-home"],
      defaultRoute: "/dashboard"
    },
    "Supervisor Accidente": {
      modules: ["ACCIDENTES"],
      routes: ["/accidentes", "/accidentes/nuevo", "/accidentes/:id", "/dashboard", "/dashboard-home"],
      defaultRoute: "/dashboard"
    },
    "Supervisor Informatico": {
      modules: ["TEST_PRODUCCION", "EXTERNOS", "SIRECQ"],
      routes: [
        "/test-produccion", "/test-produccion/nuevo", "/test-produccion/:id",
        "/externos", "/externos/nuevo", "/externos/:id",
        "/sirecq", "/sirecq/nuevo", "/sirecq/:id",
        "/dashboard", "/dashboard-home"
      ],
      defaultRoute: "/dashboard"
    },
    "Administrador": {
      modules: ["INCIDENTES", "ACCIDENTES", "TEST_PRODUCCION", "EXTERNOS", "SIRECQ"],
      routes: [
        "/incidentes", "/incidentes/nuevo", "/incidentes/:id",
        "/accidentes", "/accidentes/nuevo", "/accidentes/:id",
        "/test-produccion", "/test-produccion/nuevo", "/test-produccion/:id",
        "/externos", "/externos/nuevo", "/externos/:id",
        "/sirecq", "/sirecq/nuevo", "/sirecq/:id",
        "/dashboard-home",
        "/gestion-usuarios",
        "/dashboard"
      ],
      defaultRoute: "/dashboard"
    }
  };

  // 🔹 Restaurar sesión desde localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("activeRole");

    if (storedToken && storedUser) {
      setToken(storedToken);
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (storedRole && userData.roles.includes(storedRole)) {
        setActiveRole(storedRole);
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Login
  const login = async (data) => {
    const { usuario, token } = data;
    setUser(usuario);
    setToken(token);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));

    // Si tiene múltiples roles, mostrar selector
    if (usuario.roles.length > 1) {
      setShowRoleSelector(true);
      navigate("/dashboard", { replace: true });
    } else {
      // Si solo tiene un rol, seleccionarlo automáticamente
      const singleRole = usuario.roles[0];
      setActiveRole(singleRole);
      localStorage.setItem("activeRole", singleRole);
      
      const defaultRoute = ROLE_ACCESS[singleRole]?.defaultRoute || "/dashboard";
      navigate(defaultRoute, { replace: true });
    }
  };

  // 🔹 Seleccionar rol (cuando tiene múltiples)
  const selectRole = (role) => {
    setActiveRole(role);
    localStorage.setItem("activeRole", role);
    setShowRoleSelector(false);
    
    const defaultRoute = ROLE_ACCESS[role]?.defaultRoute || "/dashboard";
    navigate(defaultRoute, { replace: true });
  };

  // 🔹 Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole(null);
    setShowRoleSelector(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");

    navigate("/login", { replace: true });
  };

  // 🔹 Verificar si el usuario tiene acceso a un módulo
  const hasModule = (module) => {
    if (!activeRole) return false;
    const roleAccess = ROLE_ACCESS[activeRole];
    return roleAccess?.modules.includes(module) || false;
  };

  // 🔹 Verificar si el usuario puede acceder a una ruta
  const canAccessRoute = (path) => {
    if (!activeRole) return false;
    const roleAccess = ROLE_ACCESS[activeRole];
    if (!roleAccess) return false;

    // Siempre permitir acceso a /dashboard
    if (path === "/dashboard" || path === "/error/403") return true;

    // Verificar rutas exactas y con parámetros dinámicos
    return roleAccess.routes.some(allowedRoute => {
      // Convertir ruta con parámetros a regex
      const pattern = allowedRoute.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
  };

  // 🔹 Obtener módulos disponibles para el menú
  const getAvailableModules = () => {
    if (!activeRole) return [];
    return ROLE_ACCESS[activeRole]?.modules || [];
  };

  // 🔹 Obtener ruta por defecto del rol activo
  const getDefaultRoute = () => {
    if (!activeRole) return "/dashboard";
    return ROLE_ACCESS[activeRole]?.defaultRoute || "/dashboard";
  };

  // 🔹 Función legacy hasPermission (por compatibilidad con componentes antiguos)
  // Retorna true para mantener compatibilidad, ya que ahora usamos hasModule y canAccessRoute
  const hasPermission = (...perms) => {
    // Si no hay rol activo, denegar acceso
    if (!activeRole) return false;
    // Por ahora, permitir todo si el usuario tiene un rol activo
    // Los permisos reales se manejan por hasModule y canAccessRoute
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        showRoleSelector,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        selectRole,
        hasModule,
        canAccessRoute,
        getAvailableModules,
        getDefaultRoute,
        hasPermission, // Para compatibilidad con componentes antiguos
        ROLE_ACCESS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}