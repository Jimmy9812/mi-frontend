// src/pages/ExternosEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Trash} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getExterno, createExterno, updateExterno, addVersionToRequerimiento, deleteExterno } from "../services/externosService";
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


function AlertModal({ open, message, onClose, type = "info" }) {
  if (!open) return null;

  let color = "#3F6592", icon = null;
  if (type === "success") {
    color = "#22c55e";
    icon = (
      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    );
  } else if (type === "error") {
    color = "#ef4444";
    icon = (
      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
      </svg>
    );
  } else if (type === "warning") {
    color = "#f59e42";
    icon = (
      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(63,101,146,0.10)' }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] flex flex-col items-center border"
        style={{ borderColor: color }}>
        {icon}
        <div className="mb-4 text-center font-semibold" style={{ color }}>{message}</div>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 rounded bg-[#3F6592] text-white hover:bg-[#27466a] shadow"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}



export default function ExternosEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [externo, setExterno] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(true);


  // ======================= ALERTAS =========================
const [alert, setAlert] = useState({ open: false, message: "", type: "info" });
const showAlert = (message, type = "info") => setAlert({ open: true, message, type });
const closeAlert = () => setAlert({ open: false, message: "", type: "info" });






  // ======================= CARGAR DATOS =========================
  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setExterno({

          numero: "",
          descripcion: "",
          sistema: "",
          dependencia: "",
          estado: "",
          tramite_pr: "",
          tramite_cat: "",
          seguimiento: "",
          responsable: "",
          observaciones: "",


        });
        setVersiones([{ num_version: 1, ofi_desp_pt: '', fech_desp_pt: '', oficioenviodmi: '', fechaenvioreq: '', obs_version: '', isLoaded: false }]);
        setLoading(false);
        return;
      }

      try {
        const res = await getExterno(id);

        const mapped = {
          id_sirecq_externo: res.id_sirecq_externo,
          requerimientoId: res.requerimiento?.id_requerimiento || null,
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
          dependencia: res.dependencia?.sigla_dependencia || "",
          id_dependencia: res.dependencia?.id_dependencia || null,
          fecha_envio_dmc: res.requerimiento?.fecha_registro
            ? new Date(res.requerimiento.fecha_registro).toISOString().split("T")[0]
            : "",
          observaciones: res.observacionesgen ?? "",
        };

        const loaded = res.requerimiento?.requerimientoVersiones?.map(v => ({
          ...v.versionamiento,
          isLoaded: true,
          fech_desp_pt: v.versionamiento.fech_desp_pt ? new Date(v.versionamiento.fech_desp_pt).toISOString().split('T')[0] : '',
          fechaenvioreq: v.versionamiento.fechaenvioreq ? new Date(v.versionamiento.fechaenvioreq).toISOString().split('T')[0] : ''
        })) || [];

        if (loaded.length === 0) {
          loaded.push({ num_version: 1, ofi_desp_pt: '', fech_desp_pt: '', oficioenviodmi: '', fechaenvioreq: '', obs_version: '', isLoaded: false });
        }

        setExterno(mapped);
        setVersiones(loaded);
      } catch (err) {
        console.error("❌ Error en getExterno:", err);
        showAlert("No se pudo cargar el requerimiento externo");
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

  const handleVersionChange = (index, field, value) => {
    setVersiones(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleAddVersion = () => {
    const loadedVersions = versiones.filter(v => v.isLoaded);
    const maxVersion = loadedVersions.length > 0 ? Math.max(...loadedVersions.map(v => v.num_version || 0)) : 0;
    const nextVersion = maxVersion + 1;
    setVersiones(prev => [...prev, { num_version: nextVersion, ofi_desp_pt: '', fech_desp_pt: '', oficioenviodmi: '', fechaenvioreq: '', obs_version: '', isLoaded: false }]);
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
      id_rol_usuario: user?.id_rol_usuario || 1,
    };

    const baseSirecq = {
      tramitepr: externo.tramite_pr || "",
      seguimientoinst: externo.seguimiento || "",
      tramitecat: externo.tramite_cat || "",
      observacionesgen: externo.observaciones || "",
      id_dependencia: externo.id_dependencia || 1,
    };

    if (isUpdate) {
      // 🆕 Filtrar solo las versiones que YA EXISTÍAN (isLoaded = true)
      const versionesExistentes = versiones.filter(v => v.isLoaded);
      
      // 🆕 Mapear todas las versiones existentes para enviarlas al backend
      const versionesActualizadas = versionesExistentes.map(v => ({
        id_version: v.id_version,
        ofi_desp_pt: v.ofi_desp_pt || null,
        fech_desp_pt: v.fech_desp_pt || null,
        oficioenviodmi: v.oficioenviodmi || null,
        fechaenvioreq: v.fechaenvioreq || null,
        obs_version: v.obs_version || null
      }));

      return {
        sirecqExterno: baseSirecq,
        requerimiento: {
          ...baseRequerimiento,
          versionesActualizadas: versionesActualizadas // 👈 Enviar array de versiones
        }
      };
    }

    const v1 = versiones[0] || {};
    return {
      ...baseSirecq,
      requerimiento: {
        ...baseRequerimiento,
        versiones: [{
          num_version: 1,
          ofi_desp_pt: v1.ofi_desp_pt || null,
          fech_desp_pt: v1.fech_desp_pt ? v1.fech_desp_pt : null,
          oficioenviodmi: v1.oficioenviodmi || null,
          fechaenvioreq: v1.fechaenvioreq ? v1.fechaenvioreq : null,
          obs_version: v1.obs_version || null
        }]
      },
    };
  }

  const handleSave = async () => {
    // Validación de campos requeridos
    if (!externo.numero?.trim()) {
      showAlert("❌ El número de requerimiento es requerido.");
      return;
    }
    if (!externo.descripcion?.trim()) {
     showAlert("❌ La descripción es requerida.");
      return;
    }
    if (!externo.sistema) {
      showAlert("Debe seleccionar un sistema.", "warning");
      return;
    }
    if (!externo.dependencia) {
      showAlert("❌ Debe seleccionar una dependencia.");
      return;
    }
    if (!externo.estado) {
      showAlert("❌ Debe seleccionar un estado.");
      return;
    }

    try {
      const payload = buildPayload(externo, user, mode !== "create");
      console.log("🧾 Payload final:", payload);

      if (mode === "create") {
        await createExterno({ token, payload });
        showAlert("✅ Requerimiento externo creado correctamente", "success");
        navigate("/externos");
      } else {
        await updateExterno({ token, id, payload });
        const newVersions = versiones.filter((v, index) => !v.isLoaded && index > 0);
        for (const v of newVersions) {
          await addVersionToRequerimiento({
            token,
            id_requerimiento: externo.requerimientoId,
            payload: {
              num_version: parseInt(v.num_version, 10),
              ofi_desp_pt: v.ofi_desp_pt || null,
              fech_desp_pt: v.fech_desp_pt ? v.fech_desp_pt : null,
              oficioenviodmi: v.oficioenviodmi || null,
              fechaenvioreq: v.fechaenvioreq ? v.fechaenvioreq : null,
              obs_version: v.obs_version || null
            }
          });
          showAlert(`✅ Versión ${v.num_version} agregada correctamente`);
        }
       setAlert({
          open: true,
          message: "✅ Requerimiento externo actualizado correctamente",
          type: "success",
          confirm: () => {
            setAlert({ open: false, message: "", type: "info" });
            navigate("/externos"); // 👈 redirige al listado al cerrar
          },
          });
          }
    } catch (err) {
      console.error("❌ Error al guardar externo:", err);
      showAlert("Ocurrió un error al guardar el requerimiento externo.", "error");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!externo) return <div className="p-6">No encontrado</div>;

  const isCreate = mode === "create";
  const isView = mode === "view";

    const handleDelete = async () => {
      setAlert({
        open: true,
        message: "¿Está seguro de eliminar este registro SIRECQ Externo? Esta acción no se puede deshacer.",
        type: "warning",
        confirm: async () => {
          setAlert({ open: false, message: "", type: "info" });
          try {
            await deleteExterno({ token, id: externo.id_sirecq_externo });
            setAlert({
              open: true,
              message: "Registro SIRECQ Externo eliminado exitosamente",
              type: "success",
              confirm: () => {
                setAlert({ open: false, message: "", type: "info" });
                navigate("/externos");
              }
            });
          } catch (error) {
            showAlert("Error al eliminar: " + error.message, "error");
          }
        }
      });
    };


  // ======================= RENDER =========================
  return (
    
    <div className="min-h-screen flex flex-col">

      <AlertModal
  open={alert.open}
  message={alert.message}
  type={alert.type}
  onClose={alert.confirm ? alert.confirm : closeAlert}
/>


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
  {/* 🔴 Botón Eliminar — solo visible si no es modo crear */}
  {!isCreate && (
    <button
      onClick={handleDelete}
      className="w-10 h-10 flex items-center justify-center bg-[#e11d48] hover:bg-[#b91c1c] text-white shadow-md rounded-md transition-all duration-200"
      title="Eliminar SIRECQ Externo"
    >
      <Trash className="w-5 h-5" />
    </button>
  )}

  {/* 🟡 Botón Editar */}
  {!isCreate && !editMode && (
    <button
      onClick={() => setEditMode(true)}
      className="w-10 h-10 flex items-center justify-center bg-[#facc15] hover:bg-[#eab308] text-white shadow-md rounded-md transition-all duration-200"
      title="Editar"
    >
      <Edit className="w-5 h-5" />
    </button>
  )}

  {/* 🟢 Botón Guardar */}
  {(editMode || isCreate) && (
    <button
      onClick={handleSave}
      className="w-10 h-10 flex items-center justify-center bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md rounded-md transition-all duration-200"
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

          <PaintedPicker
            label="Estado del requerimiento"
            editMode={editMode || isCreate}
            kind="select"
            name="estado"
            value={externo.estado || ""}
            onChange={handleChange}
            options={estados.map(e => e.name)}
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

      {/* ================= VERSIONES ================= */}
      <div className="px-6 mb-6">
        {versiones.map((version, index) => (
          <VersionBlock
            key={index}
            version={version}
            index={index}
            onChange={handleVersionChange}
            editMode={editMode || isCreate}
          />
        ))}
        {editMode && !isCreate && (
          <button
            onClick={handleAddVersion}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Añadir versión
          </button>
        )}
      </div>

      {/* ================= OBSERVACIONES GENERALES ================= */}
      <div className="px-6 mb-6">
        <div className="border rounded-lg p-4">
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
            <option value="">Seleccione...</option> {/* 👈 agregado */}
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

function VersionBlock({ version, index, onChange, editMode }) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="font-bold mb-2">Versión {version.num_version}</h3>
      <div className="grid grid-cols-4 gap-6">
        <EditableField
          label="Oficio despacho propuesta técnica"
          name="ofi_desp_pt"
          value={version.ofi_desp_pt || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <DateField
          label="Fecha despacho propuesta técnica"
          name="fech_desp_pt"
          value={version.fech_desp_pt || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <EditableField
          label="Oficios de envío a DMI"
          name="oficioenviodmi"
          value={version.oficioenviodmi || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <DateField
          label="Fecha de envío requerimiento"
          name="fechaenvioreq"
          value={version.fechaenvioreq || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <div className="col-span-4">
          <label className="block text-sm font-semibold mb-1">Observaciones del Versionamiento</label>
          {editMode ? (
            <textarea
              name="obs_version"
              value={version.obs_version || ""}
              onChange={(e) => onChange(index, 'obs_version', e.target.value)}
              className="w-full p-3 border rounded bg-gray-50"
              rows={4}
            />
          ) : (
            <div className="w-full p-3 rounded bg-[#f1f5f9] text-gray-800">
              {version.obs_version || ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
