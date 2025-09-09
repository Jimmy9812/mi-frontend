import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Home, ArrowLeft, Save, Edit3, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getIncidente, createIncidente } from "../services/incidentesService";

const EMPTY = {
  numero: "",
  tecnico: "",
  analista: "",
  unidad_zonal: "",
  fecha_ingreso: "",
  tipologia_tramite: "",
  anio_sirecq: "",
  mensaje_error: "",
  fecha_solucion: "",
  estado: "",
  descripcion: "",
  observaciones: "",
  error_reportado: "",
};

export default function IncidenteEditor({ mode: propMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, hasPermission } = useAuth();

  const canWrite = hasPermission("INCIDENTES_WRITE");
  const mode = useMemo(
    () => (id ? "view" : (propMode || "create")),
    [id, propMode]
  );

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [editing, setEditing] = useState(mode === "create");

  // Cargar incidente si hay id (modo vista/detalle)
  useEffect(() => {
    let ignore = false;
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getIncidente({ token, id });
        if (ignore) return;
        // adapta estos nombres a tu API real
        setForm({
          numero: data.numero ?? "",
          tecnico: data.tecnico ?? "",
          analista: data.analista ?? "",
          unidad_zonal: data.unidad_zonal ?? "",
          fecha_ingreso: data.fecha_ingreso?.slice(0, 10) ?? "",
          tipologia_tramite: data.tipologia_tramite ?? "",
          anio_sirecq: data.anio_sirecq ?? "",
          mensaje_error: data.mensaje_error ?? "",
          fecha_solucion: data.fecha_solucion?.slice(0, 10) ?? "",
          estado: data.estado ?? "",
          descripcion: data.descripcion ?? "",
          observaciones: data.observaciones ?? "",
          error_reportado: data.error_reportado ?? "",
        });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [id, token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!canWrite) return;

    // En modo create: crea y vuelve a la lista.
    if (mode === "create") {
      await createIncidente({ token, payload: form });
      navigate("/incidentes", { replace: true });
      return;
    }

    // Si quieres permitir edición en “view”, aquí llamarías a updateIncidente(...)
    // Por ahora solo volvemos a la lista:
    navigate("/incidentes", { replace: true });
  };

  const field = (label, name, type = "text", extra = {}) => (
    <div className="space-y-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        disabled={loading || (!editing && mode === "view")}
        className="w-full rounded-md border px-3 py-2 bg-white disabled:bg-gray-100"
        {...extra}
      />
    </div>
  );

  const area = (label, name, rows = 4) => (
    <div className="space-y-1">
      <label className="text-sm text-gray-700">{label}</label>
      <textarea
        name={name}
        value={form[name]}
        onChange={onChange}
        rows={rows}
        disabled={loading || (!editing && mode === "view")}
        className="w-full rounded-md border px-3 py-2 bg-white disabled:bg-gray-100"
      />
    </div>
  );

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Columna izquierda - imagen */}
      <div className="h-screen">
        <img src="/iglesia.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Columna derecha */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600">
            <ArrowLeft className="w-5 h-5" /> Atrás
          </button>
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-5 h-5" />
            <Link to="/dashboard" className="hover:underline">Home</Link>
            <span className="text-slate-400">/</span>
            <span className="font-semibold">Incidentes</span>
          </div>

          <div className="flex items-center gap-2">
            {mode === "view" && canWrite && (
              <button
                onClick={() => setEditing((e) => !e)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border"
                title="Editar"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {canWrite && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#7d3d5a] text-white"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
          </div>
        </div>

        {/* Título */}
        <div className="p-6">
          <div className="rounded-lg bg-[#7d3d5a]/10 text-[#7d3d5a] px-5 py-3 font-bold tracking-wide border border-[#7d3d5a]/40">
            INCIDENTES
          </div>
        </div>

        {/* Formulario en 3 columnas (como el diseño) */}
        <div className="px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1 */}
          <div className="rounded-xl border p-4 space-y-4">
            {field("N° de Incidencia", "numero")}
            {field("Técnico responsable", "tecnico")}
            {field("Analista que reporta", "analista")}
            {/* Simulación select unidad */}
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Unidad zonal que reporta</label>
              <select
                name="unidad_zonal"
                value={form.unidad_zonal}
                onChange={onChange}
                disabled={loading || (!editing && mode === "view")}
                className="w-full rounded-md border px-3 py-2 bg-white disabled:bg-gray-100"
              >
                <option value="">Seleccionar</option>
                <option value="NORTE">Norte</option>
                <option value="CENTRO">Centro</option>
                <option value="SUR">Sur</option>
              </select>
            </div>
            {field("Fecha de ingreso del error", "fecha_ingreso", "date", { icon: <Calendar /> })}
          </div>

          {/* Columna 2 */}
          <div className="rounded-xl border p-4 space-y-4">
            {field("Tipología de trámite", "tipologia_tramite")}
            {field("Año Sirec-Q error", "anio_sirecq")}
            {field("Mensaje visualizado del error", "mensaje_error")}
            {field("Fecha Solución", "fecha_solucion", "date")}
            {field("Estado", "estado")}
          </div>

          {/* Columna 3 (áreas) */}
          <div className="rounded-xl border p-4 space-y-4">
            {area("Descripción del error", "descripcion", 4)}
            {area("Observaciones", "observaciones", 3)}
            {area("Error reportado", "error_reportado", 5)}
          </div>
        </div>
      </div>
    </div>
  );
}
