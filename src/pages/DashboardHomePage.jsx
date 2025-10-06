import { useState } from "react";
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

  // Estado para cambiar colores del encabezado de la tabla
  const [estadoActivo, setEstadoActivo] = useState("sirecq");

  // Colores dinámicos
  const colores = {
    sirecq: "bg-pink-400",
    externos: "bg-orange-400",
    produccion: "bg-yellow-400",
    accidentes: "bg-blue-400",
    incidentes: "bg-green-400",
  };

  // 🔹 Datos simulados (se reemplazarán con backend)
  const [requerimientos] = useState([
    { req: "RSW_SIREC-Q_2025_001", estado: "ENVIADO", fecha: "7/1/2025" },
    { req: "RSW_SIREC-Q_2025_002", estado: "ENVIADO", fecha: "6/1/2025" },
    { req: "RSW_SIREC-Q_2025_003", estado: "DEVUELTO", fecha: "6/1/2025" },
    { req: "RSW_SIREC-Q_2025_004", estado: "ENVIADO", fecha: "6/1/2025" },
    { req: "RSW_SIREC-Q_2025_005", estado: "DEVUELTO", fecha: "6/1/2025" },
  ]);

  // 🔹 Datos de prueba gráficos
  const barData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Dataset 1",
        backgroundColor: "#f472b6",
        borderColor: "#f472b6",
        data: [20, 40, 30, 60, 50, 40, 30],
      },
      {
        label: "Dataset 2",
        backgroundColor: "#60a5fa",
        borderColor: "#60a5fa",
        data: [40, 30, 50, 70, 60, 60, 60],
      },
    ],
  };

  const doughnutData = {
    labels: ["Incidentes", "Accidentes", "Devueltos", "Enviados"],
    datasets: [
      {
        data: [30, 20, 25, 25],
        backgroundColor: ["#60a5fa", "#fbbf24", "#f472b6", "#34d399"],
        borderWidth: 1,
      },
    ],
  };

  const radarData = {
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
    datasets: [
      {
        label: "2025",
        data: [100, 90, 125, 130, 120, 100],
        backgroundColor: "rgba(96,165,250,0.2)",
        borderColor: "#60a5fa",
        pointBackgroundColor: "#60a5fa",
      },
    ],
  };

  return (
    <div className="h-screen w-screen bg-gray-200 flex flex-col">
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
            onClick={() => setEstadoActivo("sirecq")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-pink-50 border border-gray-300 text-pink-600"
          >
            <FileText className="w-5 h-5" />
            <span>Sirec-Q</span>
          </button>
          <button
            onClick={() => setEstadoActivo("externos")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-orange-50 border border-gray-300 text-orange-600"
          >
            <Users className="w-5 h-5" />
            <span>Externos</span>
          </button>
          <button
            onClick={() => setEstadoActivo("produccion")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-yellow-50 border border-gray-300 text-yellow-600"
          >
            <Database className="w-5 h-5" />
            <span>Test/Producción</span>
          </button>
          <button
            onClick={() => setEstadoActivo("accidentes")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-50 border border-gray-300 text-blue-600"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Accidentes</span>
          </button>
          <button
            onClick={() => setEstadoActivo("incidentes")}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-50 border border-gray-300 text-green-600"
          >
            <Activity className="w-5 h-5" />
            <span>Incidentes</span>
          </button>
        </div>

        {/* Grid fijo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-150px)]">
          {/* Tabla de requerimientos */}
          <div className="bg-white rounded-xl shadow flex flex-col">
            <div
              className={`flex items-center ${colores[estadoActivo]} rounded-t-xl px-4 py-2 text-white font-bold`}
            >
              <span className="flex-1">Requerimiento</span>
              <span className="flex-1">Estado</span>
              <span className="flex-1">Fecha</span>
            </div>
            <div className="flex-1 divide-y divide-gray-300">
              {requerimientos.map((r, i) => (
                <div key={i} className="flex items-center px-4 py-3 text-sm">
                  <span className="flex-1">{r.req}</span>
                  <span className="flex-1">{r.estado}</span>
                  <span className="flex-1">{r.fecha}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos grandes */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow p-4 h-[250px]">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "top" } },
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[250px]">
              <div className="bg-white rounded-xl shadow p-4">
                <Doughnut
                  data={doughnutData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <Radar
                  data={radarData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
