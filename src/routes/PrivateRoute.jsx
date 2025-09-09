import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children, required = [] }) {
  const { isAuthenticated, loading, hasPermission, can } = useAuth();

  // Mientras el AuthContext carga desde localStorage/JWT
  if (loading) return <div className="text-white">Cargando...</div>;

  // No autenticado -> ir al login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si se pasaron permisos requeridos, verificarlos
  const checker = hasPermission || can; // compatibilidad
  if (required.length > 0 && !checker(...required)) {
    // autenticado pero sin permisos -> llevar a un lugar seguro (dashboard)
    return <Navigate to="/dashboard" replace />;
  }

  // Autorizado
  return children;
}
