import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listRequerimientos, exportRequerimientosCsv, exportRequerimientosXlsx, } from "../services/testProduccionService";

// 🔹 Estados posibles (mock)
const ESTADOS = [
  { label: "Todos", value: "ALL" },
  { label: "ENVIADO", value: "ENVIADO" },
  { label: "ATENDIDO", value: "ATENDIDO" },
  { label: "RECHAZADO", value: "RECHAZADO" },
];

// 🔹 Datos MOCK
const MOCK_DATA = [
  { id: 1, numero: "TP-001", estado: "ENVIADO", fecha: "2025-09-10" },
  { id: 2, numero: "TP-002", estado: "ATENDIDO", fecha: "2025-09-12" },
  { id: 3, numero: "TP-003", estado: "RECHAZADO", fecha: "2025-09-14" },
];

export default function TestProduccion() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const canWrite = hasPermission("TESTPRODUCCION_WRITE");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState({ items: [], page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  // Load desde servicio (API o mock)
      async function load() {
  setLoading(true);
  try {
    const resp = await listRequerimientos({
      page,
      pageSize,
      search,
      status,
      token: user?.token || null,
    });

    // ✅ Se corrige acceso a items
    const items = resp?.items || [];

    setData({
      items,
      page: resp?.page || 1,
      total: resp?.total || items.length,
      totalPages: resp?.totalPages || 1,
    });
  } catch (err) {
    console.error("Error cargando tests de producción:", err);
    setData({ items: [], page: 1, total: 0, totalPages: 1 });
  } finally {
    setLoading(false);
  }
}


// 🔍 Efecto para cargar datos con debounce en la búsqueda
    useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, status, search, user?.token]);

    // ✅ Al volver desde otra ruta, vuelve a ejecutar load()
    useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // ✅ Refresco automático al cambiar de página con búsqueda activa
    useEffect(() => {
      if (search.trim() !== "") {
        load();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);


  const showingRange = useMemo(() => {
    const start = (data.page - 1) * pageSize + 1;
    const end = Math.min(data.page * pageSize, data.total);
    return `${start}-${end} de ${data.total}`;
  }, [data, pageSize]);

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Columna izquierda */}
      <div className="h-screen">
        <img src="/estatua.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Columna derecha */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-5 h-5" />
            <Link to="/dashboard" className="hover:underline">
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-semibold">Test/Producción</span>
          </div>
          <div className="text-sm text-slate-600">
            {user?.nombre_usuario} {user?.apellidos_usuario}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex flex-col gap-4 p-6">
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold shadow">
            TEST/PRODUCCIÓN
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const resp = await listRequerimientos({
                    page: 1,
                    pageSize: 10000,
                    search,
                    status,
                    token: user?.token,
                  });
                  const items = resp.items || [];
                  await exportRequerimientosXlsx(items);
                } catch (err) {
                  console.error("Error exportando XLSX:", err);
                  alert("Error al exportar los registros");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              EXPORTAR
            </button>


            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => {setSearch(e.target.value); setPage(1);}}
                className="pl-3 pr-10 py-2 rounded-md border focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setPage(1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-md border focus:ring-2 focus:ring-indigo-500"
            >
              {ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tabla */}
<div className="rounded-xl border overflow-hidden bg-white">
  <div className="grid grid-cols-[1.2fr_1fr_1fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
    <div className="px-4 py-3">N° Requerimiento</div>
    <div className="px-4 py-3">Etapa de Implementación</div>
    <div className="px-4 py-3">Fecha de Envío</div>
    <div className="px-4 py-3 text-center">Acción</div>
  </div>

  {loading ? (
    <div className="p-6 text-center text-slate-500">Cargando…</div>
  ) : data.items.length === 0 ? (
    <div className="p-6 text-center text-slate-500">No hay resultados</div>
  ) : (
    data.items.map((row) => (
      <div
        key={row.id_test_produccion}
        className="grid grid-cols-[1.2fr_1fr_1fr_120px] border-t items-center text-sm"
      >
        {/* 🔹 N° Requerimiento */}
        <div className="px-4 py-3">{row.no_requerimiento || "—"}</div>

        {/* 🔹 Etapa de Implementación */}
        <div className="px-4 py-3">{row.etapa_implementation || "—"}</div>

        {/* 🔹 Fecha de Envío */}
        <div className="px-4 py-3">
          {row.fechaenvioreq
          ? row.fechaenvioreq.split("T")[0].split("-").reverse().join("/")
          : "—"}

        </div>

        {/* 🔹 Acción */}
        <div className="px-4 py-3 flex justify-center">
          <button
            onClick={() =>
              navigate(`/test-produccion/${row.id_test_produccion}`)
            }
            className="px-3 py-1 bg-[#3F6592] text-white rounded-md hover:opacity-90"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))
  )}
</div>

          {/* Footer */}
          <div className="mt-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded"
              >
                {[5, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-slate-500">{showingRange}</span>
            </div>

            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                «
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded ${
                    n === data.page ? "bg-[#3F6592] text-white" : "hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                »
              </button>
            </div>

            {canWrite && (
              <button
                onClick={() => navigate("/test-produccion/nuevo")} // ✅ corregido
                className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                ADD NUEVO REQUERIMIENTO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
