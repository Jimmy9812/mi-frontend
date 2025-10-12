import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Datos de ejemplo (reemplazar con tus servicios reales)
const sistemas = ["SIREC-Q", "STL", "SUIM", "CERTIFICADOS", "DBB"];
const dependencias = ["DMSIST", "DMC", "DMF"];
const estados = ["Enviado", "Devuelto", "Test", "Producción", "En revisión", "Atendido"];
const clasificaciones = ["A", "B", "C"];

export default function SirecqEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(false);

  const [requerimiento, setRequerimiento] = useState({
    numero: "RSW_SIREC-Q_2024_005",
    tramite_priorizado: "ACTUALIZACIÓN DE PREDIOS",
    tramite_cat: "CAT-42, CAT-43",
    prioridad: "1",
    dependencia: "DMSIST",
    seguimiento: "Contraloría General del Estado - Cartera Vencida",
    clasificacion: "A",
    sistema: "SIREC-Q",
    responsable: "José Campoverde",
    oficio_despacho: "GADDMQ-SHOT-DMC-2025-0387-M",
    fecha_envio_dmc: "2025-04-21",
    fecha_envio_req: "2024-10-13",
    estado: "Enviado",
    oficios_envio_dmi: "GADDMQ-SHOT-DMC-2024-2114-O",
    fecha_despacho: "2024-05-07",
    tecnico_desarrollo: "Leonardo Tuguminago",
    descripcion:
      "Implementación de controles para validación de campos determinados en el informe presentado por la Contraloría General del Estado específicamente en la recomendación 9 y 10.",
    observaciones:
      "Mediante Memorando Nro. GADDMQ-SGDTIC-DMSIST-2025-00202-M, de 13 de mayo de 2025, la DMSIST informa que el desarrollo inicia el 14 de mayo de 2025 y tentativamente estaría implementado hasta el 30 de mayo de 2025.",
    observacion_tics:
      "LA DMSIST INFORMA QUE SE ENCUENTRA TERMINADO EL DESARROLLO, EN ESTE SENTIDO SE ENCUENTRA A LA ESPERA DE LA APROBACIÓN DEL RSW_SIREC-Q_2024_019.",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequerimiento((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      console.log("💾 Guardando requerimiento:", requerimiento);
      alert("✅ Requerimiento guardado correctamente");
      setEditMode(false);
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      alert("Error al guardar el requerimiento");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const isCreate = mode === "create";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4 bg-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-[#0891B2] font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-700 hover:text-[#0891B2]"
        >
          <Home className="w-5 h-5" />
          Home
        </button>

        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          José Campoverde
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs">
            J
          </div>
        </span>
      </div>

      <div className="h-1 bg-[#0891B2]"></div>

      {/* Banner título */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#E0F2FE] border-b border-[#0891B2]">
        <h1 className="text-2xl font-bold text-[#0891B2]">SIREC-Q</h1>
        <button
          onClick={() => {
            if (editMode) handleSave();
            else setEditMode(true);
          }}
          className="p-2 bg-[#0891B2] text-white rounded hover:bg-[#0E7490] transition flex items-center justify-center"
          title={editMode ? "Guardar" : "Editar"}
        >
          {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
        </button>
      </div>

      <div className="h-1 bg-[#0891B2] mb-6"></div>

      {/* Contenido Principal */}
      <div className="px-8 flex flex-col xl:flex-row gap-6">
        {/* Columna Izquierda */}
        <div className="flex-1 space-y-6">
          {/* Sección 1 - Datos principales */}
          <div className="border-2 border-[#0891B2] rounded-xl overflow-hidden p-5">
            {/* Fila 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <SimpleField
                label="N° Requerimiento"
                value={requerimiento.numero}
                name="numero"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <SimpleField
                label="Trámite priorizado relacionado"
                value={requerimiento.tramite_priorizado}
                name="tramite_priorizado"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <SimpleField
                label="Trámite CAT"
                value={requerimiento.tramite_cat}
                name="tramite_cat"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
            </div>

            {/* Bloque visual azul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Prioridad */}
              <div className="flex items-center justify-between bg-[#E0F2FE] rounded-lg px-4 py-2">
                <label className="text-sm font-bold text-[#0891B2]">Prioridad</label>
                {editMode ? (
                  <input
                    type="number"
                    name="prioridad"
                    value={requerimiento.prioridad}
                    onChange={handleChange}
                    className="w-24 text-center border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-1 focus:ring-[#0891B2]"
                  />
                ) : (
                  <span className="bg-white px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
                    {requerimiento.prioridad}
                  </span>
                )}
              </div>

              {/* Clasificación */}
              <div className="flex items-center justify-between bg-[#E0F2FE] rounded-lg px-4 py-2">
                <label className="text-sm font-bold text-[#0891B2]">
                  Clasificación catastral
                </label>
                {editMode ? (
                  <select
                    name="clasificacion"
                    value={requerimiento.clasificacion}
                    onChange={handleChange}
                    className="w-24 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-1 focus:ring-[#0891B2]"
                  >
                    {clasificaciones.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-white px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
                    {requerimiento.clasificacion}
                  </span>
                )}
              </div>

              {/* Dependencia */}
              <div className="flex items-center justify-between bg-[#E0F2FE] rounded-lg px-4 py-2">
                <label className="text-sm font-bold text-[#0891B2]">Dependencia</label>
                {editMode ? (
                  <select
                    name="dependencia"
                    value={requerimiento.dependencia}
                    onChange={handleChange}
                    className="w-32 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-1 focus:ring-[#0891B2]"
                  >
                    {dependencias.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-white px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
                    {requerimiento.dependencia}
                  </span>
                )}
              </div>

              {/* Sistema Afectar */}
              <div className="flex items-center justify-between bg-[#E0F2FE] rounded-lg px-4 py-2">
                <label className="text-sm font-bold text-[#0891B2]">Sistema Afectar</label>
                {editMode ? (
                  <select
                    name="sistema"
                    value={requerimiento.sistema}
                    onChange={handleChange}
                    className="w-32 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-1 focus:ring-[#0891B2]"
                  >
                    {sistemas.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-white px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
                    {requerimiento.sistema}
                  </span>
                )}
              </div>
            </div>

            {/* Seguimiento */}
            <div className="mt-4">
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Seguimiento Institucional
              </label>
              {editMode ? (
                <input
                  type="text"
                  name="seguimiento"
                  value={requerimiento.seguimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-blue-50"
                />
              ) : (
                <div className="w-full px-3 py-2 text-sm bg-blue-50 rounded text-gray-700">
                  {requerimiento.seguimiento}
                </div>
              )}
            </div>
          </div>

          {/* Sección 2 - Detalles */}
          <div className="border-2 border-[#0891B2] rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <SimpleField
                label="Responsable(Analista Catastral)"
                value={requerimiento.responsable}
                name="responsable"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <SimpleField
                label="Oficio despacho propuesta técnica"
                value={requerimiento.oficio_despacho}
                name="oficio_despacho"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <DateFieldComp
                label="Fecha de envío por la DMC"
                value={requerimiento.fecha_envio_dmc}
                name="fecha_envio_dmc"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <DateFieldComp
                label="Fecha de envío requerimiento"
                value={requerimiento.fecha_envio_req}
                name="fecha_envio_req"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <SimpleField
                label="Estado del requerimiento"
                value={requerimiento.estado}
                name="estado"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SimpleField
                label="Oficios de envío a DMI"
                value={requerimiento.oficios_envio_dmi}
                name="oficios_envio_dmi"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <DateFieldComp
                label="Fecha despacho propuesta técnica"
                value={requerimiento.fecha_despacho}
                name="fecha_despacho"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <SimpleField
                label="Técnico DMSIST para desarrollo"
                value={requerimiento.tecnico_desarrollo}
                name="tecnico_desarrollo"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="w-full xl:w-[420px] space-y-6">
          {/* Descripción */}
          <div className="border-2 border-[#0891B2] rounded-xl overflow-hidden">
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800">Descripción</h3>
            </div>
            <div className="p-4">
              {editMode || isCreate ? (
                <textarea
                  name="descripcion"
                  value={requerimiento.descripcion}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-blue-50 resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-blue-50 rounded text-gray-700 min-h-[120px]">
                  {requerimiento.descripcion}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones Generales */}
          <div className="border-2 border-[#0891B2] rounded-xl overflow-hidden">
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800">
                Observaciones Generales
              </h3>
            </div>
            <div className="p-4">
              {editMode || isCreate ? (
                <textarea
                  name="observaciones"
                  value={requerimiento.observaciones}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-blue-50 resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-blue-50 rounded text-gray-700 min-h-[120px]">
                  {requerimiento.observaciones}
                </div>
              )}
            </div>
          </div>

          {/* Observación TICS */}
          <div className="border-2 border-[#0891B2] rounded-xl overflow-hidden">
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800">Observación TICS</h3>
            </div>
            <div className="p-4">
              {editMode || isCreate ? (
                <textarea
                  name="observacion_tics"
                  value={requerimiento.observacion_tics}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-blue-50 resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-blue-50 rounded text-gray-700 min-h-[120px]">
                  {requerimiento.observacion_tics}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 bg-[#0891B2] mx-8 my-6"></div>

      {/* GIF al final */}
      <div className="flex justify-center pb-8">
        <img src="/metro-responsive.gif" alt="Loading" className="h-32" />
      </div>
    </div>
  );
}

/* ================= Componentes ================= */
function SimpleField({ label, name, value, onChange, editMode, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 text-gray-700">{label}</label>
      {editMode ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-blue-50"
        />
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-blue-50 rounded text-gray-700">
          {value || ""}
        </div>
      )}
    </div>
  );
}

function DateFieldComp({ label, name, value, onChange, editMode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 text-gray-700">{label}</label>
      {editMode ? (
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-blue-50"
        />
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-blue-50 rounded text-gray-700">
          {value || ""}
        </div>
      )}
    </div>
  );
}
