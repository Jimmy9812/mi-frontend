import { useMemo } from "react";

/**
 * TablaSirecq (versión sincronizada con backend)
 * - Recibe estadosList desde Dashboard
 * - No define estados fijos
 */
export default function TablaSirecq({
  items = [],
  loading,
  estado = "Todos",
  estadosList = [{ nombre_estado_requerimiento: "Todos" }],
  onFiltroChange,
}) {
  const handleChange = (e) => onFiltroChange?.(e.target.value);

  // 🔹 Estado correcto SOLO desde Requerimiento (interno/externo)
  const getEstadoSirecq = (r) =>
    r?.sirecqExterno?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
    r?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
    "SIN ESTADO";

  // ✅ Formatear fecha correctamente y mostrar N/A si no existe
  const formatDate = (fecha) => {
    if (!fecha || fecha === "null" || fecha === null || fecha === undefined) return "N/A";

    try {
      // ✅ Caso 1: formato simple "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split("-");
        return `${d}/${m}/${y}`; // dd/mm/yyyy
      }

      // ✅ Caso 2: formato con hora ISO (ej. "2025-11-07T00:00:00.000Z")
      if (fecha.includes("T")) {
        const [y, m, d] = fecha.split("T")[0].split("-");
        return `${d}/${m}/${y}`;
      }

      // ✅ Caso alternativo (por seguridad)
      const parsed = new Date(fecha);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("es-EC", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      }

      return "N/A";
    } catch {
      return "N/A";
    }
  };

  const estadoClass = (estado) => {
    switch ((estado || "").toUpperCase()) {
      case "ENVIADO":
        return "bg-yellow-100 text-yellow-800";
      case "DEVUELTO":
        return "bg-red-100 text-red-800";
      case "EN REVISIÓN":
        return "bg-purple-100 text-purple-800";
      case "ATENDIDO":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center text-slate-500">
        Cargando registros SIRECQ…
      </div>
    );

  const Header = () => (
    <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[#3F6592] text-white font-bold text-sm rounded-t-xl">
      <div className="px-4 py-2 flex items-center">N° Requerimiento</div>
      <div className="px-4 py-2 flex items-center">
        Estado
        <select
          value={estado}
          onChange={handleChange}
          className="ml-2 px-2 py-1 rounded text-black text-xs bg-white"
        >
          {estadosList.map((s, i) => (
            <option key={i} value={s.nombre_estado_requerimiento}>
              {s.nombre_estado_requerimiento}
            </option>
          ))}
        </select>
      </div>
      <div className="px-4 py-2 flex items-center">Fecha</div>
    </div>
  );

  if (!items?.length)
    return (
      <div className="divide-y divide-gray-200">
        <Header />
        <div className="p-10 text-center text-slate-400 italic">
          No hay resultados disponibles
        </div>
      </div>
    );

  return (
    <div className="divide-y divide-gray-200">
      <Header />
      {items.map((row, i) => {
        const estadoRow = getEstadoSirecq(row);

        // 🔹 Prioriza la fecha_registro real del requerimiento
        const fecha =
          row.requerimiento?.fecha_registro ||
          row.sirecqExterno?.requerimiento?.fecha_registro ||
          row.fecha_env_dmc ||
          null;

        return (
          <div
            key={row.id_sirecq_interno || row.id || i}
            className={`grid grid-cols-[1.5fr_1fr_1fr] text-sm hover:bg-gray-50 ${
              i !== items.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            {/* 🔹 N° Requerimiento */}
            <div className="px-4 py-3">
              {row.sirecqExterno?.requerimiento?.no_requerimiento ||
                row.requerimiento?.no_requerimiento ||
                "—"}
            </div>

            {/* 🔹 Estado */}
            <div className="px-4 py-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass(
                  estadoRow
                )}`}
              >
                {estadoRow}
              </span>
            </div>

            {/* 🔹 Fecha */}
            <div className="px-4 py-3">{formatDate(fecha)}</div>
          </div>
        );
      })}
    </div>
  );
}
