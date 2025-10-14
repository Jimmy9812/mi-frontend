// src/pages/SirecqEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSirecq,
  createSirecq,
  updateSirecq,
} from "../services/sirecqService";

// Catálogos fijos (sin tocar)
const sistemas = ["SIREC-Q", "STL", "SUIM", "CERTIFICADOS", "DBB"];
const dependencias = ["DMSIST", "DMC", "DMF"];
const estados = ["Enviado", "Devuelto", "Test", "Producción", "En revisión", "Atendido"];
const clasificaciones = ["A", "B", "C"];

export default function SirecqEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const isCreate = mode === "create";

  const [editMode, setEditMode] = useState(isCreate);
  const [loading, setLoading] = useState(false);

  // Estado inicial vacío
  const [requerimiento, setRequerimiento] = useState({
    numero: "",
    tramite_priorizado: "",
    tramite_cat: "",
    prioridad: "",
    dependencia: "",
    seguimiento: "",
    clasificacion: "",
    sistema: "",
    responsable: "",
    oficio_despacho: "",
    fecha_envio_dmc: "",
    fecha_envio_req: "",
    estado: "",
    oficios_envio_dmi: "",
    fecha_despacho: "",
    tecnico_desarrollo: "",
    descripcion: "",
    observaciones: "",
    observacion_tics: "",
  });

  // Cargar datos si es modo edición
  // Cargar datos si es modo edición
  useEffect(() => {
    const fetchData = async () => {
      if (isCreate) return;
      try {
        setLoading(true);
        const data = await getSirecq(id, { token });

        // 🔍 Mapeo según la estructura real del backend
        const req = data?.sirecqExterno?.requerimiento;
        const version = req?.requerimientoVersiones?.[0]?.versionamiento || {};
        const tecnico = data?.usuariosSirecq?.[0]?.rolUsuario?.usuario;
        const analista = req?.rolUsuario?.usuario;

        setRequerimiento({
          numero: req?.no_requerimiento || "",
          tramite_priorizado: req?.tema || "",
          tramite_cat: data?.sirecqExterno?.tramitecat || "",
          prioridad: req?.id_categoria || "",
          dependencia: data?.sirecqExterno?.dependencia?.sigla_dependencia || data?.sirecqExterno?.dependencia?.nombre_dependencia || "DMSIST",
          seguimiento: data?.sirecqExterno?.seguimientoinst || "",
          clasificacion: data?.clasifCatastral?.nombre || "",
          sistema: req?.sistema?.nom_sistema || "SIREC-Q",
          responsable: analista ? `${analista.nombre_usuario} ${analista.apellidos_usuario}`.trim() : "",
          oficio_despacho: version?.ofi_desp_pt || "",
          fecha_envio_dmc: data?.fecha_env_dmc || req?.fecha_registro?.slice(0, 10) || "",
          fecha_envio_req: version?.fechaenvioreq || "",
          estado: req?.estadoRequerimiento?.nombre_estado_requerimiento || "Enviado",
          oficios_envio_dmi: version?.oficioenviodmi || "",
          fecha_despacho: version?.fech_desp_pt || "",
          tecnico_desarrollo: tecnico ? `${tecnico.nombre_usuario} ${tecnico.apellidos_usuario}`.trim() : "",
          descripcion: req?.descripcion || "",
          observaciones: data?.obsv_tecnica || data?.sirecqExterno?.observacionesgen || "",
          observacion_tics: "",
        });
      } catch (err) {
        console.error("❌ Error al cargar el SIRECQ Interno:", err);
        alert("Error al cargar los datos del registro.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isCreate, token]);


  // Manejo de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequerimiento((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar (crear o actualizar)
// Guardar (crear o actualizar)
const handleSave = async () => {
  try {
    setLoading(true);

    const payload = {
      fecha_env_dmc: requerimiento.fecha_envio_dmc || null,
      obsv_tecnica: requerimiento.observaciones || "",
      id_clasif_catastral:
        requerimiento.clasificacion === "A"
          ? 1
          : requerimiento.clasificacion === "B"
          ? 2
          : 3,
      id_analista: 1,
      id_tecnico: 2,
      requerimiento: {
        no_requerimiento: requerimiento.numero,
        tema: requerimiento.tramite_priorizado,
        descripcion: requerimiento.descripcion,
        fase: "Requisito",
        fecha_registro: new Date().toISOString().split("T")[0],
        id_estado_requerimiento: 5,
        id_categoria: Number(requerimiento.prioridad) || 1,
        id_sistema:
          sistemas.findIndex((s) => s === requerimiento.sistema) + 1 || 1,
        id_rol_usuario: 3,
      },
      sirecqExterno: {
        tramitepr: requerimiento.tramite_priorizado,
        seguimientoinst: requerimiento.seguimiento,
        tramitecat: requerimiento.tramite_cat,
        observacionesgen: requerimiento.observaciones || "",
        id_dependencia:
          dependencias.findIndex((d) => d === requerimiento.dependencia) + 1 || 1,
      },
    };

    if (isCreate) {
      const response = await createSirecq({ token, payload });
      const newRecord = response?.data; // ✅ tu backend devuelve dentro de 'data'

      console.log("🟢 Nuevo registro creado:", newRecord);

      setRequerimiento({
        numero: newRecord?.sirecqExterno?.requerimiento?.no_requerimiento || "",
        tramite_priorizado: newRecord?.sirecqExterno?.requerimiento?.tema || "",
        tramite_cat: newRecord?.sirecqExterno?.tramitecat || "",
        prioridad:
          newRecord?.sirecqExterno?.requerimiento?.categoria?.id_categoria || "",
        dependencia:
          newRecord?.sirecqExterno?.dependencia?.sigla_dependencia ||
          newRecord?.sirecqExterno?.dependencia?.nombre_dependencia ||
          "",
        seguimiento: newRecord?.sirecqExterno?.seguimientoinst || "",
        clasificacion:
          newRecord?.clasifCatastral?.nombre_clasif_catastral || "",
        sistema:
          newRecord?.sirecqExterno?.requerimiento?.sistema?.nom_sistema || "",
        responsable:
          newRecord?.sirecqExterno?.requerimiento?.rolUsuario?.usuario
            ? `${newRecord.sirecqExterno.requerimiento.rolUsuario.usuario.nombre_usuario} ${newRecord.sirecqExterno.requerimiento.rolUsuario.usuario.apellidos_usuario}`
            : "",
        oficio_despacho: "",
        fecha_envio_dmc: newRecord?.fecha_env_dmc || "",
        fecha_envio_req:
          newRecord?.sirecqExterno?.requerimiento?.fecha_registro || "",
        estado:
          newRecord?.sirecqExterno?.requerimiento?.estadoRequerimiento
            ?.nombre_estado_requerimiento || "En revisión",
        oficios_envio_dmi: "",
        fecha_despacho: "",
        tecnico_desarrollo:
          newRecord?.usuariosSirecq?.[1]?.rolUsuario?.usuario
            ? `${newRecord.usuariosSirecq[1].rolUsuario.usuario.nombre_usuario} ${newRecord.usuariosSirecq[1].rolUsuario.usuario.apellidos_usuario}`
            : "",
        descripcion: newRecord?.sirecqExterno?.requerimiento?.descripcion || "",
        observaciones:
          newRecord?.obsv_tecnica ||
          newRecord?.sirecqExterno?.observacionesgen ||
          "",
        observacion_tics: "",
      });

      alert("✅ SIRECQ Interno creado correctamente");
      setEditMode(false);
    } else {
      const response = await updateSirecq({ token, id, payload });
      const updatedRecord = response?.data;

      console.log("🟢 Registro actualizado:", updatedRecord);
      alert("✅ SIRECQ Interno actualizado correctamente");
      setEditMode(false);
    }
  } catch (err) {
    console.error("❌ Error al guardar:", err);
    alert("Error al guardar el registro.");
  } finally {
    setLoading(false);
  }
};


  if (loading) return <div className="p-6">Cargando...</div>;

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
          {user?.nombre || "José Campoverde"}
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs">
            {(user?.nombre || "J")[0]}
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
      {/* -------------- PEGAR TU CÓDIGO VISUAL ORIGINAL AQUÍ -------------- */}


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
