import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

// --- fake login (mientras no hay backend) ---
function fakeLogin({ email, password }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "login@gmail.com" && password === "123456") {
        resolve({ token: "fake-jwt-123", user: { email } });
      } else {
        reject(new Error("Credenciales inválidas"));
      }
    }, 900);
  });
}

const useFake = import.meta.env.VITE_USE_FAKE === "true";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const api = useFake ? fakeLogin : authService.login;
      const res = await api(formData);
      localStorage.setItem("token", res.token);
      navigate("/dashboard"); // 👈 redirección
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen">
      {/* fondo + overlay */}
      <div className="absolute inset-0 bg-cover bg-center"
           style={{ backgroundImage: "url('/quito-bg.jpg')" }} />
      <div className="absolute inset-0 bg-black/60" />

      {/* contenido */}
      <div className="relative flex flex-col md:flex-row w-full">
        {/* izquierda */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center relative p-6">
          <h1 className="text-white font-bold text-2xl mb-6 leading-tight">
            DIRECCIÓN METROPOLITANA <br /> DE CATASTRO
          </h1>
          <img src="/escudo.png" alt="Escudo Municipio" className="w-48 md:w-64" />
          <div className="hidden md:block absolute right-0 top-1/4 h-1/2 w-[2px] bg-white/60" />
        </div>

        {/* derecha */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <div className="bg-white/20 backdrop-blur-md p-8 md:p-10 rounded-2xl w-full max-w-md shadow-xl border border-white/30">
            <h2 className="text-center text-2xl font-semibold text-white mb-2">Bienvenido</h2>
            <h3 className="text-center text-xl font-bold text-white mb-6">Inicio de sesión</h3>

            {error && (
              <div className="mb-4 text-sm text-red-200 bg-red-900/30 border border-red-400 rounded-md p-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-white mb-1">Correo electrónico</label>
                <input
                  id="email" name="email" type="email" placeholder="login@gmail.com"
                  value={formData.email} onChange={handleChange} required disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-white mb-1">Contraseña</label>
                <input
                  id="password" name="password" type="password" placeholder="********"
                  value={formData.password} onChange={handleChange} required disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-white/80 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                <p className="text-sm text-right text-blue-300 mt-1 cursor-pointer hover:underline">
                  ¿Olvidaste tu contraseña?
                </p>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Iniciando…
                  </>
                ) : ("INICIAR →")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
