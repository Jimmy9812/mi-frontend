
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getIncidente, createIncidente, updateIncidente, resolveIncidente } from "../services/incidentesService";
import { getAllZona } from "../services/zonasService";
import { getTecnicoIncidentes, getAnalistas } from "../services/usersRolService";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Save, Edit, CheckCircle, Trash2, XCircle, Info, AlertTriangle } from "lucide-react";
import GifLoader from "../components/LoadingGif";
function AlertModal({ open, type = "info", message, onClose }) {
  if (!open) return null;
  const config = {
    success: {
      color: "text-green-500 border-green-300",
      icon: <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />,
      title: "¡Éxito!",
    },
    error: {
      color: "text-red-500 border-red-300",
      icon: <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />,
      title: "Error",
    },
    info: {
      color: "text-blue-500 border-blue-300",
      icon: <Info className="w-12 h-12 mx-auto mb-2 text-blue-500" />,
      title: "Aviso",
    },
    warning: {
      color: "text-yellow-500 border-yellow-300",
      icon: <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />,
      title: "Advertencia",
    },
  };
  const { color, icon, title } = config[type] || config.info;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(30, 41, 59, 0.25)', backdropFilter: 'blur(2px)' }}>
      <div className={`bg-white rounded-xl shadow-xl px-8 py-8 min-w-[320px] max-w-[90vw] border-t-4 ${color} flex flex-col items-center`}>
        {icon}
        <div className={`mb-2 text-xl font-bold ${color}`}>{title}</div>
        <div className="mb-6 text-gray-700 text-center">{message}</div>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded bg-[#3F6592] text-white font-semibold hover:bg-[#27466b] focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}


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
  const { token, user, hasPermission } = useAuth();

  // Modal de alerta interactivo
  const [alert, setAlert] = useState({ open: false, type: "info", message: "" });
  const showAlert = (type, message) => setAlert({ open: true, type, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  useEffect(() => {
    async function load() {
      if (mode === "create") {
        setIncidente({});
        setLoading(false);
        return;
      }
      try {
        const res = await getIncidente(id, token);
        console.log("🟢 Incidente cargado desde backend:", res);
        console.log("👉 id_tecnico recibido:", res.id_tecnico);
        console.log("👉 id_analista recibido:", res.id_analista);

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
        console.log("👷 Técnicos desde backend:", tecnicosData);
        setTecnicos(tecnicosData);

        const analistasData = await getAnalistas({ token });
        console.log("🧑‍💻 Analistas desde backend:", analistasData);
        setAnalistas(analistasData);
      } catch (err) {
        console.error("Error loading options", err);
      }
    }
    loadOptions();
  }, [token]);


  // Determinar si el usuario es admin o tiene permiso de eliminar incidentes
  const isAdmin = (
    (user?.roles && Array.isArray(user.roles) && user.roles.some((r) => {
      const nombre = (r?.nombre_rol || r?.rol || "").toLowerCase();
      return nombre.includes("admin") || nombre.includes("administrador");
    }))
    || (typeof hasPermission === "function" && (hasPermission("ADMIN") || hasPermission("INCIDENTES_DELETE")))
  );

  // Estado para bloquear campos si es FAVORABLE
  const isFavorable = incidente?.estado === "FAVORABLE";

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setIncidente((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else if (type === "date") {
      setIncidente((prev) => ({ ...prev, [name]: value }));
    } else {
      setIncidente((prev) => ({ ...prev, [name]: value }));
    }
  };

  function buildPayload(incidente) {
    return {
      ...incidente,
      id_tecnico: incidente.id_tecnico ? Number(incidente.id_tecnico) : null,
      id_analista: incidente.id_analista ? Number(incidente.id_analista) : null,
      fechaingresoerror: incidente.fechaingresoerror
        ? new Date(incidente.fechaingresoerror + "T12:00:00")
        : null,
      fech_solucion: incidente.fech_solucion
        ? new Date(incidente.fech_solucion + "T12:00:00")
        : null,
    };
  }

  const handleSave = async () => {
    try {
      const payload = buildPayload(incidente);
      if (mode === "create") {
        await createIncidente({ token, payload });
        showAlert("success", "Incidente creado correctamente");
      } else if (resolveMode) {
        await resolveIncidente({
          token,
          no_incidente: incidente.numero,
          payload: {
            mensaje_error: incidente.mensaje_error,
            fecha_solucion: incidente.fecha_solucion,
            observaciones: incidente.observaciones,
          },
        });
        showAlert("success", "Incidente resuelto y marcado como FAVORABLE");
        setResolveMode(false);
      } else {
        await updateIncidente({ token, id, payload });
        showAlert("success", "Incidente actualizado correctamente");
      }
      setEditMode(false);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al guardar: " + (err?.message || ""));
    }
  };

  // Eliminar incidente (solo admin)
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este incidente?")) return;
    try {
      // Aquí deberías llamar a tu servicio de borrado (deleteIncidente)
      // await deleteIncidente({ token, id });
      showAlert("success", "Incidente eliminado correctamente");
    } catch (err) {
      showAlert("error", "Error al eliminar: " + (err?.message || ""));
    }
  };


  if (loading) return <div className="p-6">Cargando...</div>;
  if (!incidente) return <div className="p-6">No encontrado</div>;


  const isCreate = mode === "create";
  const isView = mode === "view";

  return (
    <div className="min-h-screen flex flex-col">
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => {
          closeAlert();
          if (alert.type === "success") navigate("/incidentes");
        }}
      />
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-700 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
        {/* Botón eliminar solo para admin o con permiso, en cualquier estado, excepto en modo crear */}
        {!isCreate && isAdmin && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 p-2 rounded bg-red-600 hover:bg-red-700 text-white"
            title="Eliminar incidente"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        )}
      </div>

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      <div className="px-6 mt-2 mb-4">
        <div className="flex items-center justify-between bg-[#f1f5f9] rounded px-5 py-3">
          <span className="font-bold text-[#3F6592] text-lg tracking-wide">
            INCIDENTES
          </span>

          <div className="flex gap-2">
            {/* Botón editar solo si estado es PENDIENTE y no en modo crear ni resolve, y no en FAVORABLE */}
            {!isCreate && isView && !editMode && !resolveMode && incidente.estado === "PENDIENTE" && !isFavorable && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded bg-yellow-500 hover:bg-yellow-600"
                title="Editar"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
            )}
            {/* Botón resolver solo si estado es PENDIENTE */}
            {!isCreate && isView && incidente.estado === "PENDIENTE" && !resolveMode && (
              <button
                onClick={() => setResolveMode(true)}
                className="p-2 rounded bg-blue-600 hover:bg-blue-700"
                title="Resolver"
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </button>
            )}
            {/* Botón guardar */}
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

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-3 border rounded-lg p-4">
            <Field label="N° De Incidencia" name="numero" value={incidente.numero} onChange={handleChange} disabled={!isCreate || isFavorable} />
            <Field
              label="Técnico responsable"
              name="id_tecnico"
              value={incidente.id_tecnico || ""}
              onChange={handleChange}
              type="select"
              options={tecnicos}
              disabled={(!editMode && !isCreate) || isFavorable}
            />
            <Field
              label="Analista que reporta"
              name="id_analista"
              value={incidente.id_analista || ""}
              onChange={handleChange}
              type="select"
              options={analistas}
              disabled={(!editMode && !isCreate) || isFavorable}
            />
            <Field
              label="Unidad zonal"
              name="id_zona"
              value={incidente.id_zona || ""}
              onChange={handleChange}
              type="select"
              options={zonas}
              disabled={isFavorable}
            />
            <Field label="Fecha de ingreso del error" name="fecha_ingreso" value={incidente.fecha_ingreso} onChange={handleChange} type="date" disabled={(!editMode && !isCreate) || isFavorable} />
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <Field
              label="Tipología de trámite"
              name="tipologia_tramite"
              value={incidente.tipologia_tramite || ""}
              onChange={handleChange}
              type="select"
              options={[
                { id: "DMC011", nombre: "DMC011" },
                { id: "DMC012", nombre: "DMC012" },
              ]}
              disabled={(!editMode && !isCreate) || isFavorable}
            />

            <Field
              label="Año Sirec-Q error"
              name="aniosirecq"
              value={incidente.aniosirecq}
              onChange={handleChange}
              type="select"
              options={Array.from(
                { length: new Date().getFullYear() - 2007 + 1 },
                (_, i) => {
                  const year = 2007 + i;
                  return { id: year, nombre: year };
                }
              )}
              disabled={(!editMode && !isCreate) || isFavorable}
            />

            {(!isCreate || resolveMode) && (
              <>
                <Field
                  label="Mensaje visualizado del error"
                  name="mensaje_error"
                  value={incidente.mensaje_error}
                  onChange={handleChange}
                  type="select"
                  options={[
                    { id: "SGDTIC", nombre: "SGDTIC" },
                    { id: "DMI", nombre: "DMI" },
                  ]}
                  disabled={!resolveMode || isFavorable}
                />

                <Field
                  label="Fecha Solución"
                  name="fecha_solucion"
                  value={incidente.fecha_solucion}
                  onChange={handleChange}
                  type="date"
                  disabled={!resolveMode || isFavorable}
                />
              </>
            )}
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <Field
              label="Descripción del error"
              name="descripcion"
              value={incidente.descripcion || incidente.descripcion}
              onChange={handleChange}
              textarea
              disabled={(!editMode && !isCreate) || isFavorable}
            />

            {(!isCreate || resolveMode) && (
              <Field
                label="Observaciones"
                name="observaciones"
                value={incidente.observaciones}
                onChange={handleChange}
                textarea
                disabled={!resolveMode || isFavorable}
              />
            )}

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#3F6592]">
                Error reportado (imagen)
              </label>

              <input
                id="fileInput"
                type="file"
                name="error_reportado"
                onChange={handleChange}
                disabled={(!editMode && !isCreate) || isFavorable}
                accept="image/*"
                className="hidden"
              />

              <label
                htmlFor="fileInput"
                className={`inline-flex items-center px-4 py-2 rounded cursor-pointer ${
                  incidente.error_reportado
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } ${(!editMode && !isCreate) || isFavorable ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {incidente.error_reportado ? "Cambiar imagen" : "Seleccionar archivo"}
              </label>

              {incidente.error_reportado && (
                <div className="mt-2">
                  <label className="block text-sm font-semibold mb-1">
                    Vista previa guardada
                  </label>
                  <img
                    src={incidente.error_reportado}
                    alt="Error reportado"
                    className="max-w-full max-h-64 rounded border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-[#3F6592] mx-6 my-2"></div>

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
      <label className="block text-sm font-semibold mb-1 text-[#3F6592]">{label}</label>
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
  const optionKey = option.id_zona ?? option.id_usuario ?? option.id ?? option.id_rol_usuario;

const optionLabel =
  option.nombre_completo || 
  option.nombre_zona ||
  `${option.nombre_usuario || ""} ${option.apellidos_usuario || ""}`.trim() ||
  option.descripcion ||
  String(optionKey);

  return (
    <option key={optionKey} value={optionKey}>
      {optionLabel || "Sin nombre"}
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
