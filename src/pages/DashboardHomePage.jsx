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
  <div className="h-screen w-screen bg-gray-100 flex flex-col">
    {/* Header */}
    <header className="w-full bg-[#3F6592] text-white flex items-center justify-between px-6 md:px-12 py-4 shadow-lg">
      <div className="flex items-center gap-4">
        <img src="/sello.png" alt="Sello" className="h-10 md:h-12 w-auto" />
        <span className="text-xl md:text-2xl font-bold">DASHBOARD CATASTRO</span>
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 bg-white text-[#3F6592] px-3 md:px-4 py-2 rounded-lg shadow hover:bg-gray-100 text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        Atrás
      </button>
    </header>

    {/* Main content */}
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      {/* Botones navegación */}
      <div className="flex flex-wrap gap-4 md:gap-6 mb-8 justify-center">
        <Link to="/sirecq" className="flex items-center gap-2 bg-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow hover:bg-pink-50 border border-gray-300 text-pink-600 text-sm md:text-base">
          <FileText className="w-4 h-4 md:w-5 md:h-5" />
          <span>Sirec-Q</span>
        </Link>
        <Link to="/externos" className="flex items-center gap-2 bg-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow hover:bg-orange-50 border border-gray-300 text-orange-600 text-sm md:text-base">
          <Users className="w-4 h-4 md:w-5 md:h-5" />
          <span>Externos</span>
        </Link>
        <Link to="/test-produccion" className="flex items-center gap-2 bg-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow hover:bg-yellow-50 border border-gray-300 text-yellow-600 text-sm md:text-base">
          <Database className="w-4 h-4 md:w-5 md:h-5" />
          <span>Test/Producción</span>
        </Link>
        <Link to="/accidentes" className="flex items-center gap-2 bg-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow hover:bg-blue-50 border border-gray-300 text-blue-600 text-sm md:text-base">
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
          <span>Accidentes</span>
        </Link>
        <Link to="/incidentes" className="flex items-center gap-2 bg-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow hover:bg-green-50 border border-gray-300 text-green-600 text-sm md:text-base">
          <Activity className="w-4 h-4 md:w-5 md:h-5" />
          <span>Incidentes</span>
        </Link>
      </div>

      {/* Grid responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Tabla de requerimientos */}
        <div className="bg-white rounded-xl border shadow flex flex-col h-[400px] md:h-[500px]">
          <div className="flex items-center bg-pink-400 rounded-t-xl px-4 py-2 text-white font-bold text-sm md:text-base">
            <span className="flex-1">Requerimiento</span>
            <span className="flex-1">Estado</span>
            <span className="flex-1">Fecha</span>
          </div>
          {/* Scroll interno */}
          <div className="flex-1 overflow-y-auto divide-y">
            {requerimientos.map((r, i) => (
              <div key={i} className="flex items-center px-4 py-2 text-xs md:text-sm">
                <span className="flex-1">{r.req}</span>
                <span className="flex-1">{r.estado}</span>
                <span className="flex-1">{r.fecha}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráficos */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow p-4">
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} height={180} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } } }} />
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <Radar data={radarData} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);
}
