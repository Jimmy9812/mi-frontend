// src/services/incidentesService.js
const API = (import.meta.env.VITE_API_URL || "").trim() || null; // null si vacío
const LS_KEY = "incidentes@seed";
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
  const exists = typeof localStorage !== "undefined" && localStorage.getItem(LS_KEY);
  if (exists) return JSON.parse(exists);

  const list = Array.from({ length: 37 }).map((_, i) => {
    const idx = (i + 1).toString().padStart(5, "0");
    return {
      id: `IN${idx}`,
      numero: `IN${idx}`,
      estado: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
      fecha: randomDate().toISOString().slice(0, 10),

      tecnico: "Juan Pérez",
      analista: "Ana Gómez",
      unidad_zonal: ["NORTE", "CENTRO", "SUR"][i % 3],
      fecha_ingreso: randomDate().toISOString().slice(0, 10),
      tipologia_tramite: "TRÁMITE X",
      anio_sirecq: "2024",
      mensaje_error: "Mensaje de error de ejemplo",
      fecha_solucion: "",
      descripcion: "Descripción detallada del error...",
      observaciones: "Observaciones varias...",
      error_reportado: "Stacktrace o mensaje reportado por el usuario...",
    };
  });

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
  return list;
}

function readAll() {
  if (typeof localStorage === "undefined") return seed();
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : seed();
}

function writeAll(list) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
}

/* =====================
 * API pública
 * ===================== */

/**
 * Lista paginada con filtros
 * - API: GET /incidentes?page=&pageSize=&search=&status=
 * - FAKE: LocalStorage
 */
export async function listIncidentes({
  token,
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  if (API) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search: search || "",
    });
    if (status && status !== "ALL") params.set("status", status);

    const res = await fetch(`${API}/incidentes?${params.toString()}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener incidentes");
    const data = await res.json();

    // Mapeo defensivo por si tu backend usa nombres distintos
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
    const pageNum = Number(data.page ?? 1);
    const total = Number(data.total ?? items.length);
    const totalPages = Number(data.totalPages ?? data.pages ?? Math.max(1, Math.ceil(total / pageSize)));

    return { items, page: pageNum, total, totalPages };
  }

  // ---- FAKE ----
  await sleep();
  const all = readAll();
  const filtered = all.filter((x) => {
    const s = (search || "").toLowerCase();
    const bySearch = !s || x.numero.toLowerCase().includes(s) || x.estado.toLowerCase().includes(s);
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
 * Obtener un incidente por id
 * - API: GET /incidentes/:id
 * - FAKE: busca en LocalStorage
 */
export async function getIncidente({ token, id }) {
  if (!id) throw new Error("Id requerido");
  if (API) {
    const res = await fetch(`${API}/incidentes/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener el incidente");
    return res.json();
  }

  await sleep();
  const all = readAll();
  const found = all.find((x) => x.id === id || x.numero === id);
  if (!found) throw new Error("Incidente no encontrado");
  return found;
}

/**
 * Crear incidente
 * - API: POST /incidentes
 * - FAKE: inserta en LocalStorage
 * Compat: createIncidente(payload) o createIncidente({ token, payload })
 */
export async function createIncidente(arg) {
  const token = arg?.token;
  const payload = arg?.payload ?? arg;

  if (API) {
    const res = await fetch(`${API}/incidentes`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("No se pudo crear el incidente");
    return res.json();
  }

  await sleep();
  const all = readAll();
  const next = (all.length + 1).toString().padStart(5, "0");
  const nuevo = {
    id: `IN${next}`,
    numero: `IN${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: payload?.fecha || new Date().toISOString().slice(0, 10),
    tecnico: payload?.tecnico || "",
    analista: payload?.analista || "",
    unidad_zonal: payload?.unidad_zonal || "",
    fecha_ingreso: payload?.fecha_ingreso || new Date().toISOString().slice(0, 10),
    tipologia_tramite: payload?.tipologia_tramite || "",
    anio_sirecq: payload?.anio_sirecq || "",
    mensaje_error: payload?.mensaje_error || "",
    fecha_solucion: payload?.fecha_solucion || "",
    descripcion: payload?.descripcion || "",
    observaciones: payload?.observaciones || "",
    error_reportado: payload?.error_reportado || "",
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

/**
 * Actualizar incidente (para edición futura)
 * - API: PUT /incidentes/:id
 * - FAKE: actualiza en LocalStorage
 */
export async function updateIncidente({ token, id, payload }) {
  if (!id) throw new Error("Id requerido");
  if (API) {
    const res = await fetch(`${API}/incidentes/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("No se pudo actualizar el incidente");
    return res.json();
  }

  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.numero === id);
  if (idx === -1) throw new Error("Incidente no encontrado");
  const updated = { ...all[idx], ...payload };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

/**
 * Exportar CSV
 * - API: GET /incidentes/export?search=&status= (devuelve blob)
 * - FAKE: genera CSV local a partir de items
 *
 * Compat:
 *   exportIncidentesCsv({ token, search, status })
 *   exportIncidentesCsv(items)
 */
export async function exportIncidentesCsv(arg = {}) {
  // API
  if (API && (arg.token || arg.search !== undefined || arg.status !== undefined)) {
    const { token, search = "", status = "ALL" } = arg;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "ALL") params.set("status", status);

    const res = await fetch(`${API}/incidentes/export?${params.toString()}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo exportar");

    const blob = await res.blob();

    // Nombre desde Content-Disposition si viene del back
    const cd = res.headers.get("Content-Disposition") || "";
    const match = /filename="?([^"]+)"?/i.exec(cd);
    const filename =
      match?.[1] || `incidentes_${new Date().toISOString().slice(0, 10)}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // FAKE: si me pasan items directamente
  const items = Array.isArray(arg) ? arg : arg.items;
  const headers = ["numero", "estado", "fecha"];
  const rows = (items || []).map((i) => [i.numero, i.estado, i.fecha]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidentes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
