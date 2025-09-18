const API = (import.meta.env.VITE_API_URL || "").trim() || null;
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function getAllZona({ token } = {}) {
  if (API) {
    const res = await fetch(`${API}/zonas`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener zonas");
    return res.json();
  }
  // FAKE
  return [
    { id_zona: 1, nombre: "NORTE" },
    { id_zona: 2, nombre: "CENTRO" },
    { id_zona: 3, nombre: "SUR" },
  ];
}
