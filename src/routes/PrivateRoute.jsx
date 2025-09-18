import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children, required = [] }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  // Mientras el AuthContext carga (ej. desde localStorage/JWT)
  if (loading) return <div className="text-white">Cargando...</div>;

  // No autenticado -> redirigir al login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si se pasaron permisos requeridos, verificarlos
  if (required.length > 0 && !hasPermission(...required)) {
    // Autenticado pero sin permisos -> redirigir al dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Autenticado y autorizado
  return children;
}
