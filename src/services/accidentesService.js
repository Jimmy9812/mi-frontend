// src/services/accidentesService.js
const API = import.meta.env.VITE_API_URL; // si existe → usa backend
const LS_KEY = "accidentes@seed";
const ESTADOS = ["FAVORABLE", "PENDIENTE", "RECHAZADO"];

/* =====================
 * Utilidades compartidas
 * ===================== */
const sleep = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/* =====================
 * Modo FAKE (LocalStorage)
 * ===================== */
function randomDate() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 8, 30).getTime();
  return new Date(start + Math.random() * (end - start));
}

function seed() {
  const exists = localStorage.getItem(LS_KEY);
  if (exists) return JSON.parse(exists);

  const list = Array.from({ length: 20 }).map((_, i) => {
    const idx = (i + 1).toString().padStart(4, "0");
    return {
      id: `AC${idx}`,
      tramite: `TRAMITE-${idx}`,
      estado: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
      fecha: randomDate().toISOString().slice(0, 10),

      // campos adicionales para detalle
      descripcion: "Descripción del accidente...",
      lugar: ["Norte", "Centro", "Sur"][i % 3],
      responsable: ["Juan Pérez", "Ana Gómez", "Carlos Ruiz"][i % 3],
      observaciones: "",
    };
  });

  localStorage.setItem(LS_KEY, JSON.stringify(list));
  return list;
}

function readAll() {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : seed();
}

function writeAll(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* =====================
 * API pública
 * ===================== */

/**
 * Lista paginada con filtros
 */
export async function listAccidentes({
  token,
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  if (API) {
    const q = new URLSearchParams({ page, pageSize, search, status });
    const res = await fetch(`${API}/accidentes?${q.toString()}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener accidentes");
    return res.json();
  }

  // FAKE
  await sleep();
  const all = readAll();
  const filtered = all.filter((x) => {
    const bySearch =
      !search ||
      x.tramite.toLowerCase().includes(search.toLowerCase()) ||
      x.estado.toLowerCase().includes(search.toLowerCase());
    const byStatus = status === "ALL" || x.estado === status;
    return bySearch && byStatus;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, page, total, totalPages };
}

/**
 * Crear accidente
 */
export async function createAccidente(arg) {
  const token = arg?.token;
  const payload = arg?.payload ?? arg;

  if (API) {
    const res = await fetch(`${API}/accidentes`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("No se pudo crear el accidente");
    return res.json();
  }

  // FAKE
  await sleep();
  const all = readAll();
  const next = (all.length + 1).toString().padStart(4, "0");
  const nuevo = {
    id: `AC${next}`,
    tramite: `TRAMITE-${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: payload?.fecha || new Date().toISOString().slice(0, 10),
    descripcion: payload?.descripcion || "",
    lugar: payload?.lugar || "",
    responsable: payload?.responsable || "",
    observaciones: payload?.observaciones || "",
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

/**
 * Obtener accidente por id
 */
export async function getAccidente({ token, id }) {
  if (API) {
    const res = await fetch(`${API}/accidentes/${id}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener accidente");
    return res.json();
  }

  // FAKE
  await sleep();
  const all = readAll();
  const found = all.find((x) => x.id === id || x.tramite === id);
  if (!found) throw new Error("Accidente no encontrado");
  return found;
}

/**
 * Exportar CSV
 */
export async function exportAccidentesCsv(arg = {}) {
  if (API && (arg.token || arg.search !== undefined || arg.status !== undefined)) {
    const { token, search = "", status = "ALL" } = arg;
    const q = new URLSearchParams({ search, status });
    const res = await fetch(`${API}/accidentes/export?${q.toString()}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo exportar");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // FAKE
  const items = Array.isArray(arg) ? arg : arg.items;
  const headers = ["tramite", "estado", "fecha"];
  const rows = (items || []).map((i) => [i.tramite, i.estado, i.fecha]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
