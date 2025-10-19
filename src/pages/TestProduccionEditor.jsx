// src/pages/TestProduccionEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRequerimientoById,
  createRequerimiento,
  updateRequerimiento,
  addVersionToTest,
  updateTestCompleto, 
} from "../services/testProduccionService";
import { useAuth } from "../context/AuthContext";
import { getAnalistas } from "../services/usersRolService";
import { ArrowLeft, Save, Plus, Edit } from "lucide-react";

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
  version: 1,
});

export default function TestProduccionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = !id || id === "nuevo" || id === "new";

  const [isEditing, setIsEditing] = useState(isCreate);
  const [loading, setLoading] = useState(true);
  const [analistas, setAnalistas] = useState([]);

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
  });

  /* 🔹 Cargar analistas (id_rol === 2) */
  useEffect(() => {
    const loadAnalistas = async () => {
      try {
        const res = await getAnalistas({ token: user?.token });
        const list = Array.isArray(res) ? res : res?.data || [];
        const filtered = list.filter(
          (a) =>
            a.id_rol === 2 ||
            a.rol_id === 2 ||
            a?.rol?.id_rol === 2 ||
            a?.rol?.id === 2
        );
        setAnalistas(filtered);
      } catch (err) {
        console.warn("⚠️ No se pudo cargar analistas:", err);
      }
    };
    loadAnalistas();
  }, [user?.token]);

  /* 🔹 Cargar registro si es modo edición */
  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        try {
          const data = await getRequerimientoById(id, user?.token);
          if (data) {
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
                data.etapa_implementacion ||
                data.etapa ||
                data.etapa_implementation ||
                "",
              oficioEnvio:
                data.oficioEnvio?.length > 0
                  ? data.oficioEnvio
                  : [makeInitialVersion()],
              fechaEnvio:
                data.fechaEnvio?.length > 0
                  ? data.fechaEnvio
                  : [makeInitialVersion()],
              propuesta:
                data.propuesta?.length > 0
                  ? data.propuesta
                  : [makeInitialPropuesta()],
              respuestaTics: data.respuestaTics || "",
              descripcion: data.descripcion || "",
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

  /* ---------------- GUARDAR ---------------- */
// ✅ Actualizar registro existente
const handleSave = async () => {
  const basePayload = {
    no_requerimiento: form.numero,
    id_rol_usuario: form.id_rol_usuario,
    etapa_implementation: form.etapa,
    respuesta_tics: form.respuestaTics,
    descripcion: form.descripcion,
  };

  try {
    setLoading(true);

    if (isCreate) {
      // CREACIÓN NUEVA (Versión 1)
      const versionV1 = {
        oficioenviodmi: form.oficioEnvio[0]?.valor || null,
        fechaenvioreq: form.fechaEnvio[0]?.valor || null,
        ofi_desp_pt: form.propuesta[0]?.oficio || null,
        fech_desp_pt: form.propuesta[0]?.fecha || null,
      };

      await createRequerimiento(
        { testProduccion: basePayload, versionamiento: versionV1 },
        user?.token
      );
      alert("✅ Registro creado correctamente con versión 1");
      navigate("/test-produccion");
      return;
    }

    // EDICIÓN EXISTENTE (Actualizar versiones)
const versionesActualizadas = [];
let versionamiento = null;

form.oficioEnvio.forEach((of, i) => {
  const propuesta = form.propuesta[i];
  const fecha = form.fechaEnvio[i];

  // Si tiene id_version → actualizar
  if (of.id_version) {
    versionesActualizadas.push({
      id_version: of.id_version,
      oficioenviodmi: of.valor || null,
      fechaenvioreq: fecha?.valor || null,
      ofi_desp_pt: propuesta?.oficio || null,
      fech_desp_pt: propuesta?.fecha || null,
      obs_version: null,
    });
  } 
  // Si no tiene id_version → crear nueva versión
  else {
    versionamiento = {
      oficioenviodmi: of.valor || null,
      fechaenvioreq: fecha?.valor || null,
      ofi_desp_pt: propuesta?.oficio || null,
      fech_desp_pt: propuesta?.fecha || null,
      obs_version: null,
    };
  }
});

const updatePayload = {
  ...basePayload,
  versionesActualizadas,
  ...(versionamiento ? { versionamiento } : {}), // 👈 si hay nueva versión, se añade
};

await updateTestCompleto(id, updatePayload, user?.token);


    alert("✅ Cambios guardados correctamente");
    navigate("/test-produccion");
  } catch (err) {
    console.error("❌ Error en handleSave:", err);
    alert("Error al guardar. Revisa la consola.");
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
        { id: Date.now(), valor: "", version: (p.oficioEnvio?.length || 0) + 1 },
      ],
    }));

  const addFechaEnvio = () =>
    setForm((p) => ({
      ...p,
      fechaEnvio: [
        ...(p.fechaEnvio || []),
        { id: Date.now(), valor: "", version: (p.fechaEnvio?.length || 0) + 1 },
      ],
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
          version: (p.propuesta?.length || 0) + 1,
        },
      ],
    }));

  /* ---------------- RENDER ---------------- */
  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>

        <div className="flex gap-2">
          {!isCreate && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className="p-2 bg-[#3F6592] text-white rounded hover:bg-[#335174]"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            className="p-2 bg-[#3F6592] text-white rounded hover:bg-[#335174]"
            title="Guardar"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <hr className="border-t-2 border-[#3F6592] mb-6" />

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
              <div className="bg-[#D6C7BF] px-3 py-2 rounded">
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
                className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
              >
                <option value="">Seleccione ejecutor</option>
                {analistas.map((a) => (
                  <option key={a.id_rol_usuario} value={a.id_rol_usuario}>
                    {a.usuario?.nombre_usuario} {a.usuario?.apellidos_usuario}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-[#D6C7BF] px-3 py-2 rounded">
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
                className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
              >
                <option value="">Seleccione etapa</option>
                <option value="Test">Test</option>
                <option value="Producción">Producción</option>
              </select>
            ) : (
              <div className="bg-[#D6C7BF] px-3 py-2 rounded">
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
                  it.id === idItem ? { ...it, valor: val } : it
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
        {items.map((it) => (
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
              <>
                <InputBox
                  label="Oficio de recepción"
                  value={it.oficio}
                  onChange={(v) =>
                    onChangePropuesta?.(it.id, "oficio", v)
                  }
                  isEditing={isEditing}
                />
                <InputBox
                  label="Fecha"
                  type="date"
                  value={it.fecha}
                  onChange={(v) =>
                    onChangePropuesta?.(it.id, "fecha", v)
                  }
                  isEditing={isEditing}
                />
              </>
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
            <span className="bg-[#D6C7BF] px-3 py-2 rounded text-sm font-semibold">
              Versión {it.version}
            </span>
          </div>
        ))}
        {isEditing && !window.location.pathname.includes("nuevo") && (
          <button
            onClick={onAdd}
            className="p-2 border border-[#3F6592] rounded-full text-[#3F6592] hover:bg-[#3F6592] hover:text-white"
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
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
        />
      ) : (
        <div className="bg-[#D6C7BF] px-3 py-2 rounded">
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
          className="w-full border rounded p-3 bg-[#D6C7BF]"
        />
      ) : (
        <div className="bg-[#D6C7BF] px-3 py-2 rounded whitespace-pre-line">
          {value || "—"}
        </div>
      )}
    </div>
  );
}
