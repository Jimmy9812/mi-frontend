import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx"; 
import {
  BarChart2,
  FileText,
  Users,
  Database,
  AlertTriangle,
  Activity,
  LogOut,
  User,
} from "lucide-react";

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const { user, logout, getAvailableModules, activeRole, showRoleSelector } = useAuth(); 
  const navigate = useNavigate();

  // 🔹 Si no hay rol activo o está mostrando el selector, no renderizar nada aún
  if (!activeRole || showRoleSelector) {
    return null;
  }

  // 🔹 Configuración completa de todos los módulos
  const ALL_MODULES = [
    { 
      key: "SIRECQ",
      label: "SIREC-Q", 
      icon: <FileText className="w-7 h-7" />, 
      offset: -720, 
      to: "/sirecq" 
    },
    { 
      key: "EXTERNOS",
      label: "EXTERNOS", 
      icon: <Users className="w-7 h-7" />, 
      offset: -690, 
      to: "/externos" 
    },
    { 
      key: "TEST_PRODUCCION",
      label: "TEST/PRODUCCIÓN", 
      icon: <Database className="w-7 h-7" />, 
      offset: -660, 
      to: "/test-produccion" 
    },
    { 
      key: "ACCIDENTES",
      label: "ACCIDENTES", 
      icon: <AlertTriangle className="w-7 h-7" />, 
      offset: -630, 
      to: "/accidentes" 
    },
    { 
      key: "INCIDENTES",
      label: "INCIDENTES", 
      icon: <Activity className="w-7 h-7" />, 
      offset: -600, 
      to: "/incidentes" 
    },
  ];

  // 🔹 Obtener módulos permitidos para el rol activo
  const availableModules = getAvailableModules();

  // 🔹 Filtrar solo los módulos permitidos
  const visibleModules = ALL_MODULES.filter(module => 
    availableModules.includes(module.key)
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Fondo con overlay oscuro */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/iglesia.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Header - Dashboard + Perfil */}
      <div className="absolute top-10 right-10 z-30 flex items-center gap-8">
        {/* Botón Dashboard */}
        <button
          onClick={() => navigate("/dashboard-home")}
          className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg text-white font-semibold hover:bg-white/40 shadow-lg transition"
        >
          <span>Dashboard</span>
          <BarChart2 className="w-6 h-6 text-blue-400" />
        </button>

        {/* Perfil con dropdown */}
        <div className="relative flex items-center">
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-col items-center gap-1 text-white focus:outline-none"
          >
            <User className="w-8 h-8" />
            <span className="text-sm font-medium">
              {user ? `${user.nombre_usuario} ${user.apellidos_usuario}` : "Usuario"}
            </span>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Línea blanca */}
      <div className="absolute top-28 left-1/3 right-10 h-[2px] bg-white z-20"></div>

      {/* Panel inclinado */}
      <div
        className="absolute z-20 top-0 left-25 h-full w-[440px]
        bg-white/30 backdrop-blur-md border border-white/20 shadow-lg
        transform skew-x-12 flex items-center justify-center"
      >
        <div className="text-center px-6 transform -skew-x-12">
          <div className="border-t-4 border-blue-100 w-[110%] -ml-10 mb-4"></div>
          <div className="text-blue-100 font-extrabold text-3xl drop-shadow leading-snug flex flex-col items-start">
            <span className="ml-0">DIRECCIÓN</span>
            <span className="ml-20">METROPOLITANA</span>
            <span className="ml-40">DE CATASTRO</span>
          </div>
          <div className="border-t-4 border-blue-100 w-[112%] -ml-2 mt-4"></div>
        </div>
      </div>

      {/* Sello */}
      <img
        src="/sello.png"
        alt="Sello"
        className="absolute z-30 top-3 left-1/3 h-20 w-auto"
      />

      {/* Botones inclinados - FILTRADOS POR ROL */}
      <div
        className="absolute inset-y-0 left-340 z-20 flex flex-col justify-center gap-10 pr-20"
        style={{ transform: "translateY(70px)" }}
      >
        {visibleModules.map((item, idx) => (
          <Link
            key={idx}
            to={item.to}
            className="flex items-center gap-4 text-white font-extrabold tracking-wide hover:scale-[1.05] transition transform -skew-x-6"
            style={{ transform: `translateX(${item.offset}px) skewX(-6deg)` }}
          >
            {/* 🔹 Círculo fijo */}
            <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white text-blue-900 shadow-md text-xl skew-x-6">
              {item.icon}
            </span>
            {/* 🔹 Texto corregido para que no se baje */}
            <span className="text-xl drop-shadow skew-x-6 whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}

        {/* 🔹 Mensaje si no hay módulos disponibles */}
        {visibleModules.length === 0 && (
          <div className="text-white text-center bg-red-500/20 backdrop-blur-sm p-6 rounded-lg border border-red-300 transform -skew-x-6">
            <div className="transform skew-x-6">
              <p className="text-lg font-semibold">⚠️ Sin acceso a módulos</p>
              <p className="text-sm mt-2">Rol: {activeRole}</p>
              <p className="text-xs mt-1 text-gray-200">Contacta al administrador</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}