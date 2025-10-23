import { useAuth } from "../context/AuthContext";
import { 
  Crown, 
  ShieldAlert, 
  Wrench, 
  UserCheck, 
  MonitorCheck 
} from "lucide-react";

const ROLE_INFO = {
  "Administrador": {
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    description: "Acceso completo a todos los módulos",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
  },
  "Tecnico Incidente": {
    icon: <Wrench className="w-6 h-6 text-blue-600" />,
    description: "Módulo de Incidentes",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
  },
  "Tecnico Accidente": {
    icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
    description: "Módulo de Accidentes",
    color: "bg-red-50 border-red-200 hover:bg-red-100"
  },
  "Supervisor Accidente": {
    icon: <UserCheck className="w-6 h-6 text-orange-600" />,
    description: "Supervisión de Accidentes",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100"
  },
  "Supervisor Informatico": {
    icon: <MonitorCheck className="w-6 h-6 text-green-600" />,
    description: "Test/Producción, Externos y SirecQ",
    color: "bg-green-50 border-green-200 hover:bg-green-100"
  },
  "Analista Informatico": {
    icon: <MonitorCheck className="w-6 h-6 text-green-600" />,
    description: "Test/Producción, Externos y SirecQ",
    color: "bg-green-50 border-green-200 hover:bg-green-100"
  }
};

export default function RoleSelector() {
  const { user, selectRole } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Seleccionar Rol
        </h2>
        <p className="text-gray-600 mb-6">
          Bienvenido, <span className="font-semibold">{user?.nombre_usuario}</span>. 
          Selecciona el rol con el que deseas trabajar:
        </p>

        <div className="space-y-3">
          {user?.roles.map((role) => {
            const info = ROLE_INFO[role] || {
              icon: <UserCheck className="w-6 h-6 text-gray-500" />,
              description: "Usuario del sistema",
              color: "bg-gray-50 border-gray-200 hover:bg-gray-100"
            };
            
            return (
              <button
                key={role}
                onClick={() => selectRole(role)}
                className={`w-full flex items-center gap-3 p-4 text-left rounded-lg transition-all 
                  hover:shadow-md hover:scale-[1.02] border-2 ${info.color}`}
              >
                {/* Ícono con fondo redondo */}
                <div className="p-2 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {info.icon}
                </div>

                {/* Texto */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{role}</div>
                  <div className="text-sm text-gray-600">{info.description}</div>
                </div>

                {/* Flecha indicadora */}
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}