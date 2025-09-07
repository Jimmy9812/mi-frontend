import { useAuth } from "../context/AuthContext";
import { Crown, ShieldCheck, Wrench } from "lucide-react"; 

const ROLE_INFO = {
  ADMINISTRACIÓN: {
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    description: "Acceso completo al sistema",
  },
  ANALISTA: {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    description: "Usuario analista del sistema",
  },
  TÉCNICO: {
    icon: <Wrench className="w-6 h-6 text-green-600" />,
    description: "Usuario técnico del sistema",
  },
};

export default function RoleSelector() {
  const { user, selectRole } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Seleccionar Rol
        </h2>
        <p className="text-gray-600 mb-6">
          Bienvenido, {user?.nombre_usuario}. Por favor, selecciona tu rol:
        </p>

        <div className="space-y-3">
          {user?.roles.map((role) => {
            const info = ROLE_INFO[role] || {
              icon: <ShieldCheck className="w-6 h-6 text-gray-500" />,
              description: "Usuario del sistema",
            };
            return (
              <button
                key={role}
                onClick={() => selectRole(role)}
                className="w-full flex items-center gap-3 p-4 text-left rounded-lg transition-colors hover:bg-blue-50 border border-gray-200"
              >
                {/* Ícono con fondo redondo */}
                <div className="p-2 rounded-full bg-gray-100 flex items-center justify-center">
                  {info.icon}
                </div>

                {/* Texto */}
                <div>
                  <div className="font-semibold">{role}</div>
                  <div className="text-sm text-gray-500">{info.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
