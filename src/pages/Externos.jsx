import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listExternos, exportExternosCsv } from "../services/externosService";
import { useAuth } from "../context/AuthContext";

const TIPOS = ["Todos", "RSW", "RST", "RSD"];
const ESTADOS = ["Todos", "ENVIADO", "PENDIENTE", "RECHAZADO", "FAVORABLE"];

export default function Externos() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [estado, setEstado] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState({ data: [], count: 0 });
  const [loading, setLoading] = useState(false);

  // =============================
  // 🔹 FUNCIÓN PRINCIPAL LOAD()
  // =============================
  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("pageSize", pageSize);
      if (search) params.set("search", search);
      if (tipo && tipo !== "Todos") params.set("tipo", tipo);
      if (estado && estado !== "Todos") params.set("estado", estado);

      const url = `${import.meta.env.VITE_API_URL}/sirecq-externo?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.success) {
        setData({
          data: result.data || [],
          count: result.count || 0,
        });
      } else {
        setData({ data: [], count: 0 });
      }
    } catch (err) {
      console.error("Error cargando externos:", err);
      setData({ data: [], count: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, pageSize, tipo, estado, search]); // <-- incluye búsqueda

  const doSearch = async () => {
    setPage(1);
    await load();
  };

  // =============================
  // 🔹 FUNCIÓN DE EXPORTACIÓN CSV
  // =============================
  const handleExport = () => {
    if (!data.data.length) {
      alert("No hay datos para exportar");
      return;
    }

    const formatted = data.data.map((r) => ({
      "N° Requerimiento": r.requerimiento?.no_requerimiento || "",
      "Estado":
        r.requerimiento?.estadoRequerimiento?.nombre_estado ||
        r.requerimiento?.estado_requerimiento?.nombre_estado ||
        "",
      "Fecha Registro": r.requerimiento?.fecha_registro || "",
      "Dependencia": r.dependencia?.nombre_dependencia || "",
      "Sistema": r.requerimiento?.sistema?.nombre_sistema || "",
      "Categoría": r.requerimiento?.categoria?.nombre_categoria || "",
    }));

    exportExternosCsv(formatted);
  };

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

  // =============================
  // 🔹 FILTRADO LOCAL
  // =============================
  const filteredData = useMemo(() => {
    let filtered = data.data;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.requerimiento?.no_requerimiento?.toLowerCase().includes(s)
      );
    }

    if (estado !== "Todos") {
      filtered = filtered.filter(
        (item) =>
          item.requerimiento?.estadoRequerimiento?.nombre_estado === estado ||
          item.requerimiento?.estado_requerimiento?.nombre_estado === estado
      );
    }

    if (tipo !== "Todos") {
      filtered = filtered.filter((item) =>
        item.requerimiento?.no_requerimiento?.startsWith(tipo)
      );
    }

    return filtered;
  }, [data.data, search, estado, tipo]);

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
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                className="pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={doSearch}
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
              onChange={(e) => setEstado(e.target.value)}
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
              onChange={(e) => setTipo(e.target.value)}
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
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No hay resultados</div>
          ) : (
            filteredData.map((row) => (
              <div
                key={row.id_sirecq_externo}
                className="grid grid-cols-[1.4fr_1fr_1fr_120px] border-t items-center text-sm hover:bg-gray-50"
              >
                <div className="px-4 py-3">{row.requerimiento?.no_requerimiento}</div>
                <div className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {row.requerimiento?.estadoRequerimiento?.nombre_estado ||
                      row.requerimiento?.estado_requerimiento?.nombre_estado ||
                      "—"}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
