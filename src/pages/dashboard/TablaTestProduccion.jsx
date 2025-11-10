import { useState, useMemo, useEffect } from "react";

/**
 * Tabla para el módulo Test/Producción
 * Props:
 * - items: registros filtrados y paginados desde Dashboard
 * - loading: boolean
 * - onFiltroChange: callback hacia Dashboard
 * - colorHeader: color dinámico (violeta)
 */
export default function TablaTestProduccion({
  items = [],
  loading,
  onFiltroChange,
  colorHeader = "#8B5CF6", // violeta institucional (Test Producción)
}) {
  const etapas = ["Todas", "Test", "Producción"];
  const [filtroEtapa, setFiltroEtapa] = useState("Todas");

  // 🔹 Sincroniza filtro con Dashboard
  useEffect(() => {
    if (onFiltroChange) onFiltroChange(filtroEtapa);
  }, [filtroEtapa]);

  // 🔹 Filtra los registros según la etapa (a nivel visual)
  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (filtroEtapa === "Todas") return items;
    return items.filter((r) => {
      const etapa = (r.etapa_implementation || r.etapa || "").toUpperCase();
      return etapa.includes(filtroEtapa.toUpperCase());
    });
  }, [items, filtroEtapa]);

  // 🔹 Formatear fecha (corrige desfase de -1 día)
  const formatDate = (dateString) => {
    if (!dateString) return "—";

    try {
      // ✅ Caso 1: formato exacto "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [y, m, d] = dateString.split("-");
        return `${d}/${m}/${y}`;
      }

      // ✅ Caso 2: formato con hora ISO (ej. "2024-10-15T00:00:00.000Z")
      if (dateString.includes("T")) {
        const [y, m, d] = dateString.split("T")[0].split("-");
        return `${d}/${m}/${y}`;
      }

      // ✅ Caso alternativo (por seguridad)
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      return "—";
    } catch {
      return "—";
    }
  };

  // 🔹 Estilo de las etiquetas de etapa
  const etapaClass = (etapa) => {
    if (!etapa) return "bg-gray-100 text-gray-700";
    const e = etapa.toLowerCase();
    if (e.includes("test")) return "bg-yellow-100 text-yellow-800";
    if (e.includes("produc")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* 🔹 Encabezado con color dinámico */}
      <div
        className="grid grid-cols-[1.2fr_1fr_1fr] text-white font-bold text-sm rounded-t-xl"
        style={{ backgroundColor: colorHeader }}
      >
        <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
        <div className="px-4 py-2 flex items-center">
          Etapa
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
          >
            {etapas.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="px-4 py-2 flex items-center">Fecha de Envío</div>
      </div>

      {/* 🔹 Cuerpo de la tabla */}
      {loading ? (
        <div className="p-6 text-center text-slate-500">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-slate-400 italic">
          No hay resultados para los filtros seleccionados
        </div>
      ) : (
        filtered.map((row, i) => (
          <div
            key={row.id_test_produccion || i}
            className={`grid grid-cols-[1.2fr_1fr_1fr] text-sm hover:bg-gray-50 ${
              i !== filtered.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <div className="px-4 py-3">{row.no_requerimiento || "—"}</div>
            <div className="px-4 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${etapaClass(
                  row.etapa_implementation
                )}`}
              >
                {row.etapa_implementation || "Sin etapa"}
              </span>
            </div>
            <div className="px-4 py-3">{formatDate(row.fechaenvioreq)}</div>
          </div>
        ))
      )}
    </div>
  );
}
