import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const navigate = useNavigate();

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
        selectRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}