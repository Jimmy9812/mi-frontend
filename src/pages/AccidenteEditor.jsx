import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAccidente,
  createAccidente,
  updateAccidente,
} from "../services/accidentesService";
import { ArrowLeft, Save, Edit, Calendar } from "lucide-react";
import LoadingGif from "../components/LoadingGif";

export default function AccidenteEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [acc, setAcc] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setAcc({});
        setLoading(false);
        return;
      }
      try {
        const res = await getAccidente({ id });
        setAcc(res);
      } catch {
        alert("No se pudo cargar el accidente");
        navigate("/accidentes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, mode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAcc((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (mode === "create") {
        await createAccidente({ payload: acc });
        alert("Accidente creado");
        navigate("/accidentes");
      } else {
        await updateAccidente({ id, payload: acc });
        alert("Accidente actualizado");
        setEditMode(false);
      }
    } catch {
      alert("Error al guardar");
    }
  };

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!acc) return <div className="p-6">No encontrado</div>;

  const disabled = !editMode;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior con Atrás */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-700 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
      </div>

      {/* Línea superior con margen lateral */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Encabezado con fondo claro y botones */}
      <div className="px-6 mt-2 mb-4">
        <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3">
          <span className="font-bold text-[#3F6592] text-lg tracking-wide">
            ACCIDENTES
          </span>

          <div className="flex gap-2">
            {!editMode && mode !== "create" && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded bg-[#3F6592] hover:bg-[#2e4666] text-white"
                title="Editar"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {(editMode || mode === "create") && (
              <button
                onClick={handleSave}
                className="p-2 rounded bg-[#3F6592] hover:bg-[#2e4666] text-white"
                title="Guardar"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Línea inferior con margen lateral */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Contenido – bloques con borde azul */}
      <div className="p-6 space-y-6">
        {/* BLOQUE 1 */}
        <div className="border rounded-xl p-4 space-y-4 border-[#3F6592]">
          <div className="grid grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <Field
                label="Trámite"
                name="tramite"
                value={acc.tramite}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Oficio/Memorando/Mail"
                name="oficio"
                value={acc.oficio}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Técnico responsable"
                name="tecnico_responsable"
                value={acc.tecnico_responsable}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>

            {/* Columna central */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <DateField
                    label="Ingreso del trámite"
                    name="fecha_ingreso_tramite"
                    value={acc.fecha_ingreso_tramite}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <DateField
                    label="Asignación del trámite"
                    name="fecha_asignacion_tramite"
                    value={acc.fecha_asignacion_tramite}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Tipología de trámite"
                  name="tipologia_tramite"
                  value={acc.tipologia_tramite}
                  onChange={handleChange}
                  disabled={disabled}
                />
                <Field
                  label="Inspección"
                  name="inspeccion"
                  value={acc.inspeccion}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <Field
                label="Número interno"
                name="numero_interno"
                value={acc.numero_interno}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Número de documento"
                name="numero_documento"
                value={acc.numero_documento}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Nombre del propietario"
                name="propietario"
                value={acc.propietario}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2 */}
        <div className="border rounded-xl p-4 space-y-4 border-[#3F6592]">
          <div className="grid grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <Field
                label="Número de predio"
                name="numero_predio"
                value={acc.numero_predio}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Clave catastral"
                name="clave_catastral"
                value={acc.clave_catastral}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Parroquia"
                name="parroquia"
                value={acc.parroquia}
                onChange={handleChange}
                disabled={disabled}
              />
              <Field
                label="Estado de trámite"
                name="estado_tramite"
                value={acc.estado_tramite}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>

            {/* Columna central */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4">
                  <DateField
                    label="Fecha"
                    name="fecha_control"
                    value={acc.fecha_control}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <Field
                    label="Control de calidad"
                    name="control_calidad"
                    value={acc.control_calidad}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <Field
                    label="Código consulta/Dato seguro"
                    name="codigo_consulta"
                    value={acc.codigo_consulta}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <TextArea
                label="Observaciones"
                name="observaciones"
                value={acc.observaciones}
                onChange={handleChange}
                disabled={disabled}
                rows={8}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* GIF institucional */}
      <div className="p-6 flex justify-center">
        <LoadingGif />
      </div>
    </div>
  );
}

/* ========= Campos reutilizables ========= */
function Field({ label, name, value, onChange, disabled, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70"
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange, disabled, rows = 4 }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label}
      </label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className="w-full px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70"
      />
    </div>
  );
}

function DateField({ label, name, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label}
      </label>
      <div className="relative">
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full pr-10 px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70"
        />
        <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}
