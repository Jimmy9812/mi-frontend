import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getIncidente, createIncidente, updateIncidente } from "../services/incidentesService";
import { getAllZona } from "../services/zonasService";
import { getTecnicoIncidentes, getAnalistas } from "../services/usersRolService";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Edit, CheckCircle } from "lucide-react";
import GifLoader from "../components/LoadingGif";

export default function IncidenteEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incidente, setIncidente] = useState(null);
  const [editMode, setEditMode] = useState(mode === "create");
  const [resolveMode, setResolveMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [zonas, setZonas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setIncidente({});
        setLoading(false);
        return;
      }
      try {
        const res = await getIncidente(id, token);
        setIncidente(res);
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el incidente");
        navigate("/incidentes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, mode, navigate, token]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const zonasData = await getAllZona({ token });
        setZonas(zonasData);
        const tecnicosData = await getTecnicoIncidentes({ token });
        setTecnicos(tecnicosData);
        const analistasData = await getAnalistas({ token });
        setAnalistas(analistasData);
      } catch (err) {
        console.error("Error loading options", err);
      }
    }
    loadOptions();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setIncidente((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setIncidente((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      if (mode === "create") {
        await createIncidente({ token, payload: incidente });
        alert("Incidente creado");
        navigate("/incidentes");
      } else if (resolveMode) {
        await updateIncidente({ token, id, payload: {
            mensaje_error: incidente.mensaje_error,
            fecha_solucion: incidente.fecha_solucion,
            observaciones: incidente.observaciones,
          }});
        alert("Incidente resuelto");
        setResolveMode(false);
      } else {
        await updateIncidente({ token, id, payload: incidente });
        alert("Incidente actualizado");
      }
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!incidente) return <div className="p-6">No encontrado</div>;

  const isCreate = mode === "create";
  const isView = mode === "view";

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
      </div>

      {/* Línea superior con margen lateral */}
      <div className="h-[2px] bg-[#5b0f2c] mx-6 my-2"></div>

      {/* Encabezado con fondo claro y botones */}
      <div className="px-6 mt-2 mb-4">
        <div className="flex items-center justify-between bg-[#7d3d5a] text-white rounded px-5 py-3 font-bold tracking-wide shadow">
          <span>INCIDENTES</span>

          <div className="flex gap-2">
            {!isCreate && isView && !editMode && !resolveMode && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded bg-yellow-500 hover:bg-yellow-600"
                title="Editar"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
            )}
            {!isCreate && isView && incidente.estado === "PENDIENTE" && !resolveMode && (
              <button
                onClick={() => setResolveMode(true)}
                className="p-2 rounded bg-blue-600 hover:bg-blue-700"
                title="Resolver"
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </button>
            )}
            {(editMode || resolveMode) && (
              <button
                onClick={handleSave}
                className="p-2 rounded bg-green-600 hover:bg-green-700"
                title="Guardar"
              >
                <Save className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Línea inferior con margen lateral */}
      <div className="h-[2px] bg-[#5b0f2c] mx-6 my-2"></div>

      {/* Contenido principal */}
      <div className="flex flex-col gap-4 p-6">
        {/* Formulario en columnas */}
        <div className="grid grid-cols-3 gap-4">
          {/* Columna 1 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="N° De Incidencia" name="numero" value={incidente.numero} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Técnico responsable" name="id_tecnico" value={incidente.id_tecnico} onChange={handleChange} type="select" options={tecnicos} disabled={!editMode && !isCreate} />
            <Field label="Analista que reporta" name="id_analista" value={incidente.id_analista} onChange={handleChange} type="select" options={analistas} disabled={!editMode && !isCreate} />
            <Field label="Unidad zonal" name="id_zona" value={incidente.id_zona} onChange={handleChange} type="select" options={zonas} disabled={!editMode && !isCreate} />
            <Field label="Fecha de ingreso del error" name="fecha_ingreso" value={incidente.fecha_ingreso} onChange={handleChange} type="date" disabled={!editMode && !isCreate} />
          </div>

          {/* Columna 2 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="Tipología de trámite" name="tipologia_tramite" value={incidente.tipologia_tramite || incidente.tipologia_tramite} onChange={handleChange} disabled={!editMode && !isCreate} />
            <Field label="Año Sirec-Q error" name="añosirecq" value={incidente.añosirecq} onChange={handleChange} disabled={!editMode && !isCreate} />

            {(!isCreate || resolveMode) && (
              <>
                <Field label="Mensaje visualizado del error" name="mensaje_error" value={incidente.mensaje_error} onChange={handleChange} disabled={!resolveMode} />
                <Field label="Fecha Solución" name="fecha_solucion" value={incidente.fecha_solucion} onChange={handleChange} type="date" disabled={!resolveMode} />
              </>
            )}
          </div>

          {/* Columna 3 */}
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="Descripción del error" name="descripcion" value={incidente.descripcion || incidente.descripcion} onChange={handleChange} textarea disabled={!editMode && !isCreate} />
            {(!isCreate || resolveMode) && (
              <Field label="Observaciones" name="observaciones" value={incidente.observaciones} onChange={handleChange} textarea disabled={!resolveMode} />
            )}
            <Field label="Error reportado (imagen)" name="error_reportado" onChange={handleChange} type="file" disabled={!editMode && !isCreate} />
            {incidente.error_reportado && (
              <div className="mt-2">
                <label className="block text-sm font-semibold mb-1">Vista previa</label>
                <img src={incidente.error_reportado} alt="Error reportado" className="max-w-full max-h-64 rounded border" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Línea inferior con margen lateral */}
      <div className="h-[2px] bg-[#5b0f2c] mx-6 my-2"></div>

      {/* Footer con GIF */}
      <div className="p-6 flex justify-center">
        <GifLoader />
      </div>
    </div>
  );
}

/* Subcomponente */
function Field({ label, name, value, onChange, disabled, textarea, type = "text", options = [] }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-[#5b0f2c]">{label}</label>
      {type === "file" ? (
        <input
          type="file"
          name={name}
          onChange={onChange}
          disabled={disabled}
          accept="image/*"
          className="w-full p-2 border rounded bg-gray-50 disabled:opacity-70"
        />
      ) : type === "select" ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2 border rounded bg-gray-50 text-gray-900 disabled:opacity-70"
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => {
            const optionKey = option.id_zona ?? option.id_usuario ?? option.id ?? option.id_usuario_role;
            const optionValue = optionKey;
            const optionLabel =
              option.nombre_zona ??
              option.nombre_completo ??
              (option.nombre && option.apellidos_usuario ? `${option.nombre} ${option.apellidos_usuario}` : option.nombre) ??
              option.nombre_usuario ??
              option.descripcion ??
              String(optionKey);
            return (
              <option key={optionKey} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : textarea ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2 border rounded bg-gray-50 disabled:opacity-70"
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-2 border rounded bg-gray-50 disabled:opacity-70"
        />
      )}
    </div>
  );
}
