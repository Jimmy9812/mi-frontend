import { useState, useMemo } from "react";

/**
 * TablaSirecq (versión funcional igual a TablaIncidentes)
 * - Filtro interno por estado
 * - Sin dependencias del Dashboard para filtrar visualmente
 * - Notifica al Dashboard para actualizar estadísticas
 */
export default function TablaSirecq({ items = [], loading, onFiltroChange }) {
  const estados = ["Todos", "ENVIADO", "DEVUELTO", "EN REVISIÓN", "ATENDIDO"];
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  // 🔹 Filtrado local, idéntico al patrón de incidentes
  const filtered =
    estadoFiltro === "Todos"
      ? items
      : items.filter((a) => {
          const estado =
            a.sirecqExterno?.requerimiento?.estadoRequerimiento
              ?.nombre_estado_requerimiento ||
            a.sirecqExterno?.requerimiento?.estadoRequerimiento?.nombre_estado ||
            a.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
            a.requerimiento?.estadoRequerimiento?.nombre_estado ||
            a.estado ||
            "SIN ESTADO";

          return (
            estado?.toUpperCase().trim() === estadoFiltro.toUpperCase().trim()
          );
        });

  const handleChange = (e) => {
    const value = e.target.value;
    setEstadoFiltro(value);
    if (onFiltroChange) onFiltroChange(value);
  };

  // 🔹 Colores por estado
  const estadoClass = (estado) => {
    switch (estado?.toUpperCase()) {
      case "ENVIADO":
        return "bg-blue-100 text-blue-800";
      case "DEVUELTO":
        return "bg-red-100 text-red-800";
      case "EN REVISIÓN":
        return "bg-purple-100 text-purple-800";
      case "ATENDIDO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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

  // 🔹 Estado de carga
  if (loading)
    return (
      <div className="p-6 text-center text-slate-500">
        Cargando registros SIRECQ…
      </div>
    );

  // 🔹 Si no hay resultados
  if (filtered.length === 0)
    return (
      <div className="divide-y divide-gray-200">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#3F6592] text-white font-bold text-sm rounded-t-xl">
          <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
          <div className="px-4 py-2 flex items-center">
            Estado
            <select
              value={estadoFiltro}
              onChange={handleChange}
              className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
            >
              {estados.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="px-4 py-2 flex items-center">Fecha</div>
        </div>
        <div className="p-10 text-center text-slate-400 italic">
          No hay resultados para los filtros seleccionados
        </div>
      </div>
    );

  // 🔹 Render normal
  return (
    <div className="divide-y divide-gray-200">
      <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#3F6592] text-white font-bold text-sm rounded-t-xl">
        <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
        <div className="px-4 py-2 flex items-center">
          Estado
          <select
            value={estadoFiltro}
            onChange={handleChange}
            className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
          >
            {estados.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="px-4 py-2 flex items-center">Fecha</div>
      </div>

      {filtered.map((row, i) => {
        const estado =
          row.sirecqExterno?.requerimiento?.estadoRequerimiento
            ?.nombre_estado_requerimiento ||
          row.sirecqExterno?.requerimiento?.estadoRequerimiento?.nombre_estado ||
          row.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
          row.requerimiento?.estadoRequerimiento?.nombre_estado ||
          row.estado ||
          "SIN ESTADO";

        const fecha =
          row.fecha_env_dmc ||
          row.requerimiento?.fecha_registro ||
          row.sirecqExterno?.requerimiento?.fecha_registro ||
          null;

        return (
          <div
            key={row.id_sirecq_interno || i}
            className={`grid grid-cols-[1.5fr_1fr_1fr] text-sm hover:bg-gray-50 ${
              i !== filtered.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <div className="px-4 py-3">
              {row.sirecqExterno?.requerimiento?.no_requerimiento ||
                row.requerimiento?.no_requerimiento ||
                "—"}
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

            <div className="px-4 py-3">{formatDate(fecha)}</div>
          </div>
        );
      })}
    </div>
  );
}
