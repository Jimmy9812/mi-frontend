import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listExternos, exportExternosCsv } from "../services/externosService";
import { useAuth } from "../context/AuthContext";

const TIPOS = ["Todos", "RSW", "RST", "RSD"];
const ESTADOS = ["Todos", "EN REVISIÓN", "ENVIADO", "PENDIENTE", "RECHAZADO", "FAVORABLE"];

export default function Externos() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [estado, setEstado] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // =============================
  // 🔹 FUNCIÓN PRINCIPAL LOAD()
  // =============================
  async function load() {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/sirecq-externo`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error cargando externos:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  // =============================
  // 🔹 EXPORTACIÓN CSV
  // =============================
            const handleExport = async () => {
        try {
          setLoading(true);

          // ✅ Obtener todos los externos (según filtro actual)
          const allExternos = await listExternos({
            token,
            role: user?.activeRole,
            page: 1,
            pageSize: 10000,
            search,
            tipo,
          });

          // ✅ Manejar si devuelve array o {items: []}
          const itemsToExport = Array.isArray(allExternos)
            ? allExternos
            : allExternos.items || [];

          console.log(`Exportando ${itemsToExport.length} externos`);

          // ✅ Llamar exportador
          exportExternosCsv({ items: itemsToExport });

        } catch (error) {
          console.error("Error exportando:", error);
          alert("Error al exportar los externos");
        } finally {
          setLoading(false);
        }
      };



  // =============================
  // 🔹 UTILIDADES
  // =============================
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

  // 🔹 Colores para estados (igual que Accidentes e Incidentes)
  const getEstadoColor = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN REVISIÓN":
        return "bg-purple-100 text-purple-800";
      case "ENVIADO":
        return "bg-yellow-100 text-yellow-800";
      case "PENDIENTE":
        return "bg-blue-100 text-blue-800";
      case "RECHAZADO":
        return "bg-red-100 text-red-800";
      case "FAVORABLE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =============================
  // 🔹 FILTROS Y PAGINACIÓN
  // =============================
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.requerimiento?.no_requerimiento?.toLowerCase().includes(s)
      );
    }

    if (estado !== "Todos") {
      filtered = filtered.filter(
        (item) =>
          item.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento === estado
      );
    }

    if (tipo !== "Todos") {
      filtered = filtered.filter(
        (item) => item.requerimiento?.categoria?.siglas_categoria === tipo
      );
    }

    return filtered;
  }, [data, search, estado, tipo]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // =============================
  // 🔹 RENDER
  // =============================
  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Imagen lateral */}
      <div className="h-screen">
        <img src="/iglesia.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Contenido derecho */}
      <div className="flex flex-col">
        {/* Header */}
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

        {/* Título */}
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">
            EXTERNOS SIREC-Q
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
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
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setPage(1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
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
          <div className="grid grid-cols-[1.4fr_1fr_1fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
            <div className="px-4 py-3">N° Requerimiento</div>
            <div className="px-4 py-3">Estado</div>
            <div className="px-4 py-3">Fecha</div>
            <div className="px-4 py-3 text-center">Acción</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Cargando…</div>
          ) : paginatedData.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No hay resultados</div>
          ) : (
            paginatedData.map((row) => {
              const estado =
                row.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento || "—";

              return (
                <div
                  key={row.id_sirecq_externo}
                  className="grid grid-cols-[1.4fr_1fr_1fr_120px] border-t items-center text-sm hover:bg-gray-50"
                >
                  <div className="px-4 py-3">{row.requerimiento?.no_requerimiento}</div>
                  <div className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                        estado
                      )}`}
                    >
                      {estado}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    {formatDate(row.requerimiento?.fecha_registro)}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center">
                    <button
                      onClick={() => navigate(`/externos/${row.id_sirecq_externo}`)}
                      className="px-3 py-1 bg-[#3F6592] text-white rounded-md hover:opacity-90 transition-opacity"
                      title="Ver/Editar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer inferior */}
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
            <span className="text-slate-500">
              {filteredData.length === 0
                ? "0-0 de 0"
                : `${(page - 1) * pageSize + 1}-${Math.min(
                    page * pageSize,
                    filteredData.length
                  )} de ${filteredData.length}`}
            </span>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center gap-1">
            <p className="uppercase text-sm text-gray-600">PÁGINA</p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded ${
                    page === i + 1 ? "bg-[#3F6592] text-white" : "hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                »
              </button>
            </div>
          </div>

          {/* Botón agregar */}
          <button
            onClick={() => navigate("/externos/nuevo")}
            className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            ADD NUEVO REQUERIMIENTO
          </button>
        </div>
      </div>
    </div>
  );
}
