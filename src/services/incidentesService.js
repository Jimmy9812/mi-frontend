// src/services/incidentesService.js
const LS_KEY = "incidentes@seed";

const ESTADOS = ["FAVORABLE", "PENDIENTE", "RECHAZADO"];

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDate() {
  // fechas 2025-01 a 2025-09 aprox
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 8, 30).getTime();
  return new Date(start + Math.random() * (end - start));
}

function seed() {
  const exists = localStorage.getItem(LS_KEY);
  if (exists) return JSON.parse(exists);

  const list = Array.from({ length: 37 }).map((_, i) => {
    const idx = (i + 1).toString().padStart(5, "0");
    return {
      id: `IN${idx}`,
      numero: `IN${idx}`,
      estado: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
      fecha: randomDate().toISOString().slice(0, 10), // yyyy-mm-dd
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

// ---------- API "fake" ----------

export async function listIncidentes({
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  await delay();

  const all = readAll();

  const filtered = all.filter((x) => {
    const bySearch =
      !search ||
      x.numero.toLowerCase().includes(search.toLowerCase()) ||
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

export async function createIncidente(payload) {
  await delay();
  const all = readAll();

  const next = (all.length + 1).toString().padStart(5, "0");
  const nuevo = {
    id: `IN${next}`,
    numero: `IN${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: payload?.fecha || new Date().toISOString().slice(0, 10),
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

export async function exportIncidentesCsv(items) {
  const headers = ["numero", "estado", "fecha"];
  const rows = items.map((i) => [i.numero, i.estado, i.fecha]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidentes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
