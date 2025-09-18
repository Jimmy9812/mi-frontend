// src/pages/TestProduccionEditor.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, Plus } from "lucide-react";
import {
  getRequerimientoById,
  createRequerimiento,
  updateRequerimiento,
} from "../services/testProduccionService";
import LoadingGif from "../components/LoadingGif";

export default function TestProduccionEditor({ mode = "view" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === "create");
  const [loading, setLoading] = useState(false);

  // cargar si es view
  useEffect(() => {
    if (mode === "view" && id) {
      setLoading(true);
      getRequerimientoById(id).then((res) => {
        setData(res);
        setLoading(false);
      });
    } else if (mode === "create") {
      setData({
        numero: "",
        estado: "PENDIENTE",
        fecha: new Date().toISOString().slice(0, 10),
        ejecutor: "",
        etapa: "",
        descripcion: "",
        oficios: [],
        propuestas: [],
        respuestas: [],
      });
    }
  }, [mode, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (mode === "create") {
      await createRequerimiento(data);
    } else {
      await updateRequerimiento(id, data);
    }
    navigate("/testproduccion");
  };

  const addVersion = (field) => {
    const versionNumber = (data[field]?.length || 0) + 1;
    const nuevo = {
      version: versionNumber,
      ...(field === "respuestas"
        ? { texto: "" }
        : { oficio: "", fecha: new Date().toISOString().slice(0, 10) }),
    };
    setData((prev) => ({
      ...prev,
      [field]: [...prev[field], nuevo],
    }));
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <button
          onClick={() => navigate("/testproduccion")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" /> Atrás
        </button>

        <div className="flex gap-3">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:opacity-90"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:opacity-90"
            >
              <Edit className="w-4 h-4" /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 bg-gray-50">
        {loading ? (
          <div className="flex justify-center">
            <LoadingGif />
          </div>
        ) : (
          data && (
            <form className="max-w-3xl mx-auto space-y-6">
              {/* Campos principales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">N° Requerimiento</label>
                  <input
                    type="text"
                    name="numero"
                    value={data.numero}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={data.estado}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={data.fecha}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Ejecutor</label>
                  <input
                    type="text"
                    name="ejecutor"
                    value={data.ejecutor}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Etapa</label>
                  <input
                    type="text"
                    name="etapa"
                    value={data.etapa}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea
                  name="descripcion"
                  value={data.descripcion}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>

              {/* Oficios */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Oficios de envío a DMI</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => addVersion("oficios")}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Añadir versión
                    </button>
                  )}
                </div>
                <div className="space-y-2 mt-2">
                  {data.oficios.map((o, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={o.oficio}
                        onChange={(e) => {
                          const updated = [...data.oficios];
                          updated[idx].oficio = e.target.value;
                          setData({ ...data, oficios: updated });
                        }}
                        disabled={!isEditing}
                        className="px-3 py-2 border rounded"
                        placeholder="N° Oficio"
                      />
                      <input
                        type="date"
                        value={o.fecha}
                        onChange={(e) => {
                          const updated = [...data.oficios];
                          updated[idx].fecha = e.target.value;
                          setData({ ...data, oficios: updated });
                        }}
                        disabled={!isEditing}
                        className="px-3 py-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Propuestas */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Propuestas Técnicas</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => addVersion("propuestas")}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Añadir versión
                    </button>
                  )}
                </div>
                <div className="space-y-2 mt-2">
                  {data.propuestas.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={p.oficio}
                        onChange={(e) => {
                          const updated = [...data.propuestas];
                          updated[idx].oficio = e.target.value;
                          setData({ ...data, propuestas: updated });
                        }}
                        disabled={!isEditing}
                        className="px-3 py-2 border rounded"
                        placeholder="N° Oficio"
                      />
                      <input
                        type="date"
                        value={p.fecha}
                        onChange={(e) => {
                          const updated = [...data.propuestas];
                          updated[idx].fecha = e.target.value;
                          setData({ ...data, propuestas: updated });
                        }}
                        disabled={!isEditing}
                        className="px-3 py-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Respuestas */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Respuestas</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => addVersion("respuestas")}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Añadir versión
                    </button>
                  )}
                </div>
                <div className="space-y-2 mt-2">
                  {data.respuestas.map((r, idx) => (
                    <textarea
                      key={idx}
                      value={r.texto}
                      onChange={(e) => {
                        const updated = [...data.respuestas];
                        updated[idx].texto = e.target.value;
                        setData({ ...data, respuestas: updated });
                      }}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                    />
                  ))}
                </div>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
}
