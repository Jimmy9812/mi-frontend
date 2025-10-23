import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children }) {
  const { user, activeRole, loading, canAccessRoute, showRoleSelector } = useAuth();
  const location = useLocation();

  // Mientras carga la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  // No autenticado -> redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero necesita seleccionar rol
  // Permitir que pase para que Layout muestre el selector
  if (showRoleSelector) {
    return children;
  }

  // Si no hay rol activo después de haber pasado el selector, redirigir al dashboard
  if (!activeRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar si el usuario tiene acceso a esta ruta
  if (!canAccessRoute(location.pathname)) {
    // Redirigir a página de error 403
    return <Navigate to="/error/403" replace />;
  }

  // Autenticado y autorizado
  return children;
}