// src/pages/Externos.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listExternos, exportExternosCsv } from "../services/externosService";
import { useAuth } from "../context/AuthContext";

const TIPOS = ["RSW", "RST", "RSD"];

export default function Externos() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("RSW");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState({ items: [], page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listExternos({ token, page, pageSize, search, tipo });
      setData(res);
    } catch (err) {
      console.error("Error cargando externos:", err);
      setData({ items: [], page: 1, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, tipo]);

  const doSearch = async () => {
    setPage(1);
    await load();
  };

  const showingRange = useMemo(() => {
    if (data.total === 0) return "0-0 de 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, data.total);
    return `${start}-${end} de ${data.total}`;
  }, [data.total, page, pageSize]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-EC", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Columna izquierda - imagen */}
      <div className="h-screen">
        <img src="/iglesia.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Columna derecha */}
      <div className="flex flex-col">
        {/* Header superior (breadcrumb + user) */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-5 h-5" />
            <Link to="/dashboard" className="hover:underline">
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-semibold">Externos</span>
          </div>
          <div className="text-sm text-slate-600">
            {user?.nombre_usuario} {user?.apellidos_usuario}
          </div>
        </div>

        {/* Barra título dorada */}
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-[#c8b451] text-white px-5 py-3 font-bold tracking-wide shadow">
            EXTERNOS SIREC-Q
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportExternosCsv(data.items)}
              className="flex items-center gap-2 px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              EXPORT
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
                title="Buscar"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          <div>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="mx-6 my-4 rounded-xl border overflow-hidden bg-white">
          {/* Cabecera tabla */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_120px] bg-[#bfae52] text-white font-semibold text-sm">
            <div className="px-4 py-3">N° Requerimiento</div>
            <div className="px-4 py-3">Estado</div>
            <div className="px-4 py-3">Fecha</div>
            <div className="px-4 py-3 text-center">Acción</div>
          </div>

          {/* Filas */}
          {loading ? (
            <div className="p-6 text-center text-slate-500">Cargando…</div>
          ) : data.items.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No hay resultados</div>
          ) : (
            data.items.map((row) => (
              <div
                key={row.id || row.no_requerimiento}
                className="grid grid-cols-[1.4fr_1fr_1fr_120px] border-t items-center text-sm hover:bg-gray-50"
              >
                <div className="px-4 py-3">{row.no_requerimiento}</div>
                <div className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {row.estado}
                  </span>
                </div>
                <div className="px-4 py-3">{formatDate(row.fecha)}</div>
                <div className="px-4 py-3 flex items-center justify-center">
                  <button
                    onClick={() => navigate(`/externos/${row.id}`)}
                    className="px-3 py-1 bg-[#c8b451] text-white rounded-md hover:opacity-90 transition-opacity"
                    title="Ver/Editar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer inferior: tamaño + paginación + botón agregar */}
        <div className="mx-6 mt-0 mb-8 flex items-center justify-between">
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

          {/* Paginación centrada */}
          <div className="flex flex-col items-center gap-1">
            <p className="uppercase text-sm text-gray-600">PÁGINA</p>
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
                if (data.totalPages <= 10) pageNum = i + 1;
                else if (page <= 5) pageNum = i + 1;
                else if (page > data.totalPages - 5) pageNum = data.totalPages - 9 + i;
                else pageNum = page - 4 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded ${
                      pageNum === page
                        ? "bg-[#c8b451] text-white"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>

          {/* Botón agregar (abajo derecha) */}
          <button
            onClick={() => navigate("/externos/nuevo")}
            className="flex items-center gap-2 bg-[#c8b451] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            ADD NUEVO REQUERIMIENTO
          </button>
        </div>
      </div>
    </div>
  );
}
