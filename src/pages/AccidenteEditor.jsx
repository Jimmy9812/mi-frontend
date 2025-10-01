import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAccidente,
  createAccidente,
  updateAccidente,
  deleteAccidente,
  getEstadosNoFavorable,
  getAnalistasAccidentes,
} from "../services/accidentesService";
import { getAllZona } from "../services/zonasService";
import { approveFiscalizacion } from "../services/accidentesService";
import { ArrowLeft, Save, Edit, Calendar, Trash2 } from "lucide-react";

  


import LoadingGif from "../components/LoadingGif";

export default function AccidenteEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, activeRole } = useAuth();

  const [acc, setAcc] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [loading, setLoading] = useState(true);


  // Eliminar accidente
  const handleDelete = async () => {
    if (!window.confirm("¿Está seguro de eliminar este accidente? Esta acción no se puede deshacer.")) return;
    try {
      await deleteAccidente({ token, id }); // 👈 ya puedes usar token directamente
      alert("Accidente eliminado exitosamente");
      navigate("/accidentes");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  // Estados para catálogos
  const isCreate = mode === "create";
  const isView = mode === "view";
  // Mostrar botón solo si es Administrador y el estado no es FAVORABLE
  const puedeFiscalizar = (
    activeRole === "Administrador" &&
    !isCreate &&
    !editMode &&
    acc?.estado !== "all"
  );
  // Modal fiscalización
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [fiscalLoading, setFiscalLoading] = useState(false);

  // Acción fiscalización
  const handleFiscalizacion = async (fiscalizacion) => {
    setFiscalLoading(true);
    try {
      await approveFiscalizacion({ token, id, fiscalizacion });
      alert(fiscalizacion ? "Accidente aprobado como FAVORABLE" : "No se cambió el estado");
      // Recargar datos
      const res = await getAccidente({ token, id });
      setAcc(res);
    } catch (e) {
      alert("Error al aprobar: " + e.message);
    } finally {
      setFiscalLoading(false);
      setShowFiscalModal(false);
    }
  };

  const [zonas, setZonas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [analistas, setAnalistas] = useState([]);

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        // Valores por defecto para nuevo accidente
        setAcc({
          tramite: "",
          oficio: "",
          tecnico_responsable: "",
          fecha_ingreso_tramite: "",
          fecha_asignacion_tramite: "",
          tipologia_tramite: "",
          inspeccion: "NO",
          numero_interno: "",
          numero_documento: "",
          propietario: "",
          numero_predio: "",
          clave_catastral: "",
          parroquia: "",
          estado_tramite: "PENDIENTE",
          fecha_estado: "",
          control_calidad: "",
          codigo_consulta: "",
          observaciones: "",
          // Campos para backend
          id_zona: null,
          id_estado_acc_inc: null,
          id_rol_usuario: null,
        });
        setLoading(false);
        return;
      }

      try {
        const res = await getAccidente({ token, id });
        console.log("🟢 Accidente cargado desde backend:", res);
        setAcc(res);
      } catch (error) {
        console.error("Error cargando accidente:", error);
        alert("No se pudo cargar el accidente: " + error.message);
        navigate("/accidentes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, mode, navigate, token]);

  // Cargar catálogos
useEffect(() => {
  async function loadCatalogs() {
    try {
      const [zonasData, estadosData, analistasData] = await Promise.all([
        getAllZona({ token }),
        getEstadosNoFavorable({ token }),
        getAnalistasAccidentes({ token }),
      ]);
      
      console.log("📋 Catálogos cargados:");
      console.log("- Zonas:", zonasData);
      console.log("- Estados (RAW):", estadosData); // 👈 Ver estructura exacta
      console.log("- Analistas:", analistasData);
      
      // 👇 Agregar validación
      if (Array.isArray(estadosData) && estadosData.length > 0) {
        console.log("- Primer estado:", estadosData[0]); // Ver estructura del primer elemento
      }
      
      setZonas(zonasData || []);
      setEstados(estadosData || []);
      setAnalistas(analistasData || []);
    } catch (error) {
      console.error("Error loading catalogs:", error);
    }
  }
  if (token) {
    loadCatalogs();
  }
}, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAcc((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      console.log("💾 Guardando accidente:", acc);

      if (mode === "create") {
        const result = await createAccidente({ token, payload: acc });
        console.log("✅ Accidente creado:", result);
        alert("Accidente creado exitosamente");
        navigate("/accidentes");
      } else {
        const result = await updateAccidente({ token, id, payload: acc });
        console.log("✅ Accidente actualizado:", result);
        alert("Accidente actualizado exitosamente");
        setEditMode(false);
      }
    } catch (error) {
      console.error("❌ Error al guardar accidente:", error);
      if (error.message.includes('409') || error.message.includes('ya existe')) {
        alert("Este número de trámite u oficio ya existe. Por favor, verifica los datos.");
      } else if (error.message.includes('404')) {
        alert("No se encontró el accidente a actualizar.");
      } else {
        alert("Error al guardar: " + error.message);
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando…</div>;
  if (!acc) return <div className="p-6 text-center">Accidente no encontrado</div>;

  const disabled = !editMode;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior con Atrás */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-700 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
        
        {/* Indicador de modo */}
        <div className="text-sm text-slate-600">
          {isCreate ? "Nuevo Accidente" : isView ? "Ver Accidente" : "Editando Accidente"}
          {!isCreate && acc?.id && ` - ID: ${acc.id}`}
        </div>
      </div>

      {/* Línea superior con margen lateral */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Encabezado con fondo claro y botones */}
      <div className="px-6 mt-2 mb-4">
        <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3">
          <span className="font-bold text-[#3F6592] text-lg tracking-wide">
            ACCIDENTES
          </span>

          <div className="flex gap-2">
            {puedeFiscalizar && (
              <button
                onClick={() => setShowFiscalModal(true)}
                className="p-2 rounded bg-blue-700 hover:bg-blue-800 text-white"
                title="Aprobar fiscalización"
              >
                Aprobar fiscalización
              </button>
            )}
            {/* Botón eliminar solo para administradores y no en modo crear */}
            {activeRole === "Administrador" && !isCreate && (
              <button
                onClick={handleDelete}
                className="p-2 rounded bg-red-600 hover:bg-red-700 text-white"
                title="Eliminar accidente"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {!editMode && !isCreate && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
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
      {/* Modal fiscalización */}
      {showFiscalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]">
            <h2 className="text-lg font-bold mb-4 text-[#3F6592]">Aprobar fiscalización</h2>
            <p className="mb-6">¿Desea aprobar este accidente como <b>FAVORABLE</b>?</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => handleFiscalizacion(true)}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                disabled={fiscalLoading}
              >
                Sí, aprobar
              </button>
              <button
                onClick={() => handleFiscalizacion(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
                disabled={fiscalLoading}
              >
                No, mantener estado
              </button>
              <button
                onClick={() => setShowFiscalModal(false)}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                disabled={fiscalLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Línea inferior con margen lateral */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* Contenido – bloques con borde azul */}
      <div className="p-6 space-y-6">
        {/* BLOQUE 1 - Información General */}
        <div className="border rounded-xl p-4 space-y-4 border-[#3F6592]">
          <h3 className="text-lg font-semibold text-[#3F6592] mb-4">Información General</h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <Field
                label="Trámite"
                name="tramite"
                value={acc.tramite}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Ej: TRAM-001"
              />
              <Field
                label="Oficio/Memorando/Mail"
                name="oficio"
                value={acc.oficio}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Ej: SHOT-DMC-USIGC-2025-001-O"
              />
              
              {/* ComboBox de Analistas (Técnicos responsables) */}
              <SelectField
                label="Técnico responsable"
                name="id_rol_usuario"
                value={acc.id_rol_usuario}
                onChange={handleChange}
                disabled={disabled}
                options={analistas.map(analista => ({
                  value: analista.id_usuario,
                  label: analista.nombre_completo || 'Sin nombre'
                }))}
                required={isCreate}
              />
            </div>

            {/* Columna central */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#3F6592] mb-3">Fechas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <DateField
                    label="Ingreso del trámite"
                    name="fecha_ingreso_tramite"
                    value={acc.fecha_ingreso_tramite}
                    onChange={handleChange}
                    disabled={disabled}
                    required={isCreate}
                  />
                  <DateField
                    label="Asignación del trámite"
                    name="fecha_asignacion_tramite"
                    value={acc.fecha_asignacion_tramite}
                    onChange={handleChange}
                    disabled={disabled}
                    required={isCreate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Tipología de trámite"
                  name="tipologia_tramite"
                  value={acc.tipologia_tramite}
                  onChange={handleChange}
                  disabled={disabled}
                  options={[
                    { value: "31", label: "31" },
                    { value: "32", label: "32" }
                  ]}
                />
                <SelectField
                  label="Inspección"
                  name="inspeccion"
                  value={acc.inspeccion}
                  onChange={handleChange}
                  disabled={disabled}
                  options={[
                    { value: "SI", label: "SI" },
                    { value: "NO", label: "NO" }
                  ]}
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <Field
                label="Número interno"
                name="numero_interno"
                value={acc.numero_interno}
                onChange={handleChange}
                disabled={disabled}
                placeholder="INT-001"
              />
              <Field
                label="Número de documento"
                name="numero_documento"
                value={acc.numero_documento}
                onChange={handleChange}
                disabled={disabled}
                placeholder="DOC-001"
              />
              <Field
                label="Nombre del propietario"
                name="propietario"
                value={acc.propietario}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Nombre completo"
                required={isCreate}
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2 - Información Catastral y Estado */}
        <div className="border rounded-xl p-4 space-y-4 border-[#3F6592]">
          <h3 className="text-lg font-semibold text-[#3F6592] mb-4">Información Catastral y Estado</h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <Field
                label="Número de predio"
                name="numero_predio"
                value={acc.numero_predio}
                onChange={handleChange}
                disabled={disabled}
                placeholder="5140886"
                required={isCreate}
              />
              <Field
                label="Clave catastral"
                name="clave_catastral"
                value={acc.clave_catastral}
                onChange={handleChange}
                disabled={disabled}
                placeholder="8046301313"
                required={isCreate}
              />
              
              {/* ComboBox de Zonas */}
              <SelectField
                label="Zona/Parroquia"
                name="id_zona"
                value={acc.id_zona}
                onChange={handleChange}
                disabled={disabled}
                options={zonas.map(zona => ({
                  value: zona.id_zona,
                  label: zona.nombre_zona
                }))}
                required={isCreate}
              />
              
              {/* ComboBox de Estados */}
              <SelectField
                label="Estado de trámite"
                name="id_estado_acc_inc"
                value={acc.id_estado_acc_inc}
                onChange={handleChange}
                disabled={disabled}
                options={estados.map(estado => ({
                  value: estado.id_estado_acc_inc,
                  label: estado.nombre_estado_acc_inc
                }))}
                required={isCreate}
              />
            </div>

            {/* Columna central */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#3F6592] mb-3">Control</h4>
                <div className="grid grid-cols-1 gap-4">
                  <DateField
                    label="Fecha de control"
                    name="fecha_estado"
                    value={acc.fecha_estado}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <Field
                    label="Control de calidad"
                    name="control_calidad"
                    value={acc.control_calidad}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="OK/KC"
                  />
                  <Field
                    label="Código consulta/Dato seguro"
                    name="codigo_consulta"
                    value={acc.codigo_consulta}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="CC-001"
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <TextArea
                label="Observaciones"
                name="observaciones"
                value={acc.observaciones}
                onChange={handleChange}
                disabled={disabled}
                rows={8}
                placeholder="Ingrese observaciones adicionales..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      {/* GIF institucional */}
      <div className="p-6 flex justify-center">
        <LoadingGif />
      </div>
    </div>
  );
}

/* ========= Campos reutilizables ========= */
function Field({ label, name, value, onChange, disabled, type = "text", placeholder = "", required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3F6592] focus:border-transparent"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, disabled, options = [], required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3F6592] focus:border-transparent"
      >
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, name, value, onChange, disabled, rows = 4, placeholder = "", required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3F6592] focus:border-transparent"
      />
    </div>
  );
}

function DateField({ label, name, value, onChange, disabled, required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="w-full pr-10 px-3 py-2 rounded-md border bg-gray-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3F6592] focus:border-transparent"
        />
        <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}