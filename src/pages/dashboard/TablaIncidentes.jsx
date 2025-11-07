import { useState, useMemo, useEffect } from "react";

/**
 * Tabla de INCIDENTES dentro del Dashboard.
 * Props:
 * - items: registros ya filtrados globalmente
 * - loading: boolean
 * - onFiltroChange: callback para actualizar el filtro global
 * - onColorChange: callback para cambiar color del encabezado dinámicamente
 */
export default function TablaIncidentes({
  items = [],
  loading,
  onFiltroChange,
  onColorChange,
}) {
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const estados = ["Todos", "FAVORABLE", "PENDIENTE"];

  // Cambiar color según el estado seleccionado

  const handleChange = (e) => {
    const value = e.target.value;
    setEstadoFiltro(value);
    if (onFiltroChange) onFiltroChange(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  if (loading)
    return <div className="p-6 text-center text-slate-500">Cargando…</div>;

  if (items.length === 0)
    return (
      <div className="p-6 text-center text-slate-500">
        No hay resultados para los filtros seleccionados
      </div>
    );

  return (
    <div className="divide-y divide-gray-200">
      {/* Encabezado dinámico */}
      <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-[#00b050] text-white font-bold text-sm rounded-t-xl">
  <div className="px-4 py-2 flex items-center">N° de Incidencia</div>
  <div className="px-4 py-2 flex items-center">
    Estado
    <select
      value={estadoFiltro}
      onChange={handleChange}
      className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
    >
      {estados.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  </div>
  <div className="px-4 py-2 flex items-center">Fecha</div>
</div>


      {/* Filas */}
      {items.map((row, index) => (
        <div
          key={row.id || row.numero}
          className={`grid grid-cols-[1.2fr_1fr_1fr] items-center text-sm hover:bg-gray-50 ${
            index !== items.length - 1 ? "border-b border-gray-200" : ""
          }`}
        >
          <div className="px-4 py-3 truncate" title={row.descripcion || ""}>
            {row.numero || "Sin número"}
          </div>

          <div className="px-4 py-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                row.estado === "FAVORABLE"
                  ? "bg-yellow-100 text-yellow-800"
                  : row.estado === "PENDIENTE"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {row.estado || "Sin estado"}
            </span>
          </div>

          <div className="px-4 py-3">{formatDate(row.fecha)}</div>
        </div>
      ))}
    </div>
  );
}
