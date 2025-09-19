// src/services/accidentesService.js
const API = import.meta.env.VITE_API_URL; // si existe, intentamos usar backend
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

export function seed() {
  const exists = localStorage.getItem(LS_KEY);
  if (exists) {
    try {
      const parsed = JSON.parse(exists);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tramite) {
        return parsed; // ya existen datos completos
      }
    } catch {
      // si falla el parseo, seguimos y regeneramos
    }
  }

  const list = Array.from({ length: 15 }).map((_, i) => {
    const idx = (i + 1).toString().padStart(4, "0");
    return {
      id: `AC${idx}`,
      tramite: `TRAM-${idx}`,
      estado: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
      fecha: randomDate().toISOString().slice(0, 10),

      // 👉 Campos completos para AccidenteEditor
      oficio: `SHOT-DMC-USIGC-2025-${idx}-O`,
      tecnico_responsable: `Técnico ${i + 1}`,
      fecha_ingreso_tramite: randomDate().toISOString().slice(0, 10),
      fecha_asignacion_tramite: randomDate().toISOString().slice(0, 10),
      tipologia_tramite: "31",
      inspeccion: Math.random() > 0.5 ? "SI" : "NO",
      numero_interno: `INT-${idx}`,
      numero_documento: `DOC-${idx}`,
      propietario: `Propietario ${i + 1}`,
      numero_predio: `${5140000 + i}`,
      clave_catastral: `80463013${100 + i}`,
      parroquia: "PACTO",
      estado_tramite: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
      fecha_control: randomDate().toISOString().slice(0, 10),
      control_calidad: "OK/KC",
      codigo_consulta: `CC-${idx}`,
      lugar: "Quito",
      descripcion: "Descripción breve del accidente...",
      responsable: "Responsable X",
      observaciones: "Observación generada automáticamente.",
    };
  });

  // 👉 Ejemplo fijo siempre presente
  const extras = [
    {
      id: "AC1001",
      tramite: "TRAM-1001",
      estado: "FAVORABLE",
      fecha: "2025-09-19",
      lugar: "Quito",
      descripcion: "Accidente favorable registrado como prueba.",
      responsable: "Ing. Ana Torres",
      observaciones: "Todo en orden.",

      oficio: "SHOT-DMC-USIGC-2025-1-O",
      tecnico_responsable: "RAUL LOPEZ",
      fecha_ingreso_tramite: "2025-08-22",
      fecha_asignacion_tramite: "2025-09-01",
      tipologia_tramite: "31",
      inspeccion: "NO",
      numero_interno: "INT-001",
      numero_documento: "DOC-001",
      propietario: "Juan Pérez",
      numero_predio: "5140886",
      clave_catastral: "8046301313",
      parroquia: "PACTO",
      estado_tramite: "FAVORABLE",
      fecha_control: "2025-09-10",
      control_calidad: "OK/KC",
      codigo_consulta: "CC-001",
    },
  ];

  const finalList = [...extras, ...list];
  localStorage.setItem(LS_KEY, JSON.stringify(finalList));
  return finalList;
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

export async function listAccidentes({
  token,
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  if (API) {
    try {
      const q = new URLSearchParams({ page, pageSize, search, status });
      const res = await fetch(`${API}/accidentes?${q.toString()}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("API no respondió");
      return res.json();
    } catch (err) {
      console.warn("⚠️ Backend no disponible, usando datos mock");
    }
  }

  // === MOCK ===
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

export async function getAccidente({ token, id }) {
  if (API) {
    try {
      const res = await fetch(`${API}/accidentes/${id}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("API no respondió");
      return res.json();
    } catch {
      console.warn("⚠️ Backend no disponible, usando datos mock");
    }
  }

  await sleep();
  const all = readAll();
  const found = all.find((x) => x.id === id || x.tramite === id);
  if (!found) throw new Error("Accidente no encontrado");
  return found;
}

export async function createAccidente(arg) {
  const token = arg?.token;
  const payload = arg?.payload ?? arg;

  if (API) {
    try {
      const res = await fetch(`${API}/accidentes`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API no respondió");
      return res.json();
    } catch {
      console.warn("⚠️ Backend no disponible, usando datos mock");
    }
  }

  await sleep();
  const all = readAll();
  const next = (all.length + 1).toString().padStart(5, "0");
  const nuevo = {
    id: `AC${next}`,
    tramite: `TRAM-${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: payload?.fecha || new Date().toISOString().slice(0, 10),

    oficio: payload?.oficio || "",
    tecnico_responsable: payload?.tecnico_responsable || "",
    fecha_ingreso_tramite: payload?.fecha_ingreso_tramite || "",
    fecha_asignacion_tramite: payload?.fecha_asignacion_tramite || "",
    tipologia_tramite: payload?.tipologia_tramite || "",
    inspeccion: payload?.inspeccion || "",
    numero_interno: payload?.numero_interno || "",
    numero_documento: payload?.numero_documento || "",
    propietario: payload?.propietario || "",
    numero_predio: payload?.numero_predio || "",
    clave_catastral: payload?.clave_catastral || "",
    parroquia: payload?.parroquia || "",
    estado_tramite: payload?.estado_tramite || "",
    fecha_control: payload?.fecha_control || "",
    control_calidad: payload?.control_calidad || "",
    codigo_consulta: payload?.codigo_consulta || "",

    lugar: payload?.lugar || "",
    descripcion: payload?.descripcion || "",
    responsable: payload?.responsable || "",
    observaciones: payload?.observaciones || "",
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

export async function updateAccidente({ token, id, payload }) {
  if (API) {
    try {
      const res = await fetch(`${API}/accidentes/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API no respondió");
      return res.json();
    } catch {
      console.warn("⚠️ Backend no disponible, usando datos mock");
    }
  }

  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.tramite === id);
  if (idx === -1) throw new Error("Accidente no encontrado");
  const updated = { ...all[idx], ...payload };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export async function exportAccidentesCsv(arg = {}) {
  if (API && (arg.token || arg.search !== undefined || arg.status !== undefined)) {
    try {
      const { token, search = "", status = "ALL" } = arg;
      const q = new URLSearchParams({ search, status });
      const res = await fetch(`${API}/accidentes/export?${q.toString()}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("API no respondió");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    } catch {
      console.warn("⚠️ Backend no disponible, usando datos mock");
    }
  }

  // === CSV MOCK ===
  const items = Array.isArray(arg) ? arg : arg.items;
  const headers = [
    "tramite",
    "estado",
    "fecha",
    "lugar",
    "responsable",
    "descripcion",
    "observaciones",
  ];
  const rows = (items || []).map((i) => [
    i.tramite,
    i.estado,
    i.fecha,
    i.lugar,
    i.responsable,
    i.descripcion,
    i.observaciones,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
