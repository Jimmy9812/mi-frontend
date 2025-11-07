import { useState, useEffect, useMemo } from "react";
import { listIncidentes } from "../services/incidentesService";
import { listAccidentes } from "../services/accidentesService";
import { listExternos } from "../services/externosService";
import { listRequerimientos as listTestRequerimientos } from "../services/testProduccionService";
import { listSirecq } from "../services/sirecqService";
import { useAuth } from "../context/AuthContext";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import TablaIncidentes from "./dashboard/TablaIncidentes";
import TablaAccidentes from "./dashboard/TablaAccidentes";
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
    testproduccion: "bg-purple-400",
    sirecq: "bg-indigo-400",
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
      try {
        if (moduloActivo === "incidentes") {
          res = await listIncidentes({ token, page: 1, pageSize: 10000 });
          setItems(res.items || []);
        } else if (moduloActivo === "accidentes") {
          res = await listAccidentes({ token, page: 1, pageSize: 10000 });
          setItems(res.items || []);
        } else if (moduloActivo === "externos") {
          res = await listExternos({ token, page: 1, pageSize: 10000 });
          setItems(res.data || res.items || []);
        } else if (moduloActivo === "testproduccion") {
          res = await listTestRequerimientos({ token, page: 1, pageSize: 10000 });
          setItems(res.items || []);
        } else if (moduloActivo === "sirecq") {
          res = await listSirecq({ token, page: 1, pageSize: 10000 });
          // listSirecq devuelve { items, page, total } en el servicio
          setItems(res.items || []);
        }
      } catch (err) {
        console.error("Error cargando datos del módulo:", moduloActivo, err);
        setItems([]);
      } finally {
        setLoading(false);
      }
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

  // 🎨 Colores fijos por estado
const coloresEstado = {
  FAVORABLE: "#facc15",   // Amarillo
  CANCELADO: "#9ca3af",   // Gris medio
  NEGADO: "#ef4444",      // Rojo
  "SIN ESTADO": "#64748b",// Slate
  PENDIENTE: "#3b82f6",   // Azul
  DEVUELTO: "#a855f7",    // Violeta
  "EN TRÁMITE": "#38bdf8",// Celeste
  REINGRESO: "#ec4899",   // Rosa
};


    // ✅ Generar dataset dinámico por estado
    const doughnutData = {
      labels: Object.keys(stats.porEstado),
      datasets: [
        {
          data: Object.values(stats.porEstado),
          backgroundColor: Object.keys(stats.porEstado).map(
            (estado) => coloresEstado[estado] || "#d1d5db" // gris si no coincide
          ),
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
          <button
            onClick={() => setModuloActivo("testproduccion")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-purple-50 border border-gray-300 text-purple-600"
          >
            <FileText className="w-5 h-5" />
            <span>Test Producción</span>
          </button>
          <button
            onClick={() => setModuloActivo("sirecq")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-50 border border-gray-300 text-indigo-600"
          >
            <Database className="w-5 h-5" />
            <span>SIRECQ</span>
          </button>
        </div>

        {/* Grid fijo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-150px)]">
          {/* Tabla de registros con paginación y filtro de estado */}
          <div className="bg-white rounded-xl shadow flex flex-col">
          
            <div className="flex-1 overflow-y-auto">
            {moduloActivo === "incidentes" && (
            <TablaIncidentes
              items={paginatedItems}
              loading={loading}
              color="bg-green-400"
              onFiltroChange={(nuevoEstado) => {
                setEstadoFiltro(nuevoEstado);
                setPage(1);
              }}
            />
          )}

            {moduloActivo === "accidentes" && (
            <TablaAccidentes
              items={paginatedItems}
              loading={loading}
              onFiltroChange={(nuevoEstado) => {
                // 🔹 Actualiza el filtro global
                setEstadoFiltro(nuevoEstado);
                setPage(1);

                // 🔹 Filtra los datos en memoria para sincronizar estadísticas y gráficos
                const filtrados =
                  nuevoEstado === "Todos"
                    ? items
                    : items.filter(
                        (i) =>
                          i.estado?.toUpperCase().trim() === nuevoEstado.toUpperCase().trim()
                      );

                // 🔹 Calcula estadísticas actualizadas según el filtro
                const total = filtrados.length;
                const porEstado = {};
                filtrados.forEach((a) => {
                  const est = a.estado || "SIN ESTADO";
                  porEstado[est] = (porEstado[est] || 0) + 1;
                });

                const porMes = {};
                filtrados.forEach((a) => {
                  const fecha = a.fecha;
                  if (fecha) {
                    const mes = new Date(fecha).toLocaleString("es-EC", {
                      month: "long",
                      year: "numeric",
                    });
                    porMes[mes] = (porMes[mes] || 0) + 1;
                  }
                });

                setStats({ total, porEstado, porMes });
              }}
              onColorChange={(nuevoColor) => {
                // Cambia color dinámico del encabezado y del gráfico
                colores.accidentes = nuevoColor;
              }}
            />
          )}



            {/* seguirán extern os, test, sirecq */}
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