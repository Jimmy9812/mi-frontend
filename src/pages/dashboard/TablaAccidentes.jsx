import { useState } from "react";

export default function TablaAccidentes({ items = [], loading, onFiltroChange }) {
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  const handleChange = (e) => {
    const value = e.target.value;
    setEstadoFiltro(value);
    if (onFiltroChange) onFiltroChange(value); // comunica al Dashboard
  };

  const filtered =
    estadoFiltro === "Todos"
      ? items
      : items.filter(
          (a) => a.estado?.toUpperCase().trim() === estadoFiltro.toUpperCase().trim()
        );

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

  const estadoClass = (estado) => {
    switch (estado) {
      case "FAVORABLE":
        return "bg-green-100 text-green-800";
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELADO":
        return "bg-gray-200 text-gray-700";
      case "DEVUELTO":
        return "bg-purple-100 text-purple-800";
      case "EN TRÁMITE":
        return "bg-blue-100 text-blue-800";
      case "NEGADO":
        return "bg-red-200 text-red-900";
      case "REINGRESO":
        return "bg-pink-100 text-pink-800";
      case "SIN ESTADO":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return <div className="p-6 text-center text-slate-500">Cargando accidentes…</div>;

  if (items.length === 0)
    return (
      <div className="divide-y divide-gray-200">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-[#3F6592] text-white font-bold text-sm rounded-t-xl">
          <div className="px-4 py-2 flex items-center">Trámite</div>
          <div className="px-4 py-2 flex items-center">Oficio</div>
          <div className="px-4 py-2 flex items-center">
            Estado
            <select
              value={estadoFiltro}
              onChange={handleChange}
              className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
            >
              <option value="Todos">Todos</option>
              <option value="FAVORABLE">FAVORABLE</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="CANCELADO">CANCELADO</option>
              <option value="DEVUELTO">DEVUELTO</option>
              <option value="EN TRÁMITE">EN TRÁMITE</option>
              <option value="NEGADO">NEGADO</option>
              <option value="REINGRESO">REINGRESO</option>
              <option value="SIN ESTADO">SIN ESTADO</option>
            </select>
          </div>
          <div className="px-4 py-2 flex items-center">Fecha</div>
        </div>

        <div className="p-10 text-center text-slate-400 italic">
          No hay resultados para los filtros seleccionados
        </div>
      </div>
    );

  return (
    <div className="divide-y divide-gray-200">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-[#3F6592] text-white font-bold text-sm rounded-t-xl">
        <div className="px-4 py-2 flex items-center">Trámite</div>
        <div className="px-4 py-2 flex items-center">Oficio</div>
        <div className="px-4 py-2 flex items-center">
          Estado
          <select
            value={estadoFiltro}
            onChange={handleChange}
            className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="FAVORABLE">FAVORABLE</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="CANCELADO">CANCELADO</option>
            <option value="DEVUELTO">DEVUELTO</option>
            <option value="EN TRÁMITE">EN TRÁMITE</option>
            <option value="NEGADO">NEGADO</option>
            <option value="REINGRESO">REINGRESO</option>
            <option value="SIN ESTADO">SIN ESTADO</option>
          </select>
        </div>
        <div className="px-4 py-2 flex items-center">Fecha</div>
      </div>

      {filtered.map((row, i) => (
        <div
          key={row.id || i}
          className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] text-sm hover:bg-gray-50 ${
            i !== filtered.length - 1 ? "border-b border-gray-200" : ""
          }`}
        >
          <div className="px-4 py-3">{row.tramite || "N/A"}</div>
          <div className="px-4 py-3 text-slate-500 italic">{row.oficio || "N/A"}</div>
          <div className="px-4 py-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass(row.estado)}`}
            >
              {row.estado || "SIN ESTADO"}
            </span>
          </div>
          <div className="px-4 py-3">{formatDate(row.fecha)}</div>
        </div>
      ))}
    </div>
  );
}
