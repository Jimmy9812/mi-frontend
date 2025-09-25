import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listIncidentes, exportIncidentesCsv } from "../services/incidentesService";

const ESTADOS = [
  { label: "Todos", value: "ALL" },
  { label: "FAVORABLE", value: "FAVORABLE" },
  { label: "PENDIENTE", value: "PENDIENTE" },
  ];

export default function Incidentes() {
  const { user, hasPermission, token } = useAuth();
  const navigate = useNavigate();
  const canWrite = hasPermission("INCIDENTES_WRITE");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
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
      console.log('Cargando incidentes con:', { token, role: user?.activeRole, page, pageSize, search, status });
      const res = await listIncidentes({ token, role: user?.activeRole, page, pageSize, search, status });
      console.log('Respuesta del servicio:', res);
      setData(res);
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
      // Mantener datos anteriores en caso de error
      setData(prev => ({ ...prev, items: [] }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, user?.activeRole]);

  const showingRange = useMemo(() => {
    if (data.total === 0) return "0-0 de 0";
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
    setLoading(true);
    
    // Obtener TODOS los incidentes sin paginación usando pageSize muy grande
    const allIncidentes = await listIncidentes({ 
      token, 
      role: user?.activeRole, 
      page: 1, 
      pageSize: 10000, // Número muy alto para obtener todos
      search, // Mantener filtros actuales
      status 
    });
    
    console.log(`Exportando ${allIncidentes.items.length} incidentes de ${allIncidentes.total} totales`);
    
    // Exportar todos los elementos obtenidos
    exportIncidentesCsv(allIncidentes.items);
    
  } catch (error) {
    console.error('Error al exportar:', error);
    alert('Error al exportar los incidentes');
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Columna izquierda - imagen */}
      <div className="h-screen">
        <img
          src="/iglesia.jpg"
          alt="Quito"
          className="w-full h-full object-cover"
        />
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
            <span className="font-semibold">Incidentes</span>
          </div>
          <div className="text-sm text-slate-600">
            {user?.nombre_usuario} {user?.apellidos_usuario}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col gap-4 p-6">
          {/* Título */}
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">
            INCIDENTES
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              EXPORT
            </button>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por número o descripción"
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
            <div className="grid grid-cols-[1.2fr_1fr_1fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
              <div className="px-4 py-3">N° de Incidencia</div>
              <div className="px-4 py-3">Estado</div>
              <div className="px-4 py-3">Fecha</div>
              <div className="px-4 py-3 text-center">Acción</div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-500">Cargando…</div>
            ) : data.items.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No hay resultados para los filtros seleccionados
              </div>
            ) : (
              data.items.map((row) => (
                <div
                  key={row.id || row.numero}
                  className="grid grid-cols-[1.2fr_1fr_1fr_120px] border-t items-center text-sm hover:bg-gray-50"
                >
                  <div className="px-4 py-3" title={row.descripcion || ''}>
                    {row.numero || 'Sin número'}
                  </div>
                  <div className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.estado === 'FAVORABLE' ? 'bg-green-100 text-green-800' :
                      row.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      row.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.estado || 'Sin estado'}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    {formatDate(row.fecha)}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center">
                    <button
                      onClick={() => navigate(`/incidentes/${row.id}`)}
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
                {[5, 10, 20, 50].map((n) => (
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
                {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => {
                  let pageNum;
                  if (data.totalPages <= 10) {
                    pageNum = i + 1;
                  } else if (page <= 5) {
                    pageNum = i + 1;
                  } else if (page > data.totalPages - 5) {
                    pageNum = data.totalPages - 9 + i;
                  } else {
                    pageNum = page - 4 + i;
                  }
                  
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
            {canWrite && (
              <button
                onClick={() => navigate("/incidentes/nuevo")}
                className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                ADD NUEVO INCIDENTE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}