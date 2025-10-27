// src/pages/TestProduccionEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRequerimientoById,
  createRequerimiento,
  updateRequerimiento,
  addVersionToTest,
  updateTestCompleto, 
  deleteTestProduccion,
} from "../services/testProduccionService";
import { useAuth } from "../context/AuthContext";
import { getEjecutores } from "../services/testProduccionService";
import { ArrowLeft, Save, Plus, Edit, CheckCircle, XCircle, Info, AlertTriangle, Trash } from "lucide-react";


// 🕓 Normaliza la fecha seleccionada en un input <date> sin crear objeto Date
function toDateOnly(dateStr) {
  if (!dateStr) return null;
  // Garantiza que el valor se mantenga en formato "YYYY-MM-DD" sin UTC
  return dateStr.toString().split("T")[0];
}

// 🕓 Corrige fechas que vienen del backend (idéntico a ExternosEditor)
function normalizeDateFromBackend(dateString) {
  if (!dateString) return "";
  try {
    // Evita desfaces de zona horaria tomando solo la parte de la fecha
    // sin convertir el objeto Date ni aplicar offset.
    return dateString.toString().split("T")[0];
  } catch {
    return "";
  }
}




/* ---------------- HELPERS ---------------- */
const makeInitialVersion = () => ({
  id: Date.now(),
  valor: "",
  version: 1,
});
const makeInitialPropuesta = () => ({
  id: Date.now(),
  oficio: "",
  fecha: "",
  observaciones: "",
  version: 1,
});

function AlertModal({ open, type = "info", message, onClose }) {
  if (!open) return null;
  const config = {
    success: { color: "text-green-500 border-green-300", icon: <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />, title: "¡Éxito!" },
    error:   { color: "text-red-500 border-red-300",   icon: <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />,   title: "Error" },
    info:    { color: "text-blue-500 border-blue-300",  icon: <Info className="w-12 h-12 mx-auto mb-2 text-blue-500" />,    title: "Aviso" },
    warning: { color: "text-yellow-500 border-yellow-300", icon: <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />, title: "Advertencia" },
  };
  const { color, icon, title } = config[type] || config.info;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(30, 41, 59, 0.25)", backdropFilter: "blur(2px)" }}>
      <div className={`bg-white rounded-xl shadow-xl px-8 py-8 min-w-[320px] max-w-[90vw] border-t-4 ${color} flex flex-col items-center`}>
        {icon}
        <div className={`mb-2 text-xl font-bold ${color}`}>{title}</div>
        <div className="mb-6 text-gray-700 text-center">{message}</div>
        <button onClick={onClose} className="px-6 py-2 rounded bg-[#3F6592] text-white font-semibold hover:bg-[#27466b]">
          Aceptar
        </button>
      </div>
    </div>
  );
}


export default function TestProduccionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const isCreate = !id || id === "nuevo" || id === "new";

  const [isEditing, setIsEditing] = useState(isCreate);
  const [loading, setLoading] = useState(true);
  const [ejecutores, setEjecutores] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: "info", message: "" });
  const showAlert = (type, message) => setAlert({ open: true, type, message });
  const closeAlert = () => {
  setAlert((prev) => {
    const type = prev.type;
    const updated = { ...prev, open: false };
    // si el tipo fue exitoso, redirige luego de cerrar el modal
    if (type === "success") {
      setTimeout(() => navigate("/test-produccion"), 400);
    }
    return updated;
  });
};



  const [form, setForm] = useState({
    numero: "",
    id_rol_usuario: null,
    ejecutor: "",
    etapa: "",
    oficioEnvio: [makeInitialVersion()],
    fechaEnvio: [makeInitialVersion()],
    propuesta: [makeInitialPropuesta()],
    respuestaTics: "",
    descripcion: "",
    ofi_env_pt: "",
    fech_env_pt: "",

  });

  
 /* 🔹 Cargar ejecutores */
        useEffect(() => {
          const loadEjecutores = async () => {
            try {
              const res = await getEjecutores(user?.token);
              const list = Array.isArray(res) ? res : res?.data || [];
              setEjecutores(list); // 👈 puedes renombrar este estado a 'ejecutores' si prefieres
            } catch (err) {
              console.warn("⚠️ No se pudo cargar ejecutores:", err);
            }
          };
          loadEjecutores();
        }, [user?.token]);


  /* 🔹 Cargar registro si es modo edición */
  /* 🔹 Cargar registro si es modo edición */
useEffect(() => {
  const load = async () => {
    if (!isCreate) {
      try {
        const data = await getRequerimientoById(id, user?.token);
        console.log("📦 Data recibida desde API:", data);
        
        if (data) {
          // 🔥 Función helper para validar si una propuesta tiene datos reales
          const tieneDatosPropuesta = (p) => {
            return (
              (p.oficio && p.oficio.trim() !== "") ||
              (p.fecha && p.fecha.trim() !== "") ||
              (p.observaciones && p.observaciones.trim() !== "") ||
              (p.obs_version && p.obs_version.trim() !== "")
            );
          };

          // 🔥 Filtrar propuestas vacías
          const propuestasFiltradas = data.propuesta?.length > 0
            ? data.propuesta
                .filter(tieneDatosPropuesta) // 👈 Solo las que tienen datos
                .map((p) => ({
                  ...p,
                  fecha: normalizeDateFromBackend(p.fecha),
                  observaciones: p.obs_version || p.observaciones || "",
                }))
            : [];

          setForm({
            numero: data.numero || "",
            id_rol_usuario:
              data.id_rol_usuario ||
              data.rolUsuario?.id_rol_usuario ||
              null,
            ejecutor:
              data.ejecutor ||
              (data.rolUsuario?.usuario
                ? `${data.rolUsuario.usuario.nombre_usuario} ${data.rolUsuario.usuario.apellidos_usuario}`
                : ""),
            etapa:
              data.etapa_implementation ||
              data.etapa ||
              data.etapa_implementacion ||
              data.raw?.etapa_implementation ||
              "",

            oficioEnvio:
              data.oficioEnvio?.length > 0
                ? data.oficioEnvio
                : [makeInitialVersion()],
            
            fechaEnvio:
              data.fechaEnvio?.length > 0
                ? data.fechaEnvio.map((f) => ({
                    ...f,
                    valor: normalizeDateFromBackend(f.valor),
                  }))
                : [makeInitialVersion()],
            
            // 🔥 Si no hay propuestas con datos, dejar array vacío
            propuesta:
              propuestasFiltradas.length > 0
                ? propuestasFiltradas
                : [], // 👈 Array vacío en lugar de [makeInitialPropuesta()]
            
            respuestaTics: data.respuestaTics || "",
            descripcion: data.descripcion || "",
            ofi_env_pt: data.ofi_env_pt || "",
            fech_env_pt: data.fech_env_pt
              ? normalizeDateFromBackend(data.fech_env_pt)
              : "",
          });
        }
      } catch (err) {
        console.error("Error cargando TestProduccion:", err);
      }
    }
    setLoading(false);
  };
  load();
}, [id, isCreate, user?.token]);
  
// ✅ Actualizar registro existente
/* ---------------- GUARDAR ---------------- */
const handleSave = async () => {
  const basePayload = {
    no_requerimiento: form.numero,
    id_rol_usuario: form.id_rol_usuario,
    etapa_implementation: form.etapa,
    respuesta_tics: form.respuestaTics,
    descripcion: form.descripcion,
    ofi_env_pt: form.ofi_env_pt || null,
    fech_env_pt: form.fech_env_pt || null,
  };

  try {
    setLoading(true);

    if (isCreate) {
      // ✅ CREACIÓN NUEVA (Versión 1)
      const versionV1 = {
        oficioenviodmi: form.oficioEnvio[0]?.valor || null,
        fechaenvioreq: form.fechaEnvio[0]?.valor || null,
        ofi_desp_pt: form.propuesta[0]?.oficio || null,
        fech_desp_pt: form.propuesta[0]?.fecha || null,
        obs_version: form.propuesta[0]?.observaciones || null,
      };

      await createRequerimiento(
        { testProduccion: basePayload, versionamiento: versionV1 },
        user?.token
      );

      showAlert("success", "Registro creado correctamente con versión 1");
      return;
    }

    // ✅ EDICIÓN EXISTENTE
    // ✅ EDICIÓN EXISTENTE
await new Promise((resolve) => setTimeout(resolve, 50));

const versionesActualizadas = [];
let versionamiento = null;

// 🔹 Procesar oficioEnvio solo si tiene datos reales
form.oficioEnvio.forEach((of) => {
  if (of.valor && of.valor.trim() !== "") {
    if (of.id_version) {
      versionesActualizadas.push({
        id_version: of.id_version,
        oficioenviodmi: of.valor,
      });
    } else {
      versionamiento = { ...(versionamiento || {}), oficioenviodmi: of.valor };
    }
  }
});

// 🔹 Procesar fechaEnvio solo si tiene datos reales
form.fechaEnvio.forEach((f) => {
  if (f.valor && f.valor.trim() !== "") {
    if (f.id_version) {
      const existing = versionesActualizadas.find(v => v.id_version === f.id_version);
      if (existing) existing.fechaenvioreq = f.valor;
      else versionesActualizadas.push({
        id_version: f.id_version,
        fechaenvioreq: f.valor,
      });
    } else {
      versionamiento = { ...(versionamiento || {}), fechaenvioreq: f.valor };
    }
  }
});

// 🔹 Procesar propuesta técnica solo si tiene al menos un campo lleno
form.propuesta.forEach((p) => {
  const tieneDatos =
    (p.oficio && p.oficio.trim() !== "") ||
    (p.fecha && p.fecha.trim() !== "") ||
    (p.observaciones && p.observaciones.trim() !== "");

  if (tieneDatos) {
    const base = {
      ...(p.oficio ? { ofi_desp_pt: p.oficio } : {}),
      ...(p.fecha ? { fech_desp_pt: p.fecha } : {}),
      ...(p.observaciones ? { obs_version: p.observaciones } : {}),
    };

    if (p.id_version) {
      const existing = versionesActualizadas.find(v => v.id_version === p.id_version);
      if (existing) Object.assign(existing, base);
      else versionesActualizadas.push({ id_version: p.id_version, ...base });
    } else {
      versionamiento = { ...(versionamiento || {}), ...base };
    }
  }
});


// 🔹 Arma payload final
const updatePayload = {
  no_requerimiento: form.numero,
  id_rol_usuario: form.id_rol_usuario,
  etapa_implementation: form.etapa,
  respuesta_tics: form.respuestaTics,
  descripcion: form.descripcion,
  ofi_env_pt: form.ofi_env_pt || null,
  fech_env_pt: form.fech_env_pt || null,
  versionesActualizadas,
  ...(versionamiento ? { versionamiento } : {}),
};

await updateTestCompleto(id, updatePayload, user?.token);
showAlert("success", "Cambios guardados correctamente");

    
  } catch (err) {
    console.error("❌ Error en handleSave:", err);
    showAlert("error", "No se pudo guardar el registro.");
  } finally {
    setLoading(false);
  }
};

  /* ---------------- AÑADIR NUEVAS VERSIONES ---------------- */
  const addOficioEnvio = () =>
  setForm((p) => ({
    ...p,
    oficioEnvio: [
      ...(p.oficioEnvio || []),
      { 
        id: Date.now(), 
        valor: "", 
        version: (p.oficioEnvio?.length || 0) + 1 
      },
    ],
    // 🔥 NO tocar fechaEnvio ni propuesta
  }));

const addFechaEnvio = () =>
  setForm((p) => ({
    ...p,
    fechaEnvio: [
      ...(p.fechaEnvio || []),
      { 
        id: Date.now(), 
        valor: "", 
        version: (p.fechaEnvio?.length || 0) + 1 
      },
    ],
    // 🔥 NO tocar oficioEnvio ni propuesta
  }));

const addPropuesta = () =>
  setForm((p) => ({
    ...p,
    propuesta: [
      ...(p.propuesta || []),
      {
        id: Date.now(),
        oficio: "",
        fecha: "",
        observaciones: "",
        version: (p.propuesta?.length || 0) + 1,
      },
    ],
    // 🔥 NO tocar oficioEnvio ni fechaEnvio
  }));
  /* ---------------- RENDER ---------------- */
  if (loading) return <div className="p-6">Cargando…</div>;
  
  console.log("🎯 Valor actual de form.etapa:", JSON.stringify(form.etapa));


 
  
  return (
    
    <div className="p-6">
    {/* 🔔 Modal de alertas */}
    <AlertModal
      open={alert.open}
      type={alert.type}
      message={alert.message}
      onClose={closeAlert}
    />
    
 {/* Header */}
<div className="flex justify-between items-center px-6 py-3">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-gray-700 hover:text-[#5b0f2c]"
  >
    <ArrowLeft className="w-5 h-5" /> Atrás
  </button>

</div>

<div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

<div className="px-6 mt-2 mb-4">
  <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3 shadow-sm">
    <span className="font-bold text-[#3F6592] text-lg tracking-wide">
      TEST / PRODUCCIÓN
    </span>

    <div className="flex gap-2">
      {/* 🔴 Botón Eliminar — visible solo para Administrador */}
      {(activeRole === "Administrador" || activeRole === "ADMINISTRACIÓN") && !isCreate && (
        <button
        onClick={async () => {
          if (!window.confirm("¿Desea eliminar este registro de Test/Producción? Esta acción no se puede deshacer.")) return;
          try {
            setLoading(true);
            await deleteTestProduccion(id, user?.token);
            showAlert("success", "Registro eliminado correctamente");
            setTimeout(() => navigate("/test-produccion"), 1000); // 🔁 vuelve a la lista
          } catch (err) {
            console.error("❌ Error al eliminar:", err);
            showAlert("error", "No se pudo eliminar el registro. Revise la consola.");
          } finally {
            setLoading(false);
          }
        }}
        className="w-10 h-10 flex items-center justify-center bg-[#e11d48] hover:bg-[#b91c1c] text-white shadow-md rounded-md transition-all duration-200"
        title="Eliminar Test / Producción"
      >
        <Trash className="w-5 h-5" />
      </button>

      )}

      {/* 🟡✏️ Botón Editar / 💾 Guardar */}
      {!isCreate ? (
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-md shadow-md transition-all duration-200 text-white ${
            isEditing
              ? "bg-[#16a34a] hover:bg-[#15803d]" // 💾 verde al editar
              : "bg-[#facc15] hover:bg-[#eab308]" // ✏️ amarillo por defecto
          }`}
          title={isEditing ? "Guardar cambios" : "Editar"}
        >
          {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
        </button>
      ) : (
        // 💾 Mostrar siempre botón Guardar al crear nuevo registro
        <button
          onClick={handleSave}
          className="w-10 h-10 flex items-center justify-center bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md rounded-md transition-all duration-200"
          title="Guardar nuevo registro"
        >
          <Save className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
</div>

<div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>



      {/* ---- FORMULARIO ---- */}
      <div className="border rounded-xl p-4 space-y-6">
        {/* Primera fila */}
        <div className="grid grid-cols-3 gap-4">
          {/* N° requerimiento */}
          <div>
            <label className="block font-bold mb-1">N° Requerimiento</label>
            {isEditing ? (
              <input
                type="text"
                value={form.numero}
                onChange={(e) =>
                  setForm((p) => ({ ...p, numero: e.target.value }))
                }
                className="w-full bg-white border px-3 py-2 rounded"
              />
            ) : (
              <div className="bg-[#f1f5f9] px-3 py-2 rounded">
                {form.numero || "—"}
              </div>
            )}
          </div>

          {/* Ejecutor */}
          <div>
            <label className="block font-bold mb-1">Ejecutor</label>
            {isEditing ? (
              <select
                value={form.id_rol_usuario || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    id_rol_usuario: Number(e.target.value),
                  }))
                }
                className="w-full bg-[#f1f5f9] px-3 py-2 rounded"
              >
                <option value="">Seleccione ejecutor</option>
                {ejecutores.map((a) => (
                <option key={a.id_rol_usuario} value={a.id_rol_usuario}>
                  {a.nombre_completo}
                </option>
              ))}

              </select>
            ) : (
              <div className="bg-[#f1f5f9] px-3 py-2 rounded">
                {form.ejecutor || "—"}
              </div>
            )}
          </div>

          {/* Etapa */}
          <div>
            <label className="block font-bold mb-1">
              Etapa de implementación
            </label>
            {isEditing ? (
              <select
                value={form.etapa || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, etapa: e.target.value }))
                }
                className="w-full bg-[#f1f5f9] px-3 py-2 rounded"
              >
                <option value="">Seleccione etapa</option>
                <option value="Test">Test</option>
                <option value="Producción">Producción</option>
              </select>
            ) : (
              <div className="bg-[#f1f5f9] px-3 py-2 rounded">
                {form.etapa || "—"}
              </div>
            )}
          </div>
        </div>

        {/* Oficio y Propuesta */}
        <div className="grid grid-cols-2 gap-6">
          <SectionWithBox
            title="Oficio de envío a DMI"
            items={form.oficioEnvio}
            schema="oficio"
            onChange={(idItem, val) =>
              setForm((p) => ({
                ...p,
                oficioEnvio: p.oficioEnvio.map((it) =>
                  it.id === idItem ? { ...it, valor: val } : it
                ),
              }))
            }
            onAdd={addOficioEnvio}
            isEditing={isEditing}
          />

          <SectionWithBox
            title="Propuesta Técnica"
            items={form.propuesta}
            schema="propuesta"
            onChangePropuesta={(idItem, field, val) =>
              setForm((p) => ({
                ...p,
                propuesta: p.propuesta.map((it) =>
                  it.id === idItem ? { ...it, [field]: val } : it
                ),
              }))
            }
            onAdd={addPropuesta}
            isEditing={isEditing}
          />
        </div>

        {/* Fecha + Respuesta/Descripción */}
        <div className="grid grid-cols-2 gap-6">
          <SectionWithBox
            title="Fecha"
            items={form.fechaEnvio}
            schema="fecha"
            onChangeFecha={(idItem, val) =>
            setForm((p) => ({
              ...p,
              fechaEnvio: p.fechaEnvio.map((it) =>
                it.id === idItem
                  ? { ...it, valor: toDateOnly(val) }
                  : it
              ),
            }))
}

            onAdd={addFechaEnvio}
            isEditing={isEditing}
          />

          <div className="grid grid-cols-2 gap-6">
            <BlockText
              title="Respuesta TICS"
              value={form.respuestaTics}
              isEditing={isEditing}
              onChange={(v) =>
                setForm((p) => ({ ...p, respuestaTics: v }))
              }
            />
            <BlockText
              title="Descripción"
              value={form.descripcion}
              isEditing={isEditing}
              onChange={(v) => setForm((p) => ({ ...p, descripcion: v }))}
            />
          </div>
        </div>

        {/* Oficio de envío de propuesta técnica a DMSIST */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-bold mb-1">
                Oficio de envío de propuesta técnica a DMSIST
              </label>
              <div className="border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Campo oficio */}
                  <div>
                    <div className="text-sm font-semibold mb-1">Oficio</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.ofi_env_pt || ""}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, ofi_env_pt: e.target.value }))
                        }
                        className="w-full bg-[#f1f5f9] px-3 py-2 rounded"
                      />
                    ) : (
                      <div className="bg-[#f1f5f9] px-3 py-2 rounded">
                        {form.ofi_env_pt || "—"}
                      </div>
                    )}
                  </div>

                  {/* Campo fecha */}
                  <div>
                    <div className="text-sm font-semibold mb-1">Fecha</div>
                    {isEditing ? (
                      <input
                        type="date"
                        value={form.fech_env_pt || ""}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, fech_env_pt: e.target.value }))
                        }
                        className="w-full bg-[#f1f5f9] px-3 py-2 rounded"
                      />
                    ) : (
                      <div className="bg-[#f1f5f9] px-3 py-2 rounded">
                        {form.fech_env_pt
                          ? new Date(form.fech_env_pt).toLocaleDateString("es-EC")
                          : "—"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna vacía (para igualar proporciones con la sección de “Fecha”) */}
            <div></div>
          </div>

      </div>

      <hr className="border-t-2 border-[#3F6592] mt-6 mb-4" />
      <div className="flex justify-center">
        <img
          src="/metro-responsive.gif"
          alt="Municipio de Quito"
          className="h-24"
        />
      </div>
    </div>
  );
}

/* ---------- SUBCOMPONENTES ---------- */
function SectionWithBox({
  title,
  items,
  schema,
  onChange,
  onChangePropuesta,
  onChangeFecha,
  onAdd,
  isEditing,
}) {
  return (
    <div>
      <label className="block font-bold mb-1">{title}</label>
      <div className="border rounded-lg p-3">
        {/* 🔥 Solo renderizar si hay items */}
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 italic py-2">
            Sin versiones registradas
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 mb-2">
              {schema === "oficio" && (
                <InputBox
                  label="Oficio de envío"
                  value={it.valor}
                  onChange={(v) => onChange?.(it.id, v)}
                  isEditing={isEditing}
                />
              )}
              
              {schema === "propuesta" && (
                <div className="grid grid-cols-3 gap-3 w-full">
                  <InputBox
                    label="Oficio de recepción"
                    value={it.oficio}
                    onChange={(v) => onChangePropuesta?.(it.id, "oficio", v)}
                    isEditing={isEditing}
                  />
                  <InputBox
                    label="Fecha"
                    type="date"
                    value={it.fecha}
                    onChange={(v) => onChangePropuesta?.(it.id, "fecha", v)}
                    isEditing={isEditing}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold mb-1">Observaciones</div>
                    {isEditing ? (
                      <textarea
                        value={it.observaciones || ""}
                        onChange={(e) => onChangePropuesta?.(it.id, "observaciones", e.target.value)}
                        className="w-full bg-[#f1f5f9] px-3 py-2 rounded resize-none h-24 overflow-y-auto"
                      />
                    ) : (
                      <div
                        className="bg-[#f1f5f9] px-3 py-2 rounded h-24 overflow-y-auto whitespace-pre-wrap break-words"
                        style={{ wordBreak: "break-word" }}
                      >
                        {it.observaciones || "—"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {schema === "fecha" && (
                <InputBox
                  label="Envío de requerimiento"
                  type="date"
                  value={it.valor}
                  onChange={(v) => onChangeFecha?.(it.id, v)}
                  isEditing={isEditing}
                />
              )}

              <span className="bg-[#f1f5f9] px-3 py-2 rounded text-sm font-semibold">
                Versión {it.version}
              </span>
            </div>
          ))
        )}
        
        {isEditing && !window.location.pathname.includes("nuevo") && (
          <button
            onClick={onAdd}
            className="p-2 border border-[#3F6592] rounded-full text-[#3F6592] hover:bg-[#3F6592] hover:text-white mt-2"
            title="Añadir versión"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
function InputBox({ label, type = "text", value, onChange, isEditing }) {
  return (
    <div className="flex-1">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {isEditing ? (
        label === "Observaciones" ? (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#f1f5f9] px-3 py-2 rounded resize-none h-24 overflow-y-auto"
          />
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#f1f5f9] px-3 py-2 rounded"
          />
        )
      ) : (
        <div className={`bg-[#f1f5f9] px-3 py-2 rounded ${
          label === "Observaciones" 
            ? "h-24 overflow-y-auto whitespace-pre-wrap" 
            : ""
        }`}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function BlockText({ title, value, isEditing, onChange }) {
  return (
    <div>
      <label className="block font-bold mb-1">{title}</label>
      {isEditing ? (
        <textarea
          rows={5}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded p-3 bg-[#f1f5f9]"
        />
      ) : (
        <div
        className="bg-[#f1f5f9] px-3 py-2 rounded whitespace-pre-line break-words overflow-y-auto max-h-40"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {value || "—"}
      </div>

      )}
    </div>
  );
}
