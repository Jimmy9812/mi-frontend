// src/services/authService.js

// Quitamos el fallback “duro” para obligarnos a configurar el .env correctamente.
// Si quieres, puedes dejar un fallback de desarrollo.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export const authService = {
  login: async ({ email, password }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al iniciar sesión");
    }

    return res.json(); // { token, user }
  },
};
