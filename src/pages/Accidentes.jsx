// src/pages/Accidentes.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listAccidentes,
  exportAccidentesCsv,
} from "../services/accidentesService";

// 👉 Helper para dar estilos a cada estado
function estadoClass(estado) {
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
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const ESTADOS = [
  { label: "Todos", value: "ALL" },
  { label: "FAVORABLE", value: "FAVORABLE" },
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "CANCELADO", value: "CANCELADO" },
  { label: "DEVUELTO", value: "DEVUELTO" },
  { label: "EN TRÁMITE", value: "EN TRÁMITE" },
  { label: "NEGADO", value: "NEGADO" },
  { label: "REINGRESO", value: "REINGRESO" },
];

export default function Accidentes() {
  const { user, hasPermission, token } = useAuth();
  const navigate = useNavigate();

  const canWrite =
    user?.rol === "Administrador" || hasPermission("ACCIDENTES_WRITE");

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
      const res = await listAccidentes({ token, page, pageSize, search, status });
      setData(res);
    } catch (error) {
      console.error("Error cargando accidentes:", error);
      alert("Error al cargar los accidentes: " + error.message);
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
              load(); // Muestra todos los registros si está vacío
            } else {
              setPage(1);
              load(); // Ejecuta búsqueda con filtro
            }
          }, 400); // Espera 400 ms antes de llamar a la API

          return () => clearTimeout(delay); // Limpieza del timeout
        }, [search]); // 👈 se ejecuta cada vez que cambia el texto


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
      await exportAccidentesCsv({ token, search, status });
    } catch (error) {
      console.error("Error exportando:", error);
      alert("Error al exportar: " + error.message);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Columna izquierda - imagen ocupa toda la pantalla */}
      <div className="h-screen">
        <img
          src="/panecillo.jpg"
          alt="Quito"
          className="w-full h-full object-cover object-[50%_400%]"
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
            <span className="font-semibold">Accidentes</span>
          </div>
          <div className="text-sm text-slate-600">
            {user ? `${user.nombre_usuario} ${user.apellidos_usuario}` : "Usuario"}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col gap-4 p-6">
          {/* Título */}
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">
            ACCIDENTES
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
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] bg-[#3F6592] text-white font-semibold text-sm">
              <div className="px-4 py-3">Trámite</div>
              <div className="px-4 py-3">Oficio</div>
              <div className="px-4 py-3">Estado</div>
              <div className="px-4 py-3">Fecha</div>
              <div className="px-4 py-3 text-center">Acción</div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-500">Cargando…</div>
            ) : data.items.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No hay resultados
              </div>
            ) : (
              data.items.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] border-t items-center text-sm hover:bg-slate-50"
                >
                  {/* Trámite */}
                  <div className="px-4 py-3">
                    <span className={row.tramite ? "text-slate-900" : "text-slate-400 italic"}>
                      {row.tramite || "N/A"}
                    </span>
                  </div>
                  
                  {/* Oficio */}
                  <div className="px-4 py-3">
                    <span className={row.oficio ? "text-slate-900" : "text-slate-400 italic"}>
                      {row.oficio || "N/A"}
                    </span>
                  </div>
                  
                  {/* Estado con colores dinámicos */}
                  <div className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClass(row.estado)}`}>
                      {row.estado}
                    </span>
                  </div>
                  
                  {/* Fecha */}
                  <div className="px-4 py-3">
                    {row.fecha ? new Date(row.fecha).toLocaleDateString("es-EC") : "N/A"}
                  </div>
                  
                  {/* Acción */}
                  <div className="px-4 py-3 flex items-center justify-center">
                    <button
                      onClick={() => navigate(`/accidentes/${row.id}`)}
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
            {canWrite && (
              <button
                onClick={() => navigate("/accidentes/nuevo")}
                className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                AÑADIR NUEVO ACCIDENTE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
