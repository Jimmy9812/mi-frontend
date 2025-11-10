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
import TablaExternos from "./dashboard/TablaExternos";
import TablaTestProduccion from "./dashboard/TablaTestProduccion";
import TablaSirecq from "./dashboard/TablaSirecq";
import { listEstadosRequerimiento } from "../services/sirecqService";


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


  // 🔹 Estados dinámicos del backend (SIRECQ)
// 🔹 Estados dinámicos del backend (SIRECQ)
const [estadosList, setEstadosList] = useState([{ nombre_estado_requerimiento: "Todos" }]);

useEffect(() => {
  async function loadEstados() {
    try {
      const res = await listEstadosRequerimiento({ token });
      if (Array.isArray(res) && res.length > 0) {
        // ✅ Agrega "Todos" solo si no existe ya
        const tieneTodos = res.some(
          (e) =>
            e.nombre_estado_requerimiento?.toUpperCase().trim() === "TODOS"
        );
        const nuevosEstados = tieneTodos
          ? res
          : [{ nombre_estado_requerimiento: "Todos" }, ...res];

        setEstadosList(nuevosEstados);
        console.log("✅ Estados cargados desde backend:", nuevosEstados);
      } else {
        console.warn("⚠️ No se recibieron estados del backend:", res);
        setEstadosList([{ nombre_estado_requerimiento: "Todos" }]);
      }
    } catch (error) {
      console.error("❌ Error cargando estados SIRECQ:", error);
      setEstadosList([{ nombre_estado_requerimiento: "Todos" }]);
    }
  }

  // 🔹 Ejecuta SIEMPRE que entras al módulo SIRECQ
  if (moduloActivo === "sirecq" && token) {
    loadEstados();
  }
}, [moduloActivo, token]);



  const getColoresEstadoPorModulo = (modulo) => {
  switch (modulo) {
    // ✅ INCIDENTES: solo dos estados
    case "incidentes":
      return {
        FAVORABLE: "#22C55E", // Verde
        PENDIENTE: "#3B82F6", // Azul
      };

    // ✅ ACCIDENTES: mostrar todos los posibles estados institucionales
    case "accidentes":
      return {
        FAVORABLE: "#34D399", // Verde esmeralda
        PENDIENTE: "#60A5FA", // Azul
        DEVUELTO: "#F59E0B", // Amarillo fuerte
        NEGADO: "#EF4444", // Rojo
        CANCELADO: "#9CA3AF", // Gris
        "EN TRÁMITE": "#C084FC", // Morado
        REINGRESO: "#22D3EE", // Celeste
        "SIN ESTADO": "#CBD5E1", // Gris claro
      };

    // ✅ EXTERNOS: eliminar "SIN ESTADO"
    case "externos":
      return {
        ENVIADO: "#FACC15", // Amarillo
        DEVUELTO: "#F87171", // Rojo
        "EN REVISIÓN": "#C084FC", // Morado
        FAVORABLE: "#22C55E", // Verde
        PENDIENTE: "#3B82F6", // Azul
        CANCELADO: "#9CA3AF", // Gris
      };

    // ✅ TEST PRODUCCIÓN
    case "testproduccion":
      return {
        EN_PROCESO: "#A78BFA", // Morado
        FINALIZADO: "#F97316", // Naranja
        PENDIENTE: "#60A5FA", // Azul
        "SIN ESTADO": "#CBD5E1",
      };

    // ✅ SIRECQ
case "sirecq":
  return {
    ENVIADO: "#38BDF8",          // 🔵 nuevo color (azul cielo)
    DEVUELTO: "#F87171",         // rojo
    "EN REVISIÓN": "#A78BFA",    // morado
    ATENDIDO: "#EAB308",         // amarillo
  };

    // Por defecto (seguridad)
    default:
      return { "SIN ESTADO": "#D1D5DB" };
  }
};

  // Cargar datos según módulo
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let res;
      try {
        if (moduloActivo === "incidentes") {
        res = await listIncidentes({ token, page: 1, pageSize: 10000 });

        console.log("📦 Datos incidentes:", res);

        // Detecta automáticamente el campo que contiene los registros
        const datos =
          res.items ||
          res.data ||
          res.rows ||
          (Array.isArray(res) ? res : []) ||
          [];

        setItems(datos);
      }
 else if (moduloActivo === "accidentes") {
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
      const [estadoFiltros, setEstadoFiltros] = useState({
      incidentes: "Todos",
      accidentes: "Todos",
      externos: "Todos",
      testproduccion: "Todos",
      sirecq: "Todos",
    });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const estadoFiltroActivo = estadoFiltros[moduloActivo] || "Todos";

   useEffect(() => {
    setEstadoFiltros((prev) => ({
      ...prev,
      [moduloActivo]: "Todos",
    }));
  }, [moduloActivo]);


 const filteredItems = useMemo(() => {
  if (!Array.isArray(items)) return [];
  const estadoFiltro = (estadoFiltros[moduloActivo] || "").toUpperCase().trim();

  if (!estadoFiltro || estadoFiltro === "TODOS" || estadoFiltro === "TODAS") {
    return items;
  }

  if (moduloActivo === "testproduccion") {
    return items.filter((r) =>
      (r.etapa_implementation || r.etapa || "").toUpperCase().includes(estadoFiltro)
    );
  }

  // ✅ SIRECQ: usar SIEMPRE el estado de Requerimiento (NO row.estado)
  if (moduloActivo === "sirecq") {
    const getEstadoSirecq = (r) =>
      r?.sirecqExterno?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
      r?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
      "SIN ESTADO";

    return items.filter((r) => getEstadoSirecq(r).toUpperCase().trim() === estadoFiltro);
  }

  // Otros módulos (igual que antes)
  return items.filter((i) => {
    const estado =
      i.estado ||
      i.estado_tramite ||
      i.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
      i.requerimiento?.estadoRequerimiento?.nombre_estado || "";
    return estado.toUpperCase().trim() === estadoFiltro;
  });
}, [items, estadoFiltros, moduloActivo]);





  // Paginación
  const totalPages = Math.min(5, Math.max(1, Math.ceil(filteredItems.length / pageSize)));

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

// ✅ Calcular estadísticas completas (con filtro activo o "Todos")
// ✅ Calcular estadísticas completas (con filtro activo o "Todos")
useEffect(() => {
  // 🔹 Si hay datos, tomamos la fuente según el filtro actual
  const fuenteDatos =
    estadoFiltros[moduloActivo] === "Todas" ||
    estadoFiltros[moduloActivo] === "Todos"
      ? items
      : filteredItems;

  const total = fuenteDatos.length;
  const porEstado = {};
  const porMes = {};

  // 🔹 Caso especial: módulo Test/Producción
  if (moduloActivo === "testproduccion") {
  // 🔹 Inicializamos las etapas para que siempre existan
  const etapas = ["Test", "Producción", "Sin etapa"];
  etapas.forEach((e) => (porEstado[e] = 0));

  fuenteDatos.forEach((r) => {
    const etapa =
      r.etapa_implementation ||
      r.etapa ||
      "Sin etapa";

    const etapaNorm = etapa.trim().toLowerCase();

    if (etapaNorm.includes("test")) porEstado["Test"]++;
    else if (etapaNorm.includes("produc")) porEstado["Producción"]++;
    else porEstado["Sin etapa"]++;

    const fecha = r.fechaenvioreq || r.fecha_envio || r.fecha;
    if (fecha) {
      const mes = new Date(fecha).toLocaleString("es-EC", {
        month: "long",
        year: "numeric",
      });
      porMes[mes] = (porMes[mes] || 0) + 1;
    }
  });

  // 🔹 Aseguramos que las claves estén siempre presentes (incluso si valen 0)
  etapas.forEach((e) => {
    if (!porEstado[e]) porEstado[e] = 0;
  });
}
else {
  if (moduloActivo === "sirecq") {
  const getEstadoSirecq = (r) =>
    r?.sirecqExterno?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
    r?.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
    "SIN ESTADO";

  const estadosValidos = estadosList
    .map((e) => e.nombre_estado_requerimiento?.toUpperCase())
    .filter(Boolean);

  estadosValidos.forEach((e) => (porEstado[e] = 0));

  fuenteDatos.forEach((r) => {
    const est = getEstadoSirecq(r).toUpperCase().trim();
    if (porEstado.hasOwnProperty(est)) porEstado[est]++;

    const fecha = r.fecha_env_dmc || null;

      // ✅ Solo contar si la fecha existe y es válida (igual que en tu módulo Sirecq.jsx)
      if (fecha && !["", "null", "undefined"].includes(fecha.toString().trim())) {
        const dateObj = new Date(fecha);
        if (!isNaN(dateObj.getTime())) {
          const mes = dateObj.toLocaleString("es-EC", { month: "long", year: "numeric" });
          porMes[mes] = (porMes[mes] || 0) + 1;
        }
      }


  });

  setStats({ total, porEstado, porMes });
  return; // 👈 importante
}


  // 🔹 Módulos normales (flujo general)
  const coloresModulo = getColoresEstadoPorModulo(moduloActivo);
  Object.keys(coloresModulo).forEach((estado) => {
    porEstado[estado] = 0;
  });

  fuenteDatos.forEach((i) => {
    let estado =
      i.estado ||
      i.estado_tramite ||
      i.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
      i.requerimiento?.estadoRequerimiento?.nombre_estado ||
      "SIN ESTADO";

    estado = estado
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

    if (porEstado.hasOwnProperty(estado)) porEstado[estado]++;

    const fecha =
      i.fecha || i.fecha_registro || i.requerimiento?.fecha_registro;
    if (fecha) {
      const mes = new Date(fecha).toLocaleString("es-EC", {
        month: "long",
        year: "numeric",
      });
      porMes[mes] = (porMes[mes] || 0) + 1;
    }
  });

  setStats({ total, porEstado, porMes });
}


  setStats({ total, porEstado, porMes });
}, [items, filteredItems, estadoFiltros, moduloActivo]);


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



// 🟢 Generar dataset dinámico por estado (con colores de módulo)
const coloresEstado = getColoresEstadoPorModulo(moduloActivo);

// 🎨 Paleta personalizada para el módulo Test/Producción
const coloresEtapasTestProd = {
  Test: "#facc15",        // Amarillo dorado
  Producción: "#22c55e",  // Verde esmeralda
  "Sin etapa": "#94a3b8", // Gris neutro
};

// Si no es testproducción, usa los colores por módulo normales
const coloresFinal =
  moduloActivo === "testproduccion"
    ? coloresEtapasTestProd
    : getColoresEstadoPorModulo(moduloActivo);

// 🔹 Filtramos “Todos” antes de construir el dataset
const estadosFiltrados = Object.entries(stats.porEstado).filter(
  ([estado]) => !["TODOS", "TODAS"].includes(estado.toUpperCase().trim())
);

    const doughnutData = {
      labels: estadosFiltrados.map(([estado]) => estado),
      datasets: [
        {
          data: estadosFiltrados.map(([_, cantidad]) => cantidad),
          backgroundColor: estadosFiltrados.map(
            ([estado]) => coloresFinal[estado] || "#E5E7EB"
          ),
          borderColor: "#fff",
          borderWidth: 2,
          hoverOffset: 10,
          spacing: 3,
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
          onClick={() => {
            setModuloActivo("incidentes");
            setPage(1); // opcional pero recomendado
            setEstadoFiltros((prev) => ({ ...prev, incidentes: "Todos" }));
          }}
          className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-50 border border-gray-300 text-green-600"
        >
          <Activity className="w-5 h-5" />
          <span>Incidentes</span>
        </button>

          <button
          onClick={() => {
            setModuloActivo("accidentes");
            setPage(1);
            setEstadoFiltros((prev) => ({ ...prev, accidentes: "Todos" }));
          }}
          className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-50 border border-gray-300 text-blue-600"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Accidentes</span>
        </button>

          <button
          onClick={() => {
            setModuloActivo("externos");
            setPage(1);
            setEstadoFiltros((prev) => ({ ...prev, externos: "Todos" }));
          }}
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
              onFiltroChange={(nuevoEstado) => {
                setEstadoFiltros((prev) => ({
                  ...prev,
                  [moduloActivo]: nuevoEstado, // ✅ solo cambia el filtro de ese módulo
                }));
                setPage(1);
              }}
            />


            )}

            {moduloActivo === "accidentes" && (
            <TablaAccidentes
              items={paginatedItems}
              loading={loading}
              onFiltroChange={(nuevoEstado) => {
                setEstadoFiltros((prev) => ({
                  ...prev,
                  [moduloActivo]: nuevoEstado, // ✅ independiente
                }));
                setPage(1);
              }}
            />
          )}

          {moduloActivo === "externos" && (
            <TablaExternos
              items={paginatedItems}
              loading={loading}
              onFiltroChange={(nuevoEstado) => {
                setEstadoFiltros((prev) => ({
                  ...prev,
                  [moduloActivo]: nuevoEstado,
                }));
                setPage(1);
              }}
            />
          )}

          {moduloActivo === "testproduccion" && (
          <TablaTestProduccion
            items={paginatedItems}  // ✅ usa los datos paginados globales
            loading={loading}
            colorHeader="#8B5CF6"
            onFiltroChange={(nuevoEstado) => {
              setEstadoFiltros((prev) => ({
                ...prev,
                [moduloActivo]: nuevoEstado,
              }));
              setPage(1);
            }}
          />
        )}

        {moduloActivo === "sirecq" && (
        <TablaSirecq
          items={paginatedItems}
          loading={loading}
          estado={estadoFiltros.sirecq}
          estadosList={estadosList}   // 👈 nuevo prop
          onFiltroChange={(nuevoEstado) => {
            setEstadoFiltros((prev) => ({ ...prev, [moduloActivo]: nuevoEstado }));
            setPage(1);
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
            {/* Tarjetas de estadísticas */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
  {/* ✅ Tarjeta Total registros solo visible en Test Producción */}
  {moduloActivo === "testproduccion" && (
    <div className="rounded-lg shadow p-3 flex flex-col items-center justify-center text-white font-bold bg-gradient-to-r from-purple-500 to-purple-700">
      <div className="text-2xl">{stats.total}</div>
      <div className="text-xs font-semibold">Total registros</div>
    </div>
  )}

  {/* 🔹 Tarjeta total para otros módulos (se mantiene igual que antes) */}
  {moduloActivo !== "testproduccion" &&
    estadoFiltroActivo === "Todos" && (
      <div className="rounded-lg shadow p-3 flex flex-col items-center justify-center text-white font-bold bg-gradient-to-r from-blue-400 to-blue-600">
        <div className="text-2xl">{stats.total}</div>
        <div className="text-xs font-semibold">Total registros</div>
      </div>
    )}

  {/* 🔹 Render dinámico de las tarjetas según el filtro */}
{Object.entries(stats.porEstado)
  // ⛔️ Oculta “Todos” o “TODOS”
  .filter(([estado]) => !["TODOS", "TODAS"].includes(estado.toUpperCase().trim()))
  .filter(([estado, cantidad]) =>
    ["Todos", "Todas"].includes(estadoFiltroActivo)
      ? true
      : estado.toUpperCase().trim() === estadoFiltroActivo.toUpperCase().trim()
  )
  .map(([estado, cantidad], idx) => {
    const coloresPorModulo = {
      incidentes: ["#22C55E", "#3B82F6"],
      accidentes: ["#34D399", "#60A5FA", "#F59E0B", "#EF4444", "#9CA3AF"],
      externos: ["#FACC15", "#F87171", "#C084FC", "#22C55E", "#3B82F6"],
      testproduccion: ["#FACC15", "#22C55E", "#94A3B8"],
      sirecq: ["#3B82F6", "#8B5CF6", "#22C55E", "#FACC15"],
    };

    const coloresActivos = coloresPorModulo[moduloActivo] || ["#9CA3AF"];
    const colorInicio = coloresActivos[idx % coloresActivos.length];
    const colorFin =
      coloresActivos[(idx + 1) % coloresActivos.length] || "#6B7280";

    return (
      <div
        key={estado}
        className="rounded-lg shadow p-3 flex flex-col items-center justify-center text-white font-bold"
        style={{
          background: `linear-gradient(90deg, ${colorInicio}, ${colorFin})`,
        }}
      >
        <div className="text-xl">{cantidad}</div>
        <div className="text-xs font-semibold">{estado}</div>
      </div>
    );
  })}

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