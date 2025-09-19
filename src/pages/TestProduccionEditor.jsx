import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft, Save } from "lucide-react";
import {
  getRequerimientoById,
  createRequerimiento,
  updateRequerimiento,
} from "../services/testProduccionService";

export default function TestProduccionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    numero: "",
    estado: "ENVIADO",
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      async function load() {
        setLoading(true);
        const data = await getRequerimientoById(id);
        if (data) setForm(data);
        setLoading(false);
      }
      load();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateRequerimiento(id, form);
      } else {
        await createRequerimiento(form);
      }
      navigate("/test-produccion"); // ✅ corregido
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2 text-slate-600">
          <Home className="w-5 h-5" />
          <Link to="/dashboard" className="hover:underline">
            Home
          </Link>
          <span className="text-slate-400">/</span>
          <Link to="/test-produccion" className="hover:underline"> {/* ✅ corregido */}
            Test/Producción
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-semibold">{isEdit ? "Editar" : "Nuevo"}</span>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-slate-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-white shadow p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Número de requerimiento
            </label>
            <input
              type="text"
              name="numero"
              value={form.numero}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="ENVIADO">ENVIADO</option>
              <option value="ATENDIDO">ATENDIDO</option>
              <option value="RECHAZADO">RECHAZADO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#8B5E3C] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}
