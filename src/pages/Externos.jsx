import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listExternos, exportExternosCsv } from "../services/externosService";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const TIPOS = ["Todos", "RSW", "RD", "RPM"];
const ESTADOS = ["Todos", "EN REVISIÓN", "ENVIADO", "PENDIENTE", "DEVUELTO", "FAVORABLE"];

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
      await exportExternosCsv({
        token,
        search,
        tipo,
        status: estado === "Todos" ? "ALL" : estado,
      });
    } catch (error) {
      console.error("Error exportando:", error);
      alert("Error al exportar los externos");
    } finally {
      setLoading(false);
    }
  };

  const handleExportXlsx = async () => {
  try {
    // 1️⃣ Cargar todos los registros desde el backend
    const url = `${import.meta.env.VITE_API_URL}/sirecq-externo`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();

    const allItems = result.data || [];

    // 2️⃣ Convertir datos al formato de Excel
    const rows = allItems.map((row) => ({
      "N° Requerimiento": row.requerimiento?.no_requerimiento || "",
      "Tema / Trámite": row.requerimiento?.tema || "",
      "Descripción": row.requerimiento?.descripcion || "",
      "Dependencia": row.dependencia?.sigla_dependencia || row.dependencia?.nombre_dependencia || "",
      "Sistema Afectar": row.requerimiento?.sistema?.nom_sistema || "",
      "Estado": row.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento || "",
      "Fecha Registro": formatDate(row.requerimiento?.fecha_registro),
      "Seguimiento Institucional": row.seguimientoinst || "",
      "Trámite CAT": row.tramitecat || "",
      "Trámite Priorizado": row.tramitepr || "",
      "Responsable (Analista)": row.requerimiento?.rolUsuario?.usuario
        ? `${row.requerimiento.rolUsuario.usuario.nombre_usuario} ${row.requerimiento.rolUsuario.usuario.apellidos_usuario}`
        : "",
      "Observaciones Generales": row.observacionesgen || "",
    }));

    if (rows.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // 3️⃣ Crear y descargar el archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Externos");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fecha = new Date().toISOString().split("T")[0];
    saveAs(blob, `SIRECQ_Externos_${fecha}.xlsx`);

  } catch (error) {
    console.error("❌ Error exportando XLSX:", error);
    alert("Error al exportar a Excel: " + error.message);
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
      case "DEVUELTO":
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
  // 🧩 Función auxiliar para normalizar texto
  const normalize = (v) => (v ? v.trim().toUpperCase() : "");

  let filtered = [...data];

  // 🔍 Filtro por búsqueda (N° de requerimiento)
  if (search) {
    const s = normalize(search);
    filtered = filtered.filter((item) =>
      normalize(item.requerimiento?.no_requerimiento).includes(s)
    );
  }

  // 🟢 Filtro por estado (nombre_estado_requerimiento)
  if (estado !== "Todos") {
    filtered = filtered.filter((item) => {
      const est = normalize(item.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento);
      return est === normalize(estado);
    });
  }

  // 🔵 Filtro por tipo (siglas_categoria)
  if (tipo !== "Todos") {
    filtered = filtered.filter((item) => {
      const tipoCat = normalize(item.requerimiento?.categoria?.siglas_categoria);
      return tipoCat === normalize(tipo);
    });
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
              onClick={handleExportXlsx}
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
              {Array.from(
              { length: Math.min(8, totalPages) }, // máximo 8 botones visibles
              (_, i) => {
                // Calcula desde qué número de página empezar a mostrar
                const startPage = Math.max(1, Math.min(page - 3, totalPages - 7));
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded ${
                      pageNum === page ? "bg-[#3F6592] text-white" : "hover:bg-slate-100"
                    }`}
                  >
                  {pageNum}
                  </button>
                );
                }
                )}
                »
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
