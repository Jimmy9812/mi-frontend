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
 * Función para transformar datos del backend
 * ===================== */
function transformBackendData(backendItems) {
  if (!Array.isArray(backendItems)) return [];
  
  return backendItems.map(item => ({
    id: item.id_incidente,
    numero: item.no_incidente,
    estado: item.estado_acc_inc?.nombre_estado_acc_inc || 'Sin estado',
    fecha: item.fechaingresoerror,
    // Campos adicionales que puedas necesitar
    descripcion: item.descripcionerror,
    zona: item.zona?.nombre_zona,
    tipologia: item.tipologia,
    anio_sirecq: item.añosirecq,
    mensaje_error: item.mensajeerror,
    fecha_solucion: item.fech_solucion,
    observaciones: item.obs_incidente,
  }));
}

/* =====================
 * Función de paginación en frontend
 * ===================== */
function paginateData(items, page, pageSize, search = "", status = "ALL") {
  // Filtros
  const filtered = items.filter((x) => {
    const s = (search || "").toLowerCase();
    const bySearch = !s || 
      x.numero?.toLowerCase().includes(s) || 
      x.estado?.toLowerCase().includes(s) ||
      x.descripcion?.toLowerCase().includes(s);
    const byStatus = status === "ALL" || x.estado === status;
    return bySearch && byStatus;
  });

  // Paginación
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(start, start + pageSize);

  return {
    items: paginatedItems,
    page,
    total,
    totalPages
  };
}

/* =====================
 * API pública
 * ===================== */

/**
 * Lista paginada con filtros
 * - API: GET /incidentes (obtiene todos y pagina en frontend)
 * - FAKE: LocalStorage
 */
export async function listIncidentes({
  token,
  role,
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  let endpoint = 'incidentes';
  if (role === 'TÉCNICO') endpoint = 'incidentes/tecnicos';
  else if (role === 'ANALISTA') endpoint = 'incidentes/analistas';

  if (API) {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        headers: authHeaders(token),
      });
      
      if (!res.ok) throw new Error("No se pudo obtener incidentes");
      
      const data = await res.json();
      console.log('Datos del backend:', data);
      
      // Transformar los datos del backend
      const transformedItems = transformBackendData(data);
      console.log('Datos transformados:', transformedItems);
      
      // Aplicar paginación y filtros en el frontend
      const result = paginateData(transformedItems, page, pageSize, search, status);
      console.log('Resultado final:', result);
      
      return result;
    } catch (error) {
      console.error('Error en listIncidentes:', error);
      throw error;
    }
  }

  // ---- FAKE ----
  await sleep();
  const all = readAll();
  return paginateData(all, page, pageSize, search, status);
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
    const data = await res.json();
    
    // Transformar los datos individuales también
    return {
      id: data.id_incidente,
      numero: data.no_incidente,
      estado: data.estado_acc_inc?.nombre_estado_acc_inc || 'Sin estado',
      fecha: data.fechaingresoerror,
      descripcion: data.descripcionerror,
      zona: data.zona?.nombre_zona,
      tipologia: data.tipologia,
      anio_sirecq: data.añosirecq,
      mensaje_error: data.mensajeerror,
      fecha_solucion: data.fech_solucion,
      observaciones: data.obs_incidente,
    };
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
 */
export async function createIncidente(arg) {
  const token = arg?.token;
  const payload = arg?.payload ?? arg;

  // Mapear payload al formato del backend
  const mappedPayload = {
    no_incidente: payload.numero,
    fechaingresoerror: payload.fecha_ingreso,
    tipologia: payload.tipologia_tramite,
    descripcionerror: payload.descripcion,
    añosirecq: parseInt(payload.anio_sirecq) || 2024,
    id_zona: parseInt(payload.id_zona) || 1,
    id_tecnico: parseInt(payload.id_tecnico),
    id_analista: parseInt(payload.id_analista),
    asignaciones: payload.asignaciones ? payload.asignaciones.split(',').map(id => ({ idRolUsuario: parseInt(id.trim()) })) : [],
    error_reportado: payload.error_reportado || "", // base64 image
  };

  if (API) {
    const res = await fetch(`${API}/incidentes`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(mappedPayload),
    });
    if (!res.ok) throw new Error("No se pudo crear el incidente");
    const data = await res.json();
    
    // Transformar respuesta
    return {
      id: data.id_incidente,
      numero: data.no_incidente,
      estado: data.estado_acc_inc?.nombre_estado_acc_inc || 'PENDIENTE',
      fecha: data.fechaingresoerror,
      descripcion: data.descripcionerror,
    };
  }

  await sleep();
  const all = readAll();
  const next = (all.length + 1).toString().padStart(5, "0");
  const nuevo = {
    id: `IN${next}`,
    numero: `IN${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: payload?.fecha || new Date().toISOString().slice(0, 10),
    id_tecnico: payload?.id_tecnico || 1,
    id_analista: payload?.id_analista || 3,
    id_zona: payload?.id_zona || 1,
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
 * Actualizar incidente
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
  const headers = ["numero", "estado", "fecha", "descripcion"];
  const rows = (items || []).map((i) => [
    i.numero || '', 
    i.estado || '', 
    i.fecha || '',
    i.descripcion || ''
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidentes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}