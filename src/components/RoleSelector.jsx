import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_INFO = {
  ADMIN: {
    icon: '👑',
    description: 'Acceso completo al sistema',
    route: '/dashboard'
  },
  OPERADOR: {
    icon: '👨‍💼',
    description: 'Gestión de incidentes y reportes',
    route: '/incidentes'
  },
  USUARIO: {
    icon: '👤',
    description: 'Acceso básico al sistema',
    route: '/dashboard'
  }
};

const RoleSelector = () => {
  const { user, selectRole } = useAuth();
  const [localSelectedRole, setLocalSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setLocalSelectedRole(role);
    selectRole(role);
  };

  if (!user?.roles?.length) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Seleccionar Rol
        </h2>
        <p className="text-gray-600 mb-6">
          Bienvenido, {user.nombre_usuario}. Por favor, selecciona el rol con el que deseas ingresar al sistema:
        </p>
        
        <div className="space-y-3">
          {user.roles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              className={`w-full p-4 text-left rounded-lg transition-colors
                ${localSelectedRole === role 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full
                  ${localSelectedRole === role ? 'bg-blue-400' : 'bg-gray-200'}
                `}>
                  {ROLE_INFO[role]?.icon || '👤'}
                </div>
                <div>
                  <div className="font-semibold">{role}</div>
                  <div className="text-sm opacity-80">
                    {ROLE_INFO[role]?.description || 'Usuario del sistema'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;