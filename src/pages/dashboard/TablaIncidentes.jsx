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
}) {

  const estados = ["Todos", "FAVORABLE", "PENDIENTE"];
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
   const filtered =
    estadoFiltro === "Todos"
      ? items
      : items.filter(
          (a) => a.estado?.toUpperCase().trim() === estadoFiltro.toUpperCase().trim()
        );
  
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

   const estadoClass = (estado) => {
    switch (estado) {
      case "FAVORABLE":
        return "bg-yellow-100 text-yellow-800";
      case "PENDIENTE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };


  if (loading)
    return <div className="p-6 text-center text-slate-500">Cargando…</div>;

  if (items.length === 0)
    return (
  <div className="divide-y divide-gray-200">
    {/* Encabezado */}
    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-[#00b050] text-white font-bold text-sm rounded-t-xl">
      <div className="px-4 py-2 flex items-center">Trámite</div>
      <div className="px-4 py-2 flex items-center">Oficio</div>
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

    {/* Cuerpo */}
    {loading ? (
      <div className="p-6 text-center text-slate-500">Cargando incidentes…</div>
    ) : filtered.length === 0 ? (
      <div className="p-10 text-center text-slate-400 italic">
        No hay resultados para los filtros seleccionados
      </div>
    ) : (
      filtered.map((row, i) => (
        <div
          key={i}
          className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] text-sm hover:bg-gray-50 ${
            i !== filtered.length - 1 ? "border-b border-gray-200" : ""
          }`}
        >
          <div className="px-4 py-3">{row.tramite || "N/A"}</div>
          <div className="px-4 py-3 text-slate-500 italic">
            {row.oficio || "N/A"}
          </div>
          <div className="px-4 py-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass(
                row.estado
              )}`}
            >
              {row.estado || "SIN ESTADO"}
            </span>
          </div>
          <div className="px-4 py-3">
            {row.fecha ? formatDate(row.fecha) : "N/A"}
          </div>
        </div>
      ))
    )}
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
      {filtered.map((row, index) => (
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
