import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getIncidente, createIncidente, updateIncidente } from "../services/incidentesService";
import { ArrowLeft, Save, Edit, CheckCircle } from "lucide-react";
import GifLoader from "../components/LoadingGif";

export default function IncidenteEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incidente, setIncidente] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [resolveMode, setResolveMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setIncidente({});
        setLoading(false);
        return;
      }
      try {
        const res = await getIncidente({ id });
        setIncidente(res);
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el incidente");
        navigate("/incidentes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, mode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIncidente((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (mode === "create") {
        await createIncidente({ payload: incidente });
        alert("Incidente creado");
        navigate("/incidentes");
      } else if (resolveMode) {
        await updateIncidente({
          id,
          payload: {
            mensaje_error: incidente.mensaje_error,
            fecha_solucion: incidente.fecha_solucion,
            observaciones: incidente.observaciones,
          },
        });
        alert("Incidente resuelto");
        setResolveMode(false);
      } else {
        await updateIncidente({ id, payload: incidente });
        alert("Incidente actualizado");
      }
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!incidente) return <div className="p-6">No encontrado</div>;

  const isCreate = mode === "create";
  const isView = mode === "view";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" /> Atrás
        </button>

        {/* Botones dinámicos */}
        <div className="flex gap-2">
          {!isCreate && isView && !editMode && !resolveMode && (
            <button
              onClick={() => setEditMode(true)}
              className="p-2 bg-yellow-500 rounded hover:bg-yellow-600"
              title="Editar"
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Botón de resolver solo si está pendiente */}
          {!isCreate && isView && incidente.estado === "PENDIENTE" && !resolveMode && (
            <button
              onClick={() => setResolveMode(true)}
              className="p-2 bg-blue-600 rounded hover:bg-blue-700"
              title="Resolver"
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </button>
          )}

          {(editMode || resolveMode) && (
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 rounded hover:bg-green-700"
              title="Guardar"
            >
              <Save className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Línea superior */}
      <div className="h-[2px] bg-[#5b0f2c] mt-2 mb-4"></div>

      {/* Contenido principal */}
      <div className="flex flex-col gap-4 p-6">
        <div className="rounded-lg bg-[#7d3d5a] text-white px-5 py-3 font-bold tracking-wide shadow">
          INCIDENTES
        </div>

        {/* Formulario en columnas */}
        <div className="grid grid-cols-3 gap-4">
          {/* Columna 1 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="N° De Incidencia" name="numero" value={incidente.numero} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Técnico responsable" name="tecnico" value={incidente.tecnico} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Analista que reporta" name="analista" value={incidente.analista} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Unidad zonal que reporta" name="unidad_zonal" value={incidente.unidad_zonal} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Fecha de ingreso del error" name="fecha_ingreso" value={incidente.fecha_ingreso} onChange={handleChange} type="date" disabled={!editMode && !isCreate} />
          </div>

          {/* Columna 2 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="Tipología de trámite" name="tipologia_tramite" value={incidente.tipologia_tramite} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Año Sirec-Q error" name="anio_sirecq" value={incidente.anio_sirecq} onChange={handleChange} disabled={!editMode && !isCreate} />

            {/* Campos fase 2 */}
            {(!isCreate || resolveMode) && (
              <>
                <Field label="Mensaje visualizado del error" name="mensaje_error" value={incidente.mensaje_error} onChange={handleChange} disabled={!resolveMode} />
                <Field label="Fecha Solución" name="fecha_solucion" value={incidente.fecha_solucion} onChange={handleChange} type="date" disabled={!resolveMode} />
              </>
            )}
          </div>

          {/* Columna 3 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="Descripción del error" name="descripcion" value={incidente.descripcion} onChange={handleChange} textarea disabled={!editMode && !isCreate} />

            {/* Campo Observaciones solo en fase 2 */}
            {(!isCreate || resolveMode) && (
              <Field label="Observaciones" name="observaciones" value={incidente.observaciones} onChange={handleChange} textarea disabled={!resolveMode} />
            )}

            <Field label="Error reportado" name="error_reportado" value={incidente.error_reportado} onChange={handleChange} textarea disabled={!editMode && !isCreate} />
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="h-[2px] bg-[#5b0f2c] mt-6"></div>

      {/* Footer con GIF */}
      <div className="p-6 flex justify-center">
        <GifLoader />
      </div>
    </div>
  );
}

/* Subcomponente */
function Field({ label, name, value, onChange, disabled, textarea, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2 border rounded bg-gray-50 disabled:opacity-70"
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2 border rounded bg-gray-50 disabled:opacity-70"
        />
      )}
    </div>
  );
}
