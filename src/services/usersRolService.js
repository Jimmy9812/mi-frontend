const API = (import.meta.env.VITE_API_URL || "").trim() || null;
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function getTecnicoIncidentes({ token } = {}) {
  if (API) {
    const res = await fetch(`${API}/users-rol/tecIncidente`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener técnicos");
    return res.json();
  }
  // FAKE
  return [
    { id_usuario: 1, nombre_completo: "Juan Pérez" },
    { id_usuario: 2, nombre_completo: "Carlos López" },
  ];
}

export async function getAnalistas({ token } = {}) {
  if (API) {
    const res = await fetch(`${API}/users-rol/analistas`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener analistas");
    return res.json();
  }
  // FAKE
  return [
    { id_usuario: 3, nombre_completo: "Ana Gómez" },
    { id_usuario: 4, nombre_completo: "María Fernández" },
  ];
}
