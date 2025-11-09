import { useState } from "react";

/**
 * TablaExternos (versión Dashboard)
 * - Encabezado naranja (#f97316)
 * - Filtro independiente de los otros módulos
 * - Mismo estilo que Accidentes/Incidentes
 */
export default function TablaExternos({ items = [], loading, onFiltroChange }) {
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  // 🔸 Manejador del filtro
  const handleChange = (e) => {
    const value = e.target.value;
    setEstadoFiltro(value);
    if (onFiltroChange) onFiltroChange(value); // comunica el valor al Dashboard
  };

  // 🔸 Filtrado local
  const filtered =
    estadoFiltro === "Todos"
      ? items
      : items.filter((a) => {
          const estado =
            a.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
            a.requerimiento?.estadoRequerimiento?.nombre_estado ||
            a.estado ||
            "SIN ESTADO";
          return (
            estado?.toUpperCase().trim() === estadoFiltro.toUpperCase().trim()
          );
        });

  // 🔸 Formateo de fecha
  const formatDate = (fecha) => {
    if (!fecha) return "N/A";
    try {
      return new Date(fecha).toLocaleDateString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // 🔸 Colores por estado (igual que Incidentes/Accidentes)
  const estadoClass = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN REVISIÓN":
        return "bg-purple-100 text-purple-800";
      case "ENVIADO":
        return "bg-yellow-100 text-yellow-800";
      case "PENDIENTE":
        return "bg-blue-100 text-blue-800";
      case "DEVUELTO":
        return "bg-red-100 text-red-800";
      case "FAVORABLE":
        return "bg-green-100 text-green-800";
      case "CANCELADO":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 🔸 Mientras carga
  if (loading)
    return (
      <div className="p-6 text-center text-slate-500">
        Cargando requerimientos externos…
      </div>
    );

  // 🔸 Si no hay registros
  if (filtered.length === 0)
    return (
      <div className="divide-y divide-gray-200">
        {/* Encabezado */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#f97316] text-white font-bold text-sm rounded-t-xl">
          <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
          <div className="px-4 py-2 flex items-center">
            Estado
            <select
              value={estadoFiltro}
              onChange={handleChange}
              className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
            >
              <option value="Todos">Todos</option>
              <option value="EN REVISIÓN">EN REVISIÓN</option>
              <option value="ENVIADO">ENVIADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="DEVUELTO">DEVUELTO</option>
              <option value="FAVORABLE">FAVORABLE</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>
          <div className="px-4 py-2 flex items-center">Fecha</div>
        </div>
        <div className="p-10 text-center text-slate-400 italic">
          No hay resultados disponibles
        </div>
      </div>
    );

  // 🔸 Render normal
  return (
    <div className="divide-y divide-gray-200">
      {/* Encabezado */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#f97316] text-white font-bold text-sm rounded-t-xl">
        <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
        <div className="px-4 py-2 flex items-center">
          Estado
          <select
            value={estadoFiltro}
            onChange={handleChange}
            className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="EN REVISIÓN">EN REVISIÓN</option>
            <option value="ENVIADO">ENVIADO</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="DEVUELTO">DEVUELTO</option>
            <option value="FAVORABLE">FAVORABLE</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>
        <div className="px-4 py-2 flex items-center">Fecha</div>
      </div>

      {/* Filas */}
      {filtered.map((row, i) => {
        const estado =
          row.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
          row.requerimiento?.estadoRequerimiento?.nombre_estado ||
          row.estado ||
          "SIN ESTADO";

        return (
          <div
            key={row.id_sirecq_externo || i}
            className={`grid grid-cols-[1.5fr_1fr_1fr] text-sm hover:bg-gray-50 ${
              i !== filtered.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <div className="px-4 py-3">
              {row.requerimiento?.no_requerimiento || "—"}
            </div>

            <div className="px-4 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass(
                  estado
                )}`}
              >
                {estado}
              </span>
            </div>

            <div className="px-4 py-3">
              {formatDate(row.requerimiento?.fecha_registro)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
