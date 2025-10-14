import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listSirecq, exportSirecqCsv } from "../services/sirecqService";
import { useAuth } from "../context/AuthContext";

const ESTADOS = [
  { label: "Todos", value: "Todos" },
  { label: "ENVIADO", value: "ENVIADO" },
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "FAVORABLE", value: "FAVORABLE" }
];

export default function Sirecq() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState({
    items: [],
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listSirecq({ token, page, pageSize, search, status });
      setData(res);
    } catch (error) {
      console.error("Error cargando SIRECQ internos:", error);
      alert("Error al cargar los SIRECQ internos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status]);

  // 🔹 Búsqueda automática cuando cambia el texto del buscador
  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.trim() === "") {
        load();
      } else {
        setPage(1);
        load();
      }
    }, 400);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const showingRange = useMemo(() => {
    const start = (data.page - 1) * pageSize + 1;
    const end = Math.min(data.page * pageSize, data.total);
    return `${start}-${end} de ${data.total}`;
  }, [data, pageSize]);

  const doSearch = async () => {
    setPage(1);
    await load();
  };

  const handleExport = async () => {
    try {
      await exportSirecqCsv({ token, search, status });
    } catch (error) {
      console.error("Error exportando:", error);
      alert("Error al exportar: " + error.message);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toUpperCase()) {
      case "ENVIADO":
        return "bg-yellow-100 text-yellow-800";
      case "FAVORABLE":
        return "bg-green-100 text-green-800";
      case "PENDIENTE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Imagen lateral */}
      <div className="h-screen">
        <img src="/iglesia.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-5 h-5" />
            <Link to="/dashboard" className="hover:underline">
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-semibold">SIREC-Q</span>
          </div>
          <div className="text-sm text-slate-600">
            {user ? `${user.nombre_usuario} ${user.apellidos_usuario}` : "Usuario"}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col gap-4 p-6">
          {/* Título */}
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">
            SIREC-Q Internos
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
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
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={doSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100"
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
              className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="grid grid-cols-[1.5fr_1fr_1fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
              <div className="px-4 py-3">Requerimiento</div>
              <div className="px-4 py-3">Estado</div>
              <div className="px-4 py-3">Fecha</div>
              <div className="px-4 py-3 text-center">Acción</div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-500">Cargando…</div>
            ) : data.items.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No hay resultados</div>
            ) : (
              data.items.map((row) => (
                <div
                  key={row.id_sirecq_interno}
                  className="grid grid-cols-[1.5fr_1fr_1fr_120px] border-t items-center text-sm hover:bg-slate-50"
                >
                  {/* Requerimiento */}
                  <div className="px-4 py-3">
                    {row.sirecqExterno?.requerimiento?.no_requerimiento}
                  </div>
                  
                  {/* Estado */}
                  <div className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(row.estado)}`}
                    >
                      {row.estado}
                    </span>
                  </div>
                  
                  {/* Fecha */}
                  <div className="px-4 py-3">
                    {formatDate(row.fecha_env_dmc)}
                  </div>
                  
                  {/* Acción */}
                  <div className="px-4 py-3 flex items-center justify-center">
                    <button
                      onClick={() => navigate(`/sirecq/${row.id_sirecq_interno}`)}
                      className="px-3 py-1 bg-[#3F6592] text-white rounded-md hover:opacity-90 transition-opacity"
                      title="Ver detalles"
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
            {/* Page size */}
            <div className="flex items-center gap-2 text-sm">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded"
              >
                {[5, 8, 10, 15].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-slate-500">{showingRange}</span>
            </div>

            {/* Paginación */}
            <div className="flex flex-col items-center gap-1">
              <p className="uppercase text-sm text-gray-600">Página</p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  «
                </button>
                {Array.from({ length: Math.min(8, data.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i;
                  if (pageNum > data.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded ${
                        pageNum === data.page
                          ? "bg-[#3F6592] text-white"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={page === data.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  »
                </button>
              </div>
            </div>

            {/* Botón agregar */}
            <button
              onClick={() => navigate("/sirecq/nuevo")}
              className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              AÑADIR NUEVO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}