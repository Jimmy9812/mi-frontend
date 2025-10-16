// src/pages/SirecqEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSirecq,
  createSirecq,
  updateSirecq,
  listDependencias,
  addVersionToSirecq,
} from "../services/sirecqService";

// Catálogos fijos
const sistemas = ["SIREC-Q", "STL", "SUIM", "CERTIFICADOS", "DBB"];
const estados = ["Enviado", "Devuelto", "Test", "Producción", "En revisión", "Atendido"];
const clasificaciones = ["A", "B", "C"];

export default function SirecqEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const isCreate = mode === "create";

  const [editMode, setEditMode] = useState(isCreate);
  const [loading, setLoading] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [dependencias, setDependencias] = useState([]);


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
    fecha_envio_dmc: "",
    estado: "",
    tecnico_desarrollo: "",
    descripcion: "",
    observaciones: "",
    obsv_tecnica: "",
    requerimientoId: null,
  });

  // Cargar datos si es modo edición
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 🔹 Cargar dependencias desde backend
        const deps = await listDependencias({ token });
        setDependencias(deps);

        if (isCreate) {
          setVersiones([{
            num_version: 1,
            ofi_desp_pt: "",
            fech_desp_pt: "",
            oficioenviodmi: "",
            fechaenvioreq: "",
            obs_version: "",
            isLoaded: false
          }]);
          setLoading(false);
          return;
        }

        // 🔹 Cargar datos de Sirecq existente
        const data = await getSirecq(id, { token });
        const req = data?.sirecqExterno?.requerimiento;
        const tecnico = data?.usuariosSirecq?.[1]?.rolUsuario?.usuario;
        const analista = req?.rolUsuario?.usuario;

        setRequerimiento({
          requerimientoId: req?.id_requerimiento || null,
          numero: req?.no_requerimiento || "",
          tramite_priorizado: req?.tema || "",
          tramite_cat: data?.sirecqExterno?.tramitecat || "",
          prioridad: req?.id_categoria || "",
          // ✅ ahora mapeamos correctamente la dependencia completa
          dependencia: data?.sirecqExterno?.dependencia || null,
          seguimiento: data?.sirecqExterno?.seguimientoinst || "",
          clasificacion: (() => {
            const id = data?.clasifCatastral?.id_clasif_catastral;
            return id === 1 ? "A" : id === 2 ? "B" : id === 3 ? "C" : "";
          })(),
          sistema: req?.sistema?.nom_sistema || "SIREC-Q",
          responsable: analista ? `${analista.nombre_usuario} ${analista.apellidos_usuario}`.trim() : "",
          fecha_envio_dmc: data?.fecha_env_dmc 
            ? new Date(data.fecha_env_dmc + "T12:00:00").toISOString().split("T")[0] 
            : req?.fecha_registro?.slice(0, 10) || "",
          estado: req?.estadoRequerimiento?.nombre_estado_requerimiento || "Enviado",
          tecnico_desarrollo: tecnico ? `${tecnico.nombre_usuario} ${tecnico.apellidos_usuario}`.trim() : "",
          descripcion: req?.descripcion || "",
          observaciones: data?.sirecqExterno?.observacionesgen || "",
          obsv_tecnica: data?.obsv_tecnica || "",
        });

        // 🔹 Cargar versiones
        const loaded = req?.requerimientoVersiones?.map(v => ({
          ...v.versionamiento,
          isLoaded: true,
          fech_desp_pt: v.versionamiento?.fech_desp_pt 
            ? new Date(v.versionamiento.fech_desp_pt).toISOString().split("T")[0]
            : "",
          fechaenvioreq: v.versionamiento?.fechaenvioreq
            ? new Date(v.versionamiento.fechaenvioreq).toISOString().split("T")[0]
            : "",
        })) || [];

        if (loaded.length === 0) {
          loaded.push({
            num_version: 1,
            ofi_desp_pt: "",
            fech_desp_pt: "",
            oficioenviodmi: "",
            fechaenvioreq: "",
            obs_version: "",
            isLoaded: false,
          });
        }

        setVersiones(loaded);
      } catch (err) {
        console.error("❌ Error al cargar datos del SIRECQ Interno:", err);
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

  const handleVersionChange = (index, field, value) => {
    setVersiones((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: value, _edited: true } : v
      )
    );
  };


  const handleAddVersion = () => {
    const loadedVersions = versiones.filter(v => v.isLoaded);
    const maxVersion = loadedVersions.length > 0 
      ? Math.max(...loadedVersions.map(v => v.num_version || 0)) 
      : 0;
    const nextVersion = maxVersion + 1;
    
    setVersiones(prev => [...prev, {
      num_version: nextVersion,
      ofi_desp_pt: "",
      fech_desp_pt: "",
      oficioenviodmi: "",
      fechaenvioreq: "",
      obs_version: "",
      isLoaded: false
    }]);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    // Validaciones
    if (!requerimiento.numero?.trim()) {
      alert("❌ El número de requerimiento es requerido.");
      return;
    }
    if (!requerimiento.descripcion?.trim()) {
      alert("❌ La descripción es requerida.");
      return;
    }

    try {
      setLoading(true);

      const v1 = versiones[0] || {};

      const payload = {
  fecha_env_dmc: requerimiento.fecha_envio_dmc || null,
  obsv_tecnica: requerimiento.obsv_tecnica || "--",
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

    // 🔹 AQUI AÑADIMOS EL BLOQUE DE VERSIONES CORRECTO
        versiones: [
      {
        num_version: 1,
        ofi_desp_pt: versiones[0]?.ofi_desp_pt || "",
        fech_desp_pt: versiones[0]?.fech_desp_pt || null,
        oficioenviodmi: versiones[0]?.oficioenviodmi || "",
        fechaenvioreq: versiones[0]?.fechaenvioreq || null,
        obs_version: versiones[0]?.obs_version || "",
      },
    ],


  },

  sirecqExterno: {
    tramitepr: requerimiento.tramite_priorizado,
    seguimientoinst: requerimiento.seguimiento,
    tramitecat: requerimiento.tramite_cat,
    observacionesgen: requerimiento.observaciones || "",
    id_dependencia: requerimiento.dependencia?.id_dependencia || 1,
  },
};

      if (isCreate) {
        const response = await createSirecq({ token, payload });
        alert("✅ SIRECQ Interno creado correctamente");
        navigate("/sirecq-interno");
      } else {
  // ⚙️ Construir payload base
  const payload = {
    fecha_env_dmc: requerimiento.fecha_envio_dmc || null,
    obsv_tecnica: requerimiento.obsv_tecnica || "--",
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

  // 🆕 Detectar versiones modificadas y nuevas
  const modificadas = versiones.filter((v) => v.isLoaded && v._edited);
  const nuevas = versiones.filter((v) => !v.isLoaded);

  // 🆕 Caso: nueva versión
  if (nuevas.length > 0) {
    const ultima = nuevas[nuevas.length - 1];
    payload.versionamiento = {
      num_version: ultima.num_version || 1,
      ofi_desp_pt: ultima.ofi_desp_pt || "",
      fech_desp_pt: ultima.fech_desp_pt || null,
      oficioenviodmi: ultima.oficioenviodmi || "",
      fechaenvioreq: ultima.fechaenvioreq || null,
      obs_version: ultima.obs_version || "",
    };
  }

  // 🧩 Caso: versiones modificadas → se actualizan directamente
  for (const v of modificadas) {
    await fetch(`${import.meta.env.VITE_API_URL}/versionamiento/${v.id_version}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ofi_desp_pt: v.ofi_desp_pt,
        fech_desp_pt: v.fech_desp_pt,
        oficioenviodmi: v.oficioenviodmi,
        fechaenvioreq: v.fechaenvioreq,
        obs_version: v.obs_version,
      }),
    });
  }

  // ✅ Actualizar Sirecq con posible nueva versión
  await updateSirecq({ token, id, payload });
  alert("✅ SIRECQ Interno actualizado correctamente");

  // 🔄 Recargar datos actualizados del backend
  const refreshed = await getSirecq(id, { token });
  const req = refreshed?.sirecqExterno?.requerimiento;
  setRequerimiento((prev) => ({
    ...prev,
    descripcion: req?.descripcion || prev.descripcion,
  }));
  setVersiones(
    req?.requerimientoVersiones?.map(v => ({
      ...v.versionamiento,
      isLoaded: true,
      fech_desp_pt: v.versionamiento?.fech_desp_pt
        ? new Date(v.versionamiento.fech_desp_pt).toISOString().split('T')[0]
        : '',
      fechaenvioreq: v.versionamiento?.fechaenvioreq
        ? new Date(v.versionamiento.fechaenvioreq).toISOString().split('T')[0]
        : ''
    })) || []
  );

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
                  value={requerimiento.dependencia?.id_dependencia || ""}
                  onChange={(e) => {
                    const selected = dependencias.find(
                      (d) => d.id_dependencia === Number(e.target.value)
                    );
                    setRequerimiento((prev) => ({ ...prev, dependencia: selected }));
                  }}
                  className="w-40 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-1 focus:ring-[#0891B2]"
                >
                  <option value="">Seleccione...</option>
                  {dependencias.map((dep) => (
                    <option key={dep.id_dependencia} value={dep.id_dependencia}>
                      {dep.sigla_dependencia} - {dep.nombre_dependencia}
                    </option>
                  ))}
                </select>

                ) : (
                  <span className="bg-white px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
                    {requerimiento.dependencia?.sigla_dependencia ||
                    requerimiento.dependencia?.nombre_dependencia ||
                    ""}
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

          {/* Sección 2 - Detalles adicionales */}
          <div className="border-2 border-[#0891B2] rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <SimpleField
                label="Responsable(Analista Catastral)"
                value={requerimiento.responsable}
                name="responsable"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
              <DateFieldComp
                label="Fecha de envío por la DMC"
                value={requerimiento.fecha_envio_dmc}
                name="fecha_envio_dmc"
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
                label="Técnico DMSIST para desarrollo"
                value={requerimiento.tecnico_desarrollo}
                name="tecnico_desarrollo"
                onChange={handleChange}
                editMode={editMode || isCreate}
              />
            </div>
          </div>

          {/* Sección 3 - Versiones */}
          <div className="space-y-4">
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
                className="px-4 py-2 bg-[#0891B2] text-white rounded hover:bg-[#0E7490] transition"
              >
                + Añadir versión
              </button>
            )}
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
                  name="obsv_tecnica"
                  value={requerimiento.obsv_tecnica}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-blue-50 resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-blue-50 rounded text-gray-700 min-h-[120px]">
                  {requerimiento.obsv_tecnica}
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

function VersionBlock({ version, index, onChange, editMode }) {
  return (
    <div className="border-2 border-[#0891B2] rounded-xl p-5">
      <h3 className="font-bold mb-3 text-[#0891B2]">Versión {version.num_version}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SimpleField
          label="Oficio despacho propuesta técnica"
          name="ofi_desp_pt"
          value={version.ofi_desp_pt || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <DateFieldComp
          label="Fecha despacho propuesta técnica"
          name="fech_desp_pt"
          value={version.fech_desp_pt || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <SimpleField
          label="Oficios de envío a DMI"
          name="oficioenviodmi"
          value={version.oficioenviodmi || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <DateFieldComp
          label="Fecha de envío requerimiento"
          name="fechaenvioreq"
          value={version.fechaenvioreq || ""}
          onChange={(e) => onChange(index, e.target.name, e.target.value)}
          editMode={editMode}
        />

        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1 text-gray-700">
            Observaciones del Versionamiento
          </label>
          {editMode ? (
            <textarea
              name="obs_version"
              value={version.obs_version || ""}
              onChange={(e) => onChange(index, 'obs_version', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-blue-50"
              rows={4}
            />
          ) : (
            <div className="w-full px-3 py-2 text-sm bg-blue-50 rounded text-gray-700">
              {version.obs_version || ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
