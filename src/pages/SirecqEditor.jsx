// src/pages/SirecqEditor.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Home, Trash } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSirecq,
  createSirecq,
  updateSirecq,
  listDependencias,
  listClasificaciones,
  listSistemas,
  listEstadosRequerimiento,
  listAnalistas,
  deleteSirecq,
  addVersionToSirecq,
} from "../services/sirecqService";

// Catálogos fijos
const estados = ["Enviado", "Devuelto", "Test", "Producción", "En revisión", "Atendido"];

export default function SirecqEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, activeRole } = useAuth();


  const isCreate = mode === "create";

  const [editMode, setEditMode] = useState(isCreate);
  const [loading, setLoading] = useState(false);
  const [versiones, setVersiones] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [clasificacionesList, setClasificacionesList] = useState([]);
  const [sistemasList, setSistemasList] = useState([]);
  const [estadosList, setEstadosList] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  




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
    responsable: "",       // nombre legible
    id_responsable: null,  // id numérico del usuario responsable
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

        // 🔹 Cargar clasificaciones y sistemas
        const clasif = await listClasificaciones({ token });
        setClasificacionesList(clasif);

        const sist = await listSistemas({ token });
        setSistemasList(sist);

        // 🔹 Cargar estados de requerimiento
        const estados = await listEstadosRequerimiento({ token });
        setEstadosList(estados);






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
        const responsable = req?.rolUsuario?.usuario;

        setRequerimiento({
          requerimientoId: req?.id_requerimiento || null,
          numero: req?.no_requerimiento || "",
          tramite_priorizado: req?.tema || "",
          tramite_cat: data?.sirecqExterno?.tramitecat || "",
          //prioridad: req?.id_categoria || "",
          prioridad: data?.prioridad ?? "", 
          tecnico_desarrollo: data?.tecnico || "",


          // ✅ ahora mapeamos correctamente la dependencia completa
          dependencia: data?.sirecqExterno?.dependencia || null,
          seguimiento: data?.sirecqExterno?.seguimientoinst || "",
           // ✅ Clasificación: guardamos también el id para preseleccionar
          id_clasif_catastral: data?.clasifCatastral?.id_clasif_catastral || "",
          clasificacion: data?.clasifCatastral?.nombre_clasif_catastral || "",

          // ✅ Sistema: guardamos tanto el id como el objeto
          id_sistema: req?.sistema?.id_sistema || "",
          sistema: req?.sistema || null,
          id_responsable: responsable?.id_usuario || null,
          responsable: responsable? `${responsable.nombre_usuario} ${responsable.apellidos_usuario}`.trim(): "",
          fecha_envio_dmc: data?.fecha_env_dmc 
            ? new Date(data.fecha_env_dmc + "T12:00:00").toISOString().split("T")[0] 
            : req?.fecha_registro?.slice(0, 10) || "",
          estado: req?.estadoRequerimiento?.nombre_estado_requerimiento || "Enviado",
          //tecnico_desarrollo: tecnico ? `${tecnico.nombre_usuario} ${tecnico.apellidos_usuario}`.trim() : "",
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


  // 🔹 Cargar analistas desde backend
useEffect(() => {
  async function fetchAnalistas() {
    try {
      const data = await listAnalistas({ token });
      console.log("📋 Analistas cargados:", data); // 👈 agrega este log
      setAnalistas(data);
    } catch (error) {
      console.error("Error al cargar analistas:", error);
    }
  }
  fetchAnalistas();
}, [token]);

// 🔄 Sincroniza responsable cada vez que cambian analistas o el id_responsable
  useEffect(() => {
    if (analistas.length === 0) return;
    if (!requerimiento.id_responsable) return;

    const found = analistas.find(
      (a) => Number(a.id_usuario) === Number(requerimiento.id_responsable)
    );

    if (found && requerimiento.responsable !== found.nombre_completo) {
      setRequerimiento((prev) => ({
        ...prev,
        responsable: found.nombre_completo,
      }));
    }
  }, [analistas, requerimiento.id_responsable]);





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


      // 🗑️ Eliminar registro
      const handleDelete = async () => {
        if (!window.confirm("¿Seguro que deseas eliminar este registro SIRECQ Interno?")) return;

        try {
          await deleteSirecq({ token, id });
          alert("✅ Registro eliminado correctamente");
          navigate("/sirecq");
        } catch (err) {
          console.error("❌ Error eliminando:", err);
          alert("❌ Error al eliminar el registro.");
        }
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
  prioridad: Number(requerimiento.prioridad) || null, // ✅ campo directo de SirecqInterno
  tecnico: requerimiento.tecnico_desarrollo || "", // ✅ nuevo campo técnico DMSIST
  id_clasif_catastral: Number(requerimiento.id_clasif_catastral) || null,
  id_responsable: requerimiento.id_responsable || null,
  id_tecnico: 2,

  requerimiento: {
    no_requerimiento: requerimiento.numero,
    tema: requerimiento.tramite_priorizado,
    descripcion: requerimiento.descripcion,
    fase: "Requisito",
    fecha_registro: new Date().toISOString().split("T")[0],
    id_estado_requerimiento: Number(requerimiento.id_estado_requerimiento) || 5,
    //id_categoria: Number(requerimiento.prioridad) || 1,
    id_sistema: Number(requerimiento.id_sistema) || null,
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
console.log("📤 Payload enviado al backend:", payload);

      if (isCreate) {
        const response = await createSirecq({ token, payload });
        alert("✅ SIRECQ Interno creado correctamente");
        navigate("/sirecq-interno");
      } else {
  // ⚙️ Construir payload base
  const payload = {
    fecha_env_dmc: requerimiento.fecha_envio_dmc || null,
    obsv_tecnica: requerimiento.obsv_tecnica || "--",
    prioridad: Number(requerimiento.prioridad) || null,// ✅ ahora sí se envía
    tecnico: requerimiento.tecnico_desarrollo?.trim() || null, // ✅ ahora sí se envía
    id_clasif_catastral: Number(requerimiento.id_clasif_catastral) || null,
    id_tecnico: 2,
    requerimiento: {
      no_requerimiento: requerimiento.numero,
      tema: requerimiento.tramite_priorizado,
      descripcion: requerimiento.descripcion,
      fase: "Requisito",
      id_estado_requerimiento: Number(requerimiento.id_estado_requerimiento) || 5,
      //id_categoria: Number(requerimiento.prioridad) || 1,
      id_sistema: Number(requerimiento.id_sistema) || 1, // ✅ ← corrección
      id_rol_usuario: requerimiento.id_responsable || null,
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
// ✅ Actualizar Sirecq con posible nueva versión
await updateSirecq({ token, id, payload });
alert("✅ SIRECQ Interno actualizado correctamente");

// 🔄 Recargar datos actualizados del backend
const refreshed = await getSirecq(id, { token });
const data = refreshed?.data || refreshed; // compatibilidad
const req = data?.sirecqExterno?.requerimiento;
const clasif = data?.clasifCatastral;
const analista = req?.rolUsuario?.usuario;

// ✅ Esperar un poco para asegurar que los analistas ya se hayan cargado
await new Promise((resolve) => setTimeout(resolve, 300));

// ✅ Refrescar todos los campos (incluidos prioridad y técnico)
setRequerimiento({
  requerimientoId: req?.id_requerimiento || null,
  numero: req?.no_requerimiento || "",
  tramite_priorizado: req?.tema || "",
  tramite_cat: data?.sirecqExterno?.tramitecat || "",
  prioridad: data?.prioridad ?? "", // ⚙️ viene directo de sirecq_interno
  dependencia: data?.sirecqExterno?.dependencia || null,
  seguimiento: data?.sirecqExterno?.seguimientoinst || "",
  id_clasif_catastral: clasif?.id_clasif_catastral || "",
  clasificacion: clasif?.nombre_clasif_catastral || "",
  id_sistema: req?.sistema?.id_sistema || "",
  sistema: req?.sistema || null,
  id_responsable: analista?.id_usuario || null, // ✅ AGREGADO: guardar el ID
  responsable: analista
    ? `${analista.nombre_usuario} ${analista.apellidos_usuario}`.trim()
    : "",
  fecha_envio_dmc: data?.fecha_env_dmc
    ? new Date(data.fecha_env_dmc + "T12:00:00")
        .toISOString()
        .split("T")[0]
    : req?.fecha_registro?.slice(0, 10) || "",
  estado:
    req?.estadoRequerimiento?.nombre_estado_requerimiento || "Enviado",
  tecnico_desarrollo:
    data?.tecnico ||
    data?.usuariosSirecq?.[1]?.rolUsuario?.usuario?.nombre_usuario ||
    "",
  descripcion: req?.descripcion || "",
  observaciones: data?.sirecqExterno?.observacionesgen || "",
  obsv_tecnica: data?.obsv_tecnica || "",
});

// 🔄 Actualizar versiones también
setVersiones(
  req?.requerimientoVersiones?.map((v) => ({
    ...v.versionamiento,
    isLoaded: true,
    fech_desp_pt: v.versionamiento?.fech_desp_pt
      ? new Date(v.versionamiento.fech_desp_pt)
          .toISOString()
          .split("T")[0]
      : "",
    fechaenvioreq: v.versionamiento?.fechaenvioreq
      ? new Date(v.versionamiento.fechaenvioreq)
          .toISOString()
          .split("T")[0]
      : "",
  })) || []
);

// ✅ Salir de modo edición
setEditMode(false);
navigate("/sirecq");

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
{/* Barra superior con botón Atrás */}
<div className="flex items-center justify-between px-6 py-3">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-slate-700 hover:underline"
  >
    <ArrowLeft className="w-5 h-5" />
    <span>Atrás</span>
  </button>

</div>

{/* Línea superior azul */}
<div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

{/* Banner con título y botones (igual a Incidentes) */}
<div className="px-6 mt-2 mb-4">
  <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3">
    <span className="font-bold text-[#3F6592] text-lg tracking-wide">
      SIREC-Q
    </span>

    <div className="flex gap-2">
      {/* Botón Eliminar — solo admin y no en modo crear */}
      {activeRole === "Administrador" && !isCreate && (
        <button
          onClick={handleDelete}
          className="p-2 rounded bg-red-600 hover:bg-red-700 text-white"
          title="Eliminar SIRECQ Interno"
        >
          <Trash className="w-5 h-5" />
        </button>
      )}

      {/* Botón Editar / Guardar */}
      {!editMode && !isCreate && (
        <button
          onClick={() => setEditMode(true)}
          className="p-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          title="Editar"
        >
          <Edit className="w-5 h-5" />
        </button>
      )}
      {(editMode || isCreate) && (
        <button
          onClick={handleSave}
          className="p-2 rounded bg-green-600 hover:bg-green-700 text-white"
          title="Guardar"
        >
          <Save className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
</div>

{/* Línea inferior azul */}
<div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>


      {/* Contenido Principal */}
      <div className="px-8 flex flex-col xl:flex-row gap-6">
        {/* Columna Izquierda */}
        <div className="flex-1 space-y-6">
{/* Sección 1 - Datos principales */}
<div className="border-2 border-[#3f6592] rounded-xl overflow-hidden p-5">
  {/* Fila 1 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <SimpleField
      label="N° Requerimiento"
      value={requerimiento.numero}
      name="numero"
      onChange={handleChange}
      editMode={editMode || isCreate}
      className="bg-[#f1f5f9]"
    />
    <SimpleField
      label="Trámite priorizado relacionado"
      value={requerimiento.tramite_priorizado}
      name="tramite_priorizado"
      onChange={handleChange}
      editMode={editMode || isCreate}
      className="bg-[#f1f5f9]"
    />
    <SimpleField
      label="Trámite CAT"
      value={requerimiento.tramite_cat}
      name="tramite_cat"
      onChange={handleChange}
      editMode={editMode || isCreate}
      className="bg-[#f1f5f9]"
    />
  </div>

  {/* Bloque visual azul */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
    {/* Prioridad */}
    <div className="flex items-center justify-between bg-[#f1f5f9] rounded-lg px-4 py-2">
      <label className="text-sm font-bold text-[#3f6592]">Prioridad</label>
      {editMode ? (
        <input
          type="number"
          name="prioridad"
          value={requerimiento.prioridad}
          onChange={handleChange}
          className="w-24 text-center rounded-md bg-[#f1f5f9] text-gray-800 text-sm focus:ring-1 focus:ring-[#3f6592]"
        />
      ) : (
        <span className="bg-[#f1f5f9] px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
          {requerimiento.prioridad}
        </span>
      )}
    </div>

    {/* Clasificación */}
    <div className="flex items-center justify-between bg-[#f1f5f9] rounded-lg px-4 py-2">
      <label className="text-sm font-bold text-[#3f6592]">
        Clasificación catastral
      </label>
      {editMode ? (
        <select
          name="id_clasif_catastral"
          value={Number(requerimiento.id_clasif_catastral) || ""}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            const selected = clasificacionesList.find(
              (c) => c.id_clasif_catastral === selectedId
            );
            setRequerimiento((prev) => ({
              ...prev,
              id_clasif_catastral: selectedId,
              clasificacion: selected?.nombre_clasif_catastral || "",
            }));
          }}
          className="w-40 rounded-md bg-[#f1f5f9] text-gray-800 text-sm focus:ring-1 focus:ring-[#3f6592]"
        >
          <option value="">Seleccione...</option>
          {clasificacionesList.map((c) => (
            <option key={c.id_clasif_catastral} value={c.id_clasif_catastral}>
              {c.nombre_clasif_catastral}
            </option>
          ))}
        </select>
      ) : (
        <span className="bg-[#f1f5f9] px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
          {requerimiento.clasificacion}
        </span>
      )}
    </div>

    {/* Dependencia */}
    <div className="flex items-center justify-between bg-[#f1f5f9] rounded-lg px-4 py-2">
      <label className="text-sm font-bold text-[#3f6592]">Dependencia</label>
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
          className="w-40 rounded-md bg-[#f1f5f9] text-gray-800 text-sm focus:ring-1 focus:ring-[#3f6592]"
        >
          <option value="">Seleccione...</option>
          {dependencias.map((dep) => (
            <option key={dep.id_dependencia} value={dep.id_dependencia}>
              {dep.sigla_dependencia} - {dep.nombre_dependencia}
            </option>
          ))}
        </select>
      ) : (
        <span className="bg-[#f1f5f9] px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
          {requerimiento.dependencia?.sigla_dependencia ||
            requerimiento.dependencia?.nombre_dependencia ||
            ""}
        </span>
      )}
    </div>

    {/* Sistema Afectar */}
    <div className="flex items-center justify-between bg-[#f1f5f9] rounded-lg px-4 py-2">
      <label className="text-sm font-bold text-[#3f6592]">Sistema Afectar</label>
      {editMode ? (
        <select
          name="id_sistema"
          value={requerimiento.id_sistema || ""}
          onChange={(e) => {
            const selected = sistemasList.find(
              (s) => s.id_sistema === Number(e.target.value)
            );
            setRequerimiento((prev) => ({
              ...prev,
              id_sistema: selected?.id_sistema || "",
              sistema: selected || null,
            }));
          }}
          className="w-40 rounded-md bg-[#f1f5f9] text-gray-800 text-sm focus:ring-1 focus:ring-[#3f6592]"
        >
          <option value="">Seleccione...</option>
          {sistemasList.map((s) => (
            <option key={s.id_sistema} value={s.id_sistema}>
              {s.nom_sistema}
            </option>
          ))}
        </select>
      ) : (
        <span className="bg-[#f1f5f9] px-4 py-1 rounded-md text-sm text-gray-800 shadow-inner">
          {requerimiento.sistema?.nom_sistema || ""}
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
        className="w-full px-3 py-2 text-sm rounded bg-[#f1f5f9]"
      />
    ) : (
      <div className="w-full px-3 py-2 text-sm bg-[#f1f5f9] rounded text-gray-700">
        {requerimiento.seguimiento}
      </div>
    )}
  </div>
</div>

   {/* Sección 2 - Detalles adicionales */}
<div className="border-2 border-[#3f6592] rounded-xl p-5">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    {/* Responsable (Analista Catastral) */}
    <div>
      <label className="block text-xs font-semibold mb-1 text-gray-700">
        Responsable (Analista Catastral)
      </label>
      {editMode ? (
        <select
          name="id_responsable"
          value={Number(requerimiento.id_responsable) || ""}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            const selected = analistas.find(
              (a) => Number(a.id_usuario) === selectedId
            );
            setRequerimiento((prev) => ({
              ...prev,
              id_responsable: selectedId,
              responsable: selected?.nombre_completo || "",
            }));
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-[#f1f5f9] focus:ring-1 focus:ring-[#3f6592]"
        >
          <option value="">Seleccione...</option>
          {analistas.map((a) => (
            <option key={`responsable-${a.id_usuario}`} value={a.id_usuario}>
              {a.nombre_completo}
            </option>
          ))}
        </select>
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-[#f1f5f9] rounded text-gray-700">
          {requerimiento.responsable || ""}
        </div>
      )}
    </div>

    <DateFieldComp
      label="Fecha de envío por la DMC"
      value={requerimiento.fecha_envio_dmc}
      name="fecha_envio_dmc"
      onChange={handleChange}
      editMode={editMode || isCreate}
    />

    {/* Estado del requerimiento */}
    <div>
      <label className="block text-xs font-semibold mb-1 text-gray-700">
        Estado del requerimiento
      </label>
      {editMode ? (
        <select
          name="estado"
          value={requerimiento.estado || ""}
          onChange={(e) => {
            const selectedNombre = e.target.value;
            const selected = estadosList.find(
              (est) => est.nombre_estado_requerimiento === selectedNombre
            );
            setRequerimiento((prev) => ({
              ...prev,
              estado: selected?.nombre_estado_requerimiento || "",
              id_estado_requerimiento: selected?.id_estado_requerimiento || null,
            }));
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-[#f1f5f9] focus:ring-1 focus:ring-[#3f6592]"
        >
          <option value="">Seleccione...</option>
          {estadosList.map((est) => (
            <option
              key={est.id_estado_requerimiento}
              value={est.nombre_estado_requerimiento}
            >
              {est.nombre_estado_requerimiento}
            </option>
          ))}
        </select>
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-[#f1f5f9] rounded text-gray-700">
          {requerimiento.estado || ""}
        </div>
      )}
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <SimpleField
      label="Técnico DMSIST para desarrollo"
      value={requerimiento.tecnico_desarrollo}
      name="tecnico_desarrollo"
      onChange={handleChange}
      editMode={editMode || isCreate}
      className="bg-[#f1f5f9]"
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
                className="px-4 py-2 bg-[#3f6592] text-white rounded hover:bg-[#0E7490] transition"
              >
                + Añadir versión
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="w-full xl:w-[420px] space-y-6">
          {/* Descripción */}
          <div className="border-2 border-[#3f6592] rounded-xl overflow-hidden">
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
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-[#f1f5f9] resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-[#f1f5f9] rounded text-gray-700 min-h-[120px]">
                  {requerimiento.descripcion}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones Generales */}
          <div className="border-2 border-[#3f6592] rounded-xl overflow-hidden">
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
                 className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-[#f1f5f9] resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-[#f1f5f9] rounded text-gray-700 min-h-[120px]">
                  {requerimiento.observaciones}
                </div>
              )}
            </div>
          </div>

          {/* Observación TICS */}
          <div className="border-2 border-[#3f6592] rounded-xl overflow-hidden">
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
                 className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-[#f1f5f9] resize-none"
                />
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-[#f1f5f9] rounded text-gray-700 min-h-[120px]">
                  {requerimiento.obsv_tecnica}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 bg-[#3f6592] mx-8 my-6"></div>

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
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-[#f1f5f9]"
        />
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-[#f1f5f9] rounded text-gray-700">
          {value || ""}
        </div>
      )}
    </div>
  );
}


function DateFieldComp({ label, name, value, onChange, editMode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 text-gray-700">
        {label}
      </label>
      {editMode ? (
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-[#f1f5f9] focus:ring-1 focus:ring-[#3f6592]"
        />
      ) : (
        <div className="w-full px-3 py-2 text-sm bg-[#f1f5f9] rounded text-gray-700">
          {value || ""}
        </div>
      )}
    </div>
  );
}


function VersionBlock({ version, index, onChange, editMode }) {
  return (
    <div className="border-2 border-[#3f6592] rounded-xl p-5">
      <h3 className="font-bold mb-3 text-[#3f6592]">Versión {version.num_version}</h3>
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

<div>
  <label className="block text-xs font-semibold mb-1 text-gray-700">
    Observaciones del Versionamiento
  </label>
  {editMode ? (
    <textarea
      name="observaciones_version"
      value={version.observaciones_version}
      onChange={(e) => onChange(index, e)}
      rows={3}
      className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-[#f1f5f9] resize-none"
    />
  ) : (
    <div className="w-full px-3 py-2 text-xs bg-[#f1f5f9] rounded text-gray-700 min-h-[60px]">
      {version.observaciones_version || ""}
    </div>
  )}
</div>


      </div>
    </div>
  );
}
