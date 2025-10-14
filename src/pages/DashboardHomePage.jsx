import { useState, useEffect, useMemo } from "react";
import { listIncidentes } from "../services/incidentesService";
import { listAccidentes } from "../services/accidentesService";
import { listExternos } from "../services/externosService";
import { useAuth } from "../context/AuthContext";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Users,
  Database,
  AlertTriangle,
  Activity,
} from "lucide-react";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Estado para cambiar colores del encabezado de la tabla
  const [moduloActivo, setModuloActivo] = useState("incidentes");
  const colores = {
    incidentes: "bg-green-400",
    accidentes: "bg-blue-400",
    externos: "bg-orange-400",
  };

  // Estado para datos
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({ total: 0, porEstado: {}, porMes: {} });

  // Cargar datos según módulo
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let res;
      if (moduloActivo === "incidentes") {
        res = await listIncidentes({ token, page: 1, pageSize: 1000 });
        setItems(res.items || []);
      } else if (moduloActivo === "accidentes") {
        res = await listAccidentes({ token, page: 1, pageSize: 1000 });
        setItems(res.items || []);
      } else if (moduloActivo === "externos") {
        res = await listExternos({ token, page: 1, pageSize: 1000 });
        setItems(res.data || res.items || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [moduloActivo, token]);

  // Filtro de estado y paginación
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ✅ Filtrar por estado (usando useMemo para evitar renders infinitos)
  const filteredItems = useMemo(() => {
    return estadoFiltro === "Todos"
      ? items
      : items.filter((i) => {
          const estado =
            i.estado ||
            i.estado_tramite ||
            i.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
            i.requerimiento?.estadoRequerimiento?.nombre_estado ||
            "SIN ESTADO";
          return estado === estadoFiltro;
        });
  }, [estadoFiltro, items]);

  // Paginación
  const totalPages = Math.min(5, Math.max(1, Math.ceil(filteredItems.length / pageSize)));

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  // ✅ Calcular estadísticas
  useEffect(() => {
    // Total
    const total = filteredItems.length;
    // Por estado
    const porEstado = {};
    filteredItems.forEach((i) => {
      let estado = i.estado || i.estado_tramite || i.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento || i.requerimiento?.estadoRequerimiento?.nombre_estado || "SIN ESTADO";
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });
    // Por mes
    const porMes = {};
    filteredItems.forEach((i) => {
      let fecha = i.fecha || i.fecha_registro || i.requerimiento?.fecha_registro;
      if (fecha) {
        const mes = (new Date(fecha)).toLocaleString("es-EC", { month: "long", year: "numeric" });
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    setStats({ total, porEstado, porMes });
  }, [filteredItems]);

  // Datos para gráficos
  const barData = {
    labels: Object.keys(stats.porMes),
    datasets: [
      {
        label: "Registros por mes",
        backgroundColor: ["#60a5fa", "#fbbf24", "#f472b6", "#34d399", "#f87171", "#a78bfa", "#fb7185"],
        borderColor: ["#60a5fa", "#fbbf24", "#f472b6", "#34d399", "#f87171", "#a78bfa", "#fb7185"],
        data: Object.values(stats.porMes),
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(stats.porEstado),
    datasets: [
      {
        data: Object.values(stats.porEstado),
        backgroundColor: ["#60a5fa", "#fbbf24", "#f472b6", "#34d399", "#f87171", "#a78bfa", "#fb7185"],
        borderWidth: 1,
      },
    ],
  };

  const radarData = {
    labels: Object.keys(stats.porMes),
    datasets: [
      {
        label: "Registros por mes",
        data: Object.values(stats.porMes),
        backgroundColor: "rgba(96,165,250,0.2)",
        borderColor: colores[moduloActivo],
        pointBackgroundColor: colores[moduloActivo],
      },
    ],
  };

  return (
  <div className="min-h-screen w-full bg-gray-200 flex flex-col">
      {/* Header */}
      <header className="w-full relative h-[84px] md:h-[88px] flex items-center justify-between px-10 py-15 shadow-lg overflow-hidden">
        {/* Fondo panorámico */}
        <img 
          src="/panoramicaquito.jpg" 
          alt="Panorámica Quito" 
          className="absolute inset-0 w-full h-full object-cover object-center z-0" 
          style={{ minHeight: 84 }}
        />
        {/* Overlay para legibilidad */}
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="flex items-center gap-10 relative z-10">
          <img src="/escudo.png" alt="Sello" className="h-20 w-auto" />
          <span className="text-xl md:text-2xl font-bold text-white drop-shadow">
            DASHBOARD CATASTRO
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 bg-white text-[#3F6592] px-4 py-2 rounded-lg shadow hover:bg-gray-100 relative z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Botones navegación */}
        <div className="flex flex-wrap gap-6 mb-8 justify-center">
          <button
            onClick={() => setModuloActivo("incidentes")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-50 border border-gray-300 text-green-600"
          >
            <Activity className="w-5 h-5" />
            <span>Incidentes</span>
          </button>
          <button
            onClick={() => setModuloActivo("accidentes")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-50 border border-gray-300 text-blue-600"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Accidentes</span>
          </button>
          <button
            onClick={() => setModuloActivo("externos")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-orange-50 border border-gray-300 text-orange-600"
          >
            <Users className="w-5 h-5" />
            <span>Externos</span>
          </button>
        </div>

        {/* Grid fijo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-150px)]">
          {/* Tabla de registros con paginación y filtro de estado */}
          <div className="bg-white rounded-xl shadow flex flex-col">
            <div className={`flex items-center ${colores[moduloActivo]} rounded-t-xl px-4 py-2 text-white font-bold`}>
              <span className="flex-1">ID</span>
              <span className="flex-1 flex items-center">Estado
                <select
                  value={estadoFiltro}
                  onChange={(e) => {
                    setEstadoFiltro(e.target.value);
                    setPage(1);
                  }}
                  className="ml-2 px-2 py-1 border rounded text-xs text-black bg-white"
                  style={{ minWidth: 90 }}
                >
                  <option value="Todos">Todos</option>
                  {Object.keys(stats.porEstado).map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </span>
              <span className="flex-1">Fecha</span>
            </div>
            <div className="flex-1 divide-y divide-gray-300 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Cargando…</div>
              ) : paginatedItems.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No hay resultados</div>
              ) : (
paginatedItems.map((r, i) => (
  <div key={i} className="flex items-center px-4 py-3 text-sm">
    <span className="flex-1">
      {r.no_incidente || r.id_incidente || r.no_requerimiento || r.requerimiento?.no_requerimiento || r.id || r.numero}
    </span>
    <span className="flex-1">
      {r.estado ||
        r.estado_tramite ||
        r.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
        r.requerimiento?.estadoRequerimiento?.nombre_estado}
    </span>
    <span className="flex-1">
      {r.fecha || r.fecha_registro || r.requerimiento?.fecha_registro || r.fechaingresoerror}
    </span>
  </div>
))
              )}
            </div>
            {/* Paginación compacta */}
            <div className="flex items-center justify-center gap-1 py-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
              >«</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded text-xs ${p === page ? colores[moduloActivo] + " text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >{p}</button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
              >»</button>
            </div>
          </div>

          {/* Gráficos y tarjetas de estadísticas compactas */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <div className="rounded-lg shadow p-3 flex flex-col items-center justify-center text-white font-bold bg-gradient-to-r from-blue-400 to-blue-600">
                <div className="text-2xl">{stats.total}</div>
                <div className="text-xs font-semibold">Total registros</div>
              </div>
              {Object.entries(stats.porEstado).map(([estado, cantidad], idx) => (
                <div key={estado} className={`rounded-lg shadow p-3 flex flex-col items-center justify-center text-white font-bold`} style={{background: `linear-gradient(90deg, hsl(${idx*60},80%,60%), hsl(${(idx+1)*60},80%,40%))`}}>
                  <div className="text-xl">{cantidad}</div>
                  <div className="text-xs font-semibold">{estado}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow p-4 h-[220px]">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 800, easing: "easeOutCubic" },
                  plugins: { legend: { position: "top" } },
                  scales: {
                    x: { grid: { color: "#e5e7eb" }, ticks: { color: "#666" } },
                    y: { grid: { color: "#e5e7eb" }, ticks: { color: "#666" } },
                  },
                }}
              />
            </div>
            <div className="bg-white rounded-xl shadow p-4 h-[220px]">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  animation: { duration: 800, easing: "easeOutCubic" },
                  plugins: { legend: { display: true, position: "right" } },
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}