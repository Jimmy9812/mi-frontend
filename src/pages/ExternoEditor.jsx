// src/pages/ExternosEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getExterno, createExterno, updateExterno } from "../services/externosService";
import GifLoader from "../components/LoadingGif";

// Mapeos de opciones basados en IDs
const sistemas = [
  { id: 1, name: "SIREC-Q" },
  { id: 2, name: "STL" },
  { id: 4, name: "SUIM" },
  { id: 5, name: "CERTIFICADOS" },
  { id: 3, name: "DBB" }
];

const dependencias = [
  { id: 1, name: "DMSIST" },
  { id: 2, name: "DMC" },
  { id: 3, name: "DMF" }
];

const estados = [
  { id: 1, name: "Enviado" },
  { id: 2, name: "Devuelto" },
  { id: 3, name: "Test" },
  { id: 4, name: "Producción" },
  { id: 5, name: "En revisión" },
  { id: 6, name: "Atendido" }
];

const sistemaMap = sistemas.reduce((acc, s) => ({ ...acc, [s.name]: s.id }), {});
const dependenciaMap = dependencias.reduce((acc, d) => ({ ...acc, [d.name]: d.id }), {});
const estadoMap = estados.reduce((acc, e) => ({ ...acc, [e.name]: e.id }), {});

export default function ExternosEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [externo, setExterno] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(true);

  // ======================= CARGAR DATOS =========================
  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setExterno({});
        setLoading(false);
        return;
      }

      try {
        const res = await getExterno(id);

        const mapped = {
          id_sirecq_externo: res.id_sirecq_externo,
          numero: res.requerimiento?.no_requerimiento ?? "",
          descripcion: res.requerimiento?.descripcion ?? "",
          clasificacion:
            res.requerimiento?.categoria?.siglas_categoria ||
            res.requerimiento?.categoria?.nom_categoria ||
            "",
          id_categoria: res.requerimiento?.categoria?.id_categoria || null,
          sistema: res.requerimiento?.sistema?.nom_sistema || "",
          id_sistema: res.requerimiento?.sistema?.id_sistema || null,
          estado:
            res.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento || "",
          id_estado_requerimiento:
            res.requerimiento?.estadoRequerimiento?.id_estado_requerimiento || null,
          seguimiento: res.seguimientoinst ?? "",
          responsable: res.requerimiento?.rolUsuario?.usuario
            ? `${res.requerimiento.rolUsuario.usuario.nombre_usuario} ${res.requerimiento.rolUsuario.usuario.apellidos_usuario}`
            : "",
          tramite_pr: res.tramitepr ?? "",
          tramite_cat: res.tramitecat ?? "",
          dependencia: res.dependencia?.nombre_dependencia || "",
          id_dependencia: res.dependencia?.id_dependencia || null,
          oficio_despacho:
            res.requerimiento?.requerimientoVersiones?.[0]?.versionamiento?.ofi_desp_pt ||
            "",
          oficio_dmi:
            res.requerimiento?.requerimientoVersiones?.[0]?.versionamiento?.oficioenviodmi || "",
          fecha_despacho:
            res.requerimiento?.requerimientoVersiones?.[0]?.versionamiento?.fech_desp_pt
              ? new Date(
                  res.requerimiento.requerimientoVersiones[0].versionamiento.fech_desp_pt
                )
                  .toISOString()
                  .split("T")[0]
              : "",
          fecha_envio_requerimiento:
            res.requerimiento?.requerimientoVersiones?.[0]?.versionamiento
              ?.fechaenvioreq
              ? new Date(
                  res.requerimiento.requerimientoVersiones[0].versionamiento.fechaenvioreq
                )
                  .toISOString()
                  .split("T")[0]
              : "",
          fecha_envio_dmc: res.requerimiento?.fecha_registro
            ? new Date(res.requerimiento.fecha_registro).toISOString().split("T")[0]
            : "",
          observaciones: res.observacionesgen ?? "",
        };

        setExterno(mapped);
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

  // ======================= HANDLERS =========================
const handleChange = (e) => {
  const { name, value } = e.target;
  setExterno((prev) => {
    if (name === "sistema") {
      return { ...prev, sistema: value, id_sistema: sistemaMap[value] || 1 };
    }
    if (name === "dependencia") {
      return { ...prev, dependencia: value, id_dependencia: dependenciaMap[value] || 1 };
    }
    if (name === "estado") {
      return { ...prev, estado: value, id_estado_requerimiento: estadoMap[value] || 1 };
    }

    return { ...prev, [name]: value };
  });
};


  // Construir payload compatible con Create y Update
  function buildPayload(externo, user, isUpdate = false) {
    const baseRequerimiento = {
      no_requerimiento: externo.numero || "",
      documento: "REQ-EXT",
      tema: externo.descripcion?.slice(0, 50) || "Tema externo",
      descripcion: externo.descripcion || "",
      fase: "Requisito",
      id_estado_requerimiento: externo.id_estado_requerimiento || 1,
      id_categoria: externo.id_categoria || 1,
      id_sistema: externo.id_sistema || 1,
      id_rol_usuario: user?.id_rol_usuario || null,
    };

    const baseVersionamiento = {
      num_version: 1,
      ofi_desp_pt: externo.oficio_despacho || null,
      oficioenviodmi: externo.oficio_dmi || null,
      fech_desp_pt: externo.fecha_despacho || null,
      fechaenvioreq: externo.fecha_envio_requerimiento || null,
    };

    const baseSirecq = {
      tramitepr: externo.tramite_pr || "",
      seguimientoinst: externo.seguimiento || "",
      tramitecat: externo.tramite_cat || "",
      observacionesgen: externo.observaciones || "",
      id_dependencia: externo.id_dependencia || 1,
    };

    if (isUpdate) {
      return {
        sirecqExterno: baseSirecq,
        requerimiento: baseRequerimiento,
        versionamiento: baseVersionamiento,
      };
    }

    return {
      ...baseSirecq,
      requerimiento: {
        ...baseRequerimiento,
        versiones: [baseVersionamiento],
      },
    };
  }

  const handleSave = async () => {
    try {
      const payload = buildPayload(externo, user, mode !== "create");
      console.log("🧾 Payload final:", payload);

      if (mode === "create") {
        await createExterno({ token, payload });
        alert("✅ Requerimiento externo creado correctamente");
        navigate("/externos");
      } else {
        await updateExterno({ token, id, payload });
        alert("✅ Requerimiento externo actualizado correctamente");
        setEditMode(false);
      }
    } catch (err) {
      console.error("❌ Error al guardar externo:", err);
      alert("Ocurrió un error al guardar el requerimiento externo.");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!externo) return <div className="p-6">No encontrado</div>;

  const isCreate = mode === "create";
  const isView = mode === "view";

  // ======================= RENDER =========================
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

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

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

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* ================= SECCIÓN 1 ================= */}
      <div className="px-6 mb-6">
        <div className="border rounded-lg p-4 grid grid-cols-4 gap-6">
          <EditableField
            label="N° Requerimiento"
            name="numero"
            value={externo.numero || ""}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <DateField
            label="Fecha de registro"
            name="fecha_envio_dmc"
            value={externo.fecha_envio_dmc}
            onChange={() => {}}
            editMode={false}
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
                {externo.descripcion || ""}
              </div>
            )}
          </div>

          <PaintedPicker
            label="Sistema Afectar"
            editMode={editMode || isCreate}
            kind="select"
            name="sistema"
            value={externo.sistema || ""}
            onChange={handleChange}
            options={sistemas.map(s => s.name)}
          />

          <EditableField
            label="Seguimiento Institucional"
            name="seguimiento"
            value={externo.seguimiento || ""}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Responsable (Analista Catastral)"
            name="responsable"
            value={externo.responsable || ""}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Trámite priorizado relacionado"
            name="tramite_pr"
            value={externo.tramite_pr || ""}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <EditableField
            label="Trámite CAT"
            name="tramite_cat"
            value={externo.tramite_cat || ""}
            onChange={handleChange}
            editMode={editMode || isCreate}
          />

          <PaintedPicker
            label="Dependencia"
            editMode={editMode || isCreate}
            kind="select"
            name="dependencia"
            value={externo.dependencia || ""}
            onChange={handleChange}
            options={dependencias.map(d => d.name)}
          />
        </div>
      </div>

      {/* ================= SECCIÓN 2 ================= */}
      <div className="px-6">
        <div className="border rounded-lg p-4 grid grid-cols-4 gap-6">
          <EditableField
            label="Oficio despacho propuesta técnica"
            name="oficio_despacho"
            value={externo.oficio_despacho || ""}
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

          <PaintedPicker
            label="Estado del requerimiento"
            editMode={editMode || isCreate}
            kind="select"
            name="estado"
            value={externo.estado || ""}
            onChange={handleChange}
            options={estados.map(e => e.name)}
          />

          <div className="row-span-2">
            <label className="block text-sm font-semibold mb-1">Observaciones Generales</label>
            {editMode || isCreate ? (
              <textarea
                name="observaciones"
                value={externo.observaciones || ""}
                onChange={handleChange}
                className="w-full p-3 border rounded bg-gray-50 h-48 resize-none overflow-y-auto"
                placeholder="Escribe tus observaciones aquí..."
              />
            ) : (
              <div
                className="w-full h-48 p-3 rounded bg-[#f1f5f9] text-gray-800 overflow-y-auto border"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {externo.observaciones || ""}
              </div>
            )}
          </div>

          <EditableField
            label="Oficios de envío a DMI"
            name="oficio_dmi"
            value={externo.oficio_dmi || ""}
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
        </div>
      </div>

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

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
        <div className="w-full p-2 rounded bg-[#f1f5f9] text-gray-800">{value || ""}</div>
      )}
    </div>
  );
}

function PaintedPicker({ label, editMode, kind = "select", name, value, onChange, options = [], inputWidth = "w-[96px]" }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-2 py-2 text-gray-800">
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
        <div className="w-full p-2 rounded bg-[#f1f5f9] text-gray-800">{value || ""}</div>
      )}
    </div>
  );
}