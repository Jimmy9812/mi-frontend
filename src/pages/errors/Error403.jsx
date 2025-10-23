import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldX, Home, LogOut } from "lucide-react";

export default function Error403() {
  const navigate = useNavigate();
  const { activeRole, getDefaultRoute, logout, user } = useAuth();

  const handleGoHome = () => {
    const defaultRoute = getDefaultRoute();
    navigate(defaultRoute, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
      {/* Fondo con patrón */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header rojo */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
            <div className="flex items-center justify-center gap-4">
              <ShieldX className="w-16 h-16 text-white" />
              <div className="text-center">
                <h1 className="text-5xl font-bold text-white">403</h1>
                <p className="text-red-100 text-lg">Acceso Denegado</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-8 py-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No tienes permiso para acceder a esta página
            </h2>
            
            <p className="text-gray-600 mb-6">
              Tu rol actual <span className="font-semibold text-red-600">{activeRole || "Sin rol"}</span> no 
              tiene los permisos necesarios para acceder a este módulo.
            </p>

            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Usuario actual:</p>
                <p className="font-semibold text-gray-800">
                  {user.nombre_usuario} {user.apellidos_usuario}
                </p>
                <p className="text-sm text-gray-500">{user.correo_usuario}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Botón ir al inicio */}
              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 
                  text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                <Home className="w-5 h-5" />
                Ir a mi página de inicio
              </button>

              {/* Botón cerrar sesión */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 
                  text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>

            {/* Mensaje de ayuda */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Si crees que deberías tener acceso a esta sección, 
                contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>Sistema de Gestión - Dirección Metropolitana de Catastro</p>
        </div>
      </div>
    </div>
  );
}