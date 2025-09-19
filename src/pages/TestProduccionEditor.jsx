// src/pages/TestProduccionEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRequerimientoById,
  createRequerimiento,
  updateRequerimiento,
} from "../services/testProduccionService";
import { ArrowLeft, Save, Plus, Edit } from "lucide-react";

/** Helpers de normalización */
const toOficioArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim().length) {
    return [{ id: Date.now(), valor: val, version: 1 }];
  }
  return [];
};
const toFechaArray = (val) => {
  if (Array.isArray(val)) return val;
  const v = (val || "").toString().slice(0, 10);
  if (v) return [{ id: Date.now(), valor: v, version: 1 }];
  return [];
};
const toPropuestaArray = (arr, oficio, fecha) => {
  if (Array.isArray(arr)) return arr;
  const o = (oficio || "").trim();
  const f = (fecha || "").toString().slice(0, 10);
  if (o || f) {
    return [{ id: Date.now(), oficio: o, fecha: f, version: 1 }];
  }
  return [];
};

export default function TestProduccionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isCreate = !id || id === "new";

  const [isEditing, setIsEditing] = useState(isCreate);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    numero: "",
    estado: "",
    ejecutor: "",
    etapa: "",
    // versiones
    oficioEnvio: [],
    fechaEnvio: [],
    propuesta: [],
    // texto largo
    respuestaTics: "",
    descripcion: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const data = await getRequerimientoById(id);
        if (data) {
          setForm({
            numero: data.numero || "",
            estado: data.estado || "",
            ejecutor: data.ejecutor || "",
            etapa: data.etapa || "",
            oficioEnvio: toOficioArray(data.oficioEnvio),
            fechaEnvio: toFechaArray(data.fechaEnvio || data.fecha),
            propuesta: toPropuestaArray(
              data.propuesta,
              data.propuestaOficio,
              data.fechaPropuesta
            ),
            respuestaTics: data.respuestaTics || "",
            descripcion: data.descripcion || "",
          });
        }
      } else {
        setIsEditing(true);
      }
      setLoading(false);
    };
    load();
  }, [id, isCreate]);

  const handleSave = async () => {
    const lastOficio = (form.oficioEnvio || [])[form.oficioEnvio.length - 1];
    const lastFecha = (form.fechaEnvio || [])[form.fechaEnvio.length - 1];
    const lastProp = (form.propuesta || [])[form.propuesta.length - 1];

    const payload = {
      numero: form.numero,
      estado: form.estado,
      ejecutor: form.ejecutor,
      etapa: form.etapa,
      oficioEnvio: lastOficio?.valor || "",
      fechaEnvio: lastFecha?.valor || "",
      propuestaOficio: lastProp?.oficio || "",
      fechaPropuesta: lastProp?.fecha || "",
      respuestaTics: form.respuestaTics,
      descripcion: form.descripcion,
    };

    if (isCreate) {
      await createRequerimiento(payload);
    } else {
      await updateRequerimiento(id, payload);
    }
    navigate("/test-produccion");
  };

  const addOficioEnvio = () => {
    setForm((p) => ({
      ...p,
      oficioEnvio: [
        ...(p.oficioEnvio || []),
        { id: Date.now(), valor: "", version: (p.oficioEnvio || []).length + 1 },
      ],
    }));
  };
  const addFechaEnvio = () => {
    setForm((p) => ({
      ...p,
      fechaEnvio: [
        ...(p.fechaEnvio || []),
        { id: Date.now(), valor: "", version: (p.fechaEnvio || []).length + 1 },
      ],
    }));
  };
  const addPropuesta = () => {
    setForm((p) => ({
      ...p,
      propuesta: [
        ...(p.propuesta || []),
        {
          id: Date.now(),
          oficio: "",
          fecha: "",
          version: (p.propuesta || []).length + 1,
        },
      ],
    }));
  };

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6">
      {/* 🔹 Header como en Figma */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>

       

        <span className="flex items-center gap-2">
          <span className="font-medium">Jimmy Maila</span>
          <i className="fas fa-user" />
        </span>
      </div>

      {/* Línea superior */}
      <hr className="border-t-2 border-[#8B5E3C] mb-2" />

      {/* Título */}
      <div className="flex justify-between items-center bg-[#D6C7BF] p-3 rounded mb-2">
        <span className="font-bold text-white">TEST PRODUCCIÓN</span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="p-2 bg-[#8B5E3C] text-white rounded"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="p-2 bg-[#8B5E3C] text-white rounded"
            title="Guardar"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Línea inferior del título */}
      <hr className="border-t-2 border-[#8B5E3C] mb-6" />

      {/* ---- FORMULARIO ---- */}
      <div className="border rounded-xl p-4 space-y-6">
        {/* Primera fila */}
        <div className="grid grid-cols-4 gap-4">
          <ReadBox label="N° Requerimiento" value={form.numero} />
          <ReadBox label="Estado del requerimiento" value={form.estado} />
          <ReadBox label="Ejecutor" value={form.ejecutor} />
          <ReadBox label="Etapa de implementación" value={form.etapa} />
        </div>

        {/* Segunda fila */}
        <div className="grid grid-cols-2 gap-6">
          <SectionWithBox
            title="Oficio de envío a DMI"
            items={form.oficioEnvio}
            schema="oficio"
            onChange={(idItem, val) =>
              setForm((p) => ({
                ...p,
                oficioEnvio: (p.oficioEnvio || []).map((it) =>
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
                propuesta: (p.propuesta || []).map((it) =>
                  it.id === idItem ? { ...it, [field]: val } : it
                ),
              }))
            }
            onAdd={addPropuesta}
            isEditing={isEditing}
          />
        </div>

        {/* Tercera fila */}
        <div className="grid grid-cols-2 gap-6">
          <SectionWithBox
            title="Fecha"
            items={form.fechaEnvio}
            schema="fecha"
            onChangeFecha={(idItem, val) =>
              setForm((p) => ({
                ...p,
                fechaEnvio: (p.fechaEnvio || []).map((it) =>
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
              onChange={(v) => setForm((p) => ({ ...p, respuestaTics: v }))}
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

      {/* Línea final y GIF */}
      <hr className="border-t-2 border-[#8B5E3C] mt-6 mb-4" />
      <div className="flex justify-center">
        <img src="/metro-responsive.gif" alt="Municipio de Quito" className="h-24" />
      </div>
    </div>
  );
}

/* ---- SUBCOMPONENTES ---- */

function ReadBox({ label, value }) {
  return (
    <div>
      <label className="block font-bold mb-1">{label}</label>
      <div className="bg-[#D6C7BF] px-3 py-2 rounded">{value || "—"}</div>
    </div>
  );
}

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
        {(items || []).map((it) => (
          <div key={it.id} className="flex items-center gap-3 mb-2">
            {schema === "oficio" && (
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1">
                  Envío de requerimiento
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={it.valor || ""}
                    onChange={(e) => onChange?.(it.id, e.target.value)}
                    className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
                  />
                ) : (
                  <div className="bg-[#D6C7BF] px-3 py-2 rounded">
                    {it.valor || "—"}
                  </div>
                )}
              </div>
            )}

            {schema === "propuesta" && (
              <>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">
                    Oficio de recepción
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={it.oficio || ""}
                      onChange={(e) =>
                        onChangePropuesta?.(it.id, "oficio", e.target.value)
                      }
                      className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
                    />
                  ) : (
                    <div className="bg-[#D6C7BF] px-3 py-2 rounded">
                      {it.oficio || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Fecha</div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={(it.fecha || "").slice(0, 10)}
                      onChange={(e) =>
                        onChangePropuesta?.(it.id, "fecha", e.target.value)
                      }
                      className="bg-[#D6C7BF] px-3 py-2 rounded"
                    />
                  ) : (
                    <div className="bg-[#D6C7BF] px-3 py-2 rounded">
                      {(it.fecha || "").slice(0, 10) || "—"}
                    </div>
                  )}
                </div>
              </>
            )}

            {schema === "fecha" && (
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1">
                  Envío de requerimiento
                </div>
                {isEditing ? (
                  <input
                    type="date"
                    value={(it.valor || "").slice(0, 10)}
                    onChange={(e) => onChangeFecha?.(it.id, e.target.value)}
                    className="w-full bg-[#D6C7BF] px-3 py-2 rounded"
                  />
                ) : (
                  <div className="bg-[#D6C7BF] px-3 py-2 rounded">
                    {(it.valor || "").slice(0, 10) || "—"}
                  </div>
                )}
              </div>
            )}

            <span className="bg-[#D6C7BF] px-3 py-2 rounded text-sm font-semibold">
              Versión
            </span>
            <input
              readOnly
              value={it.version}
              className="w-12 text-center border rounded py-2"
              title={`Versión ${it.version}`}
            />
          </div>
        ))}
        {isEditing && (
          <button
            onClick={onAdd}
            className="p-2 border border-[#8B5E3C] rounded-full text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white"
            title="Añadir versión"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
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
