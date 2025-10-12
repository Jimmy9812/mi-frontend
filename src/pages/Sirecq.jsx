import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download } from "lucide-react";
import { listSirecq } from "../services/sirecqService";
import { useAuth } from "../context/AuthContext";

const ESTADOS = ["Todos", "ENVIADO", "PENDIENTE", "FAVORABLE"];

export default function Sirecq() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const result = await listSirecq();
    setData(result);
    setLoading(false);
  }

  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (search)
      filtered = filtered.filter((r) =>
        r.requerimiento.no_requerimiento
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    if (estado !== "Todos")
      filtered = filtered.filter(
        (r) =>
          r.requerimiento.estadoRequerimiento.nombre_estado_requerimiento ===
          estado
      );
    return filtered;
  }, [data, search, estado]);

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

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Imagen lateral */}
      <div className="h-screen">
        <img src="/iglesia.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col">
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
            {user?.nombre_usuario} {user?.apellidos_usuario}
          </div>
        </div>

        {/* Título */}
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">
            SIREC-Q Internos
          </div>
        </div>

        {/* Barra superior */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {}}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="px-3 py-2 rounded-md border"
            >
              {ESTADOS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="mx-6 my-4 rounded-xl border overflow-hidden bg-white">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
            <div className="px-4 py-3">Requerimiento</div>
            <div className="px-4 py-3">Estado</div>
            <div className="px-4 py-3">Fecha</div>
            <div className="px-4 py-3 text-center">Acción</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Cargando…</div>
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No hay registros</div>
          ) : (
            filteredData.map((row) => (
              <div
                key={row.id_sirecq_interno}
                className="grid grid-cols-[1.5fr_1fr_1fr_120px] border-t text-sm hover:bg-gray-50"
              >
                <div className="px-4 py-3">{row.requerimiento.no_requerimiento}</div>
                <div className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                      row.requerimiento.estadoRequerimiento.nombre_estado_requerimiento
                    )}`}
                  >
                    {row.requerimiento.estadoRequerimiento.nombre_estado_requerimiento}
                  </span>
                </div>
                <div className="px-4 py-3">{formatDate(row.requerimiento.fecha_registro)}</div>
                <div className="px-4 py-3 flex justify-center">
                  <button
                    onClick={() => navigate(`/sirecq/${row.id_sirecq_interno}`)}
                    className="px-3 py-1 bg-[#3F6592] text-white rounded-md hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón agregar */}
        <div className="px-6 mb-8 flex justify-end">
          <button
            onClick={() => navigate("/sirecq/nuevo")}
            className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Añadir nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
