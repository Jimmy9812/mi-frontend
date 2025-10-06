// src/pages/ExternosEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getExterno, createExterno, updateExterno } from "../services/externosService";
import GifLoader from "../components/LoadingGif";

// Opciones mock (se reemplazarán por catálogo backend)
const OPT_SISTEMAS = ["SIREC-Q", "SIGMUNIC", "RSW"];
const OPT_CLASIF = ["A", "B", "C", "D"];
const OPT_DEP = ["DMSIST", "DMI", "DMC"];

export default function ExternosEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [externo, setExterno] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setExterno({});
        setLoading(false);
        return;
      }
      try {
        const res = await getExterno(id);
        setExterno(res);
      } catch (err) {
        console.error("❌ Error en getExterno:", err);
        alert("No se pudo cargar el requerimiento externo");
        navigate("/externos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, mode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExterno((prev) => ({ ...prev, [name]: value }));
  };

  // Construir payload compatible con CreateSirecqExternoDto
  function buildPayload(externo) {
    // Mapear campos planos y anidados
    return {
      requerimiento: {
        no_requerimiento: externo.numero,
        descripcion: externo.descripcion,
        // Agrega aquí los campos requeridos por CreateRequerimientoDto
        // Ejemplo:
        // documento, tema, fase, id_estado_requerimiento, id_categoria, id_sistema, id_rol_usuario, versiones
        // Puedes mapearlos desde el formulario si los tienes
      },
      tramitepr: externo.tramite_pr,
      seguimientoinst: externo.seguimiento,
      tramitecat: externo.tramite_cat,
      observacionesgen: externo.observaciones,
      id_dependencia: externo.dependencia ? Number(externo.dependencia) : undefined,
    };
  }

  const handleSave = async () => {
    try {
      const payload = buildPayload(externo);
      if (mode === "create") {
        await createExterno({ token: user?.token, payload });
        alert("Requerimiento externo creado");
        navigate("/externos");
      } else {
        await updateExterno({ token: user?.token, id, payload });
        alert("Requerimiento externo actualizado");
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!externo) return <div className="p-6">No encontrado</div>;

  const isCreate = mode === "create";
  const isView = mode === "view";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-[#5b0f2c]"
        >
          <ArrowLeft className="w-5 h-5" /> Atrás
        </button>
        <span className="text-sm font-semibold">
          {user?.nombre_usuario || user?.name || user?.email || "Usuario"}
        </span>
      </div>

      {/* Línea superior */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Encabezado con fondo claro y botones */}
      <div className="px-6 mt-2 mb-4">
        <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3">
          <span className="font-bold text-[#3F6592] text-lg tracking-wide">
            EXTERNOS SIREC-Q
          </span>
          <div className="flex gap-2">
            {!isCreate && isView && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 bg-[#3F6592] text-white rounded hover:bg-[#335174] transition"
                title="Editar"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {(editMode || isCreate) && (
              <button
                onClick={handleSave}
                className="p-2 bg-[#3F6592] text-white rounded hover:bg-[#335174] transition"
                title="Guardar"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Línea debajo del título */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* ================= SECCIÓN 1 ================= */}
      <div className="px-6 mb-6">
        <div className="border rounded-lg p-4 grid grid-cols-4 gap-6">
          <EditableField
            label="N° Requerimiento"
            name="numero"
            value={externo.numero}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <PaintedPicker
            label="Prioridad"
            editMode={editMode || isCreate}
            kind="number"
            name="prioridad"
            value={externo.prioridad}
            onChange={handleChange}
            inputWidth="w-[64px]"
          />

          <PaintedPicker
            label="Clasificación catastral"
            editMode={editMode || isCreate}
            kind="select"
            name="clasificacion"
            value={externo.clasificacion}
            onChange={handleChange}
            options={OPT_CLASIF}
            inputWidth="w-[86px]"
          />

          <div className="row-span-3">
            <label className="block text-sm font-semibold mb-1">Descripción</label>
            {editMode || isCreate ? (
              <textarea
                name="descripcion"
                value={externo.descripcion || ""}
                onChange={handleChange}
                className="w-full p-3 border rounded bg-gray-50"
                rows={6}
              />
            ) : (
              <div className="w-full min-h-[160px] p-3 rounded bg-[#f1f5f9] text-gray-800">
                {externo.descripcion || "-"}
              </div>
            )}
          </div>

          <PaintedPicker
            label="Sistema Afectar"
            editMode={editMode || isCreate}
            kind="select"
            name="sistema"
            value={externo.sistema}
            onChange={handleChange}
            options={OPT_SISTEMAS}
          />

          <EditableField
            label="Seguimiento Institucional"
            name="seguimiento"
            value={externo.seguimiento}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Responsable (Analista Catastral)"
            name="responsable"
            value={externo.responsable}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Trámite priorizado relacionado"
            name="tramite_pr"
            value={externo.tramite_pr}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Trámite CAT"
            name="tramite_cat"
            value={externo.tramite_cat}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <PaintedPicker
            label="Dependencia"
            editMode={editMode || isCreate}
            kind="select"
            name="dependencia"
            value={externo.dependencia}
            onChange={handleChange}
            options={OPT_DEP}
          />
        </div>
      </div>

      {/* ================= SECCIÓN 2 ================= */}
      <div className="px-6">
        <div className="border rounded-lg p-4 grid grid-cols-4 gap-6">
          <EditableField
            label="Oficio despacho propuesta técnica"
            name="oficio_despacho"
            value={externo.oficio_despacho}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Oficios de envío a DMI"
            name="oficio_dmi"
            value={externo.oficio_dmi}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <DateField
            label="Fecha despacho propuesta técnica"
            name="fecha_despacho"
            value={externo.fecha_despacho}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <div className="row-span-2">
            <label className="block text-sm font-semibold mb-1">Observaciones Generales</label>
            {editMode || isCreate ? (
              <textarea
                name="observaciones"
                value={externo.observaciones || ""}
                onChange={handleChange}
                className="w-full p-3 border rounded bg-gray-50"
                rows={6}
              />
            ) : (
              <div className="w-full min-h-[160px] p-3 rounded bg-[#f1f5f9] text-gray-800">
                {externo.observaciones || "-"}
              </div>
            )}
          </div>

          <DateField
            label="Fecha de envío por la DMC"
            name="fecha_envio_dmc"
            value={externo.fecha_envio_dmc}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <DateField
            label="Fecha de envío requerimiento"
            name="fecha_envio_requerimiento"
            value={externo.fecha_envio_requerimiento}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Estado del requerimiento"
            name="estado"
            value={externo.estado}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />
        </div>
      </div>

      {/* Línea inferior */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Footer con GIF */}
      <div className="p-6 flex justify-center">
        <GifLoader />
      </div>
    </div>
  );
}

/* ================= Subcomponentes ================= */

function EditableField({ label, name, value, onChange, editMode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {editMode ? (
        <input
          type="text"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full p-2 border rounded bg-gray-50"
        />
      ) : (
        <div className="w-full p-2 rounded bg-[#f1f5f9] text-gray-800">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function PaintedPicker({
  label,
  editMode,
  kind = "select",
  name,
  value,
  onChange,
  options = [],
  inputWidth = "w-[96px]",
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-2 py-2 text-gray-800">
        <div className="flex-1" />
        {kind === "select" ? (
          <select
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={!editMode}
            className={`${inputWidth} bg-white border rounded px-2 py-1 text-sm disabled:opacity-60`}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            name={name}
            value={value ?? ""}
            onChange={onChange}
            disabled={!editMode}
            className={`${inputWidth} bg-white border rounded px-2 py-1 text-sm text-center disabled:opacity-60`}
          />
        )}
      </div>
    </div>
  );
}

function DateField({ label, name, value, onChange, editMode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {editMode ? (
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full p-2 border rounded bg-gray-50"
        />
      ) : (
        <div className="w-full p-2 rounded bg-[#f1f5f9] text-gray-800">
          {value || "-"}
        </div>
      )}
    </div>
  );
}
