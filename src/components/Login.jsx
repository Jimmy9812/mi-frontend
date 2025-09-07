import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({
    correo_usuario: "",
    contrasenia_usuario: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(formData);
      await login(res); // Esto actualizará el contexto con el usuario y token

      // La navegación ahora la maneja el contexto según los roles
    } catch (err) {
      setError(
        err.message ||
          "Error al iniciar sesión. Por favor, verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen">
      {/* fondo + overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/quito-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* contenido */}
      <div className="relative flex flex-col md:flex-row w-full">
        {/* izquierda */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center relative p-6">
          <h1 className="text-white font-bold text-2xl mb-6 leading-tight">
            DIRECCIÓN METROPOLITANA <br /> DE CATASTRO
          </h1>
          <img
            src="/escudo.png"
            alt="Escudo Municipio"
            className="w-48 md:w-64"
          />
          <div className="hidden md:block absolute right-0 top-1/4 h-1/2 w-[2px] bg-white/60" />
        </div>

        {/* derecha */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <div className="bg-white/20 backdrop-blur-md p-8 md:p-10 rounded-2xl w-full max-w-md shadow-xl border border-white/30">
            <h2 className="text-center text-2xl font-semibold text-white mb-2">
              Bienvenido
            </h2>
            <h3 className="text-center text-xl font-bold text-white mb-6">
              Inicio de sesión
            </h3>

            {error && (
              <div className="mb-4 text-sm text-red-200 bg-red-900/30 border border-red-400 rounded-md p-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="correo_usuario"
                  className="block text-white mb-1"
                >
                  Correo electrónico
                </label>
                <input
                  id="correo_usuario"
                  name="correo_usuario"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.correo_usuario}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label
                  htmlFor="contrasenia_usuario"
                  className="block text-white mb-1"
                >
                  Contraseña
                </label>
                <input
                  id="contrasenia_usuario"
                  name="contrasenia_usuario"
                  type="password"
                  placeholder="********"
                  value={formData.contrasenia_usuario}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                <p className="text-sm text-right text-blue-300 mt-1 cursor-pointer hover:underline">
                  ¿Olvidaste tu contraseña?
                </p>
              </div>

              {/* botón corregido */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando…</span>
                  </>
                ) : (
                  <span>INICIAR →</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
