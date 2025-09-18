// src/components/VersionModal.jsx
import { useState } from "react";

export default function VersionModal({ isOpen, onClose, onSave, title, fields }) {
  const [form, setForm] = useState(
    fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-[#8b5e3c] text-white hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
