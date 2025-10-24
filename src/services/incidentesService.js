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

// 🔹 Normalizar fecha al formato YYYY-MM-DD (sin zona horaria)
function toBackendDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString + "T12:00:00"); // fija mediodía local
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 🔹 Normalizar texto (quita tildes, minúsculas)
function normalizeText(text) {
  return text
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // elimina acentos
}

/* =====================
 * Modo FAKE (LocalStorage)
 * ===================== */
function randomDate() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 8, 30).getTime();
  return new Date(start + Math.random() * (end - start));
}

function seed() {
  const exists =
    typeof localStorage !== "undefined" && localStorage.getItem(LS_KEY);
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

  return backendItems.map((item) => ({
    id: item.id_incidente,
    numero: item.no_incidente,
    estado: item.estado_acc_inc?.nombre_estado_acc_inc || "Sin estado",
    fecha: item.fechaingresoerror,
    descripcion: item.descripcionerror,
    zona: item.zona?.nombre_zona,
    tipologia: item.tipologia,
    anio_sirecq: item["aniosirecq"] || item.anio_sirecq || null,
    mensaje_error: item.mensajeerror,
    fecha_solucion: item.fech_solucion,
    observaciones: item.obs_incidente,
  }));
}

// Convert backend Buffer-like object to data URL (browser)
function bufferToDataUrl(bufObj) {
  if (!bufObj) return null;
  const arr = bufObj.data || bufObj;
  if (!arr || !arr.length) return null;
  const uint8 = new Uint8Array(arr);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.prototype.slice.call(uint8.subarray(i, i + chunkSize))
    );
  }
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(uint8).toString("base64");
  const isPng =
    uint8[0] === 137 && uint8[1] === 80 && uint8[2] === 78 && uint8[3] === 71;
  const mime = isPng ? "image/png" : "application/octet-stream";
  return `data:${mime};base64,${b64}`;
}

function transformBackendSingle(item) {
  if (!item) return null;

  const tecnico = item.usuariosIncidente?.find((u) =>
    normalizeText(u.rolUsuario?.rol?.nombre_rol)?.includes("tecnico")
  );

  const analista = item.usuariosIncidente?.find((u) =>
    normalizeText(u.rolUsuario?.rol?.nombre_rol)?.includes("analista")
  );

  return {
    id_incidente: item.id_incidente,
    id: item.id_incidente,
    numero: item.no_incidente,
    estado: item.estado_acc_inc?.nombre_estado_acc_inc || "Sin estado",
    fecha_ingreso: item.fechaingresoerror
      ? new Date(item.fechaingresoerror).toISOString().slice(0, 10)
      : null,
    descripcion: item.descripcionerror,
    zona: item.zona?.nombre_zona,
    id_zona: item.zona?.id_zona,
    tipologia_tramite: item.tipologia,
    aniosirecq: item.aniosirecq || null,
    mensaje_error: item.mensajeerror,
    
    // 🔹 Usar los IDs que vienen directamente del backend (tu método funciona bien)
    id_tecnico: item.id_tecnico,
    id_analista: item.id_analista,
    
    fecha_solucion: item.fech_solucion
      ? new Date(item.fech_solucion).toISOString().slice(0, 10)
      : null,
    observaciones: item.obs_incidente,

    asignaciones: Array.isArray(item.usuariosIncidente)
      ? item.usuariosIncidente
          .map((u) => u.rolUsuario?.id_rol_usuario)
          .filter(Boolean)
          .join(",")
      : "",

    // 🔹 Nombres de técnico y analista
    tecnico_nombre: tecnico
      ? `${tecnico.rolUsuario.usuario?.nombre_usuario || ""} ${tecnico.rolUsuario.usuario?.apellidos_usuario || ""}`.trim()
      : null,

    analista_nombre: analista
      ? `${analista.rolUsuario.usuario?.nombre_usuario || ""} ${analista.rolUsuario.usuario?.apellidos_usuario || ""}`.trim()
      : null,

    error_reportado: bufferToDataUrl(item.error_img) || null,
    _raw: item,
  };
}

/* =====================
 * Función de paginación en frontend
 * ===================== */
function paginateData(items, page, pageSize, search = "", status = "ALL") {
  const filtered = items.filter((x) => {
    const s = (search || "").toLowerCase();
    const bySearch =
      !s ||
      x.numero?.toLowerCase().includes(s) ||
      x.estado?.toLowerCase().includes(s) ||
      x.descripcion?.toLowerCase().includes(s);
    const byStatus = status === "ALL" || x.estado === status;
    return bySearch && byStatus;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(start, start + pageSize);

  return {
    items: paginatedItems,
    page,
    total,
    totalPages,
  };
}

/* =====================
 * API pública
 * ===================== */

// Listar incidentes
export async function listIncidentes({
  token,
  role,
  page = 1,
  pageSize = 5,
  search = "",
  status = "ALL",
} = {}) {
  let endpoint = "incidentes";
  if (role === "TÉCNICO") endpoint = "incidentes/tecnicos";
  else if (role === "ANALISTA") endpoint = "incidentes/analistas";

  if (API) {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("No se pudo obtener incidentes");
      const data = await res.json();

      const transformedItems = transformBackendData(data);
      return paginateData(transformedItems, page, pageSize, search, status);
    } catch (error) {
      console.error("Error en listIncidentes:", error);
      throw error;
    }
  }

  await sleep();
  const all = readAll();
  return paginateData(all, page, pageSize, search, status);
}

export async function getIncidente(id_incidente, token) {
  if (!id_incidente) throw new Error("Id incidente requerido");
  if (API) {
    const res = await fetch(
      `${API}/incidentes/${encodeURIComponent(id_incidente)}`,
      {
        headers: authHeaders(token),
      }
    );
    if (!res.ok) throw new Error("No se pudo obtener el incidente");
    const data = await res.json();
    return transformBackendSingle(data);
  }

  await sleep();
  const all = readAll();
  const found = all.find((x) => x.id === id_incidente);
  if (!found) throw new Error("Incidente no encontrado");
  return found;
}

// Crear incidente
export async function createIncidente({ token, payload }) {
  let errorImg = "";
  if (payload.error_reportado) {
    if (
      typeof payload.error_reportado === "string" &&
      payload.error_reportado.startsWith("data:")
    ) {
      errorImg = payload.error_reportado.split(",")[1];
    } else if (typeof payload.error_reportado === "string") {
      errorImg = payload.error_reportado;
    }
  }

  const mappedPayload = {
    no_incidente: payload.numero,
    fechaingresoerror: toBackendDate(payload.fecha_ingreso),
    tipologia: payload.tipologia_tramite,
    descripcionerror: payload.descripcion,
    aniosirecq: parseInt(payload.anio_sirecq) || 2024,
    id_zona: parseInt(payload.id_zona) || 1,
    id_tecnico: payload.id_tecnico ? Number(payload.id_tecnico) : undefined,
    id_analista: payload.id_analista ? Number(payload.id_analista) : undefined,
    asignaciones: Array.isArray(payload.asignaciones) ? payload.asignaciones : [],
    error_img: errorImg,
    fech_solucion: toBackendDate(payload.fecha_solucion),
    obs_incidente: payload.observaciones,
    mensajeerror: payload.mensaje_error,
  };

  console.log("Datos que se van a enviar:", mappedPayload);

  if (API) {
    const res = await fetch(`${API}/incidentes`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(mappedPayload),
    });

    if (!res.ok) {
      let errorMessage = `Error ${res.status}: ${res.statusText}`;
      try {
        const errorText = await res.text();
        console.error("Respuesta del servidor (JSON):", errorText);
        errorMessage = errorText || errorMessage;
      } catch (e) {
        console.error("No se pudo leer la respuesta de error:", e);
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return transformBackendSingle(data);
  }

  // Modo fake...
  await sleep();
  const all = readAll();
  const next = (all.length + 1).toString().padStart(5, "0");
  const nuevo = {
    id: `IN${next}`,
    numero: `IN${next}`,
    estado: payload?.estado || "PENDIENTE",
    fecha: toBackendDate(payload?.fecha_ingreso) || new Date().toISOString(),
    ...payload,
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

// Actualizar incidente
export async function updateIncidente({ token, id, payload }) {
  if (!id) throw new Error("Id requerido");

  const mappedPayload = {
    fechaingresoerror: toBackendDate(payload.fecha_ingreso),
    tipologia: payload.tipologia_tramite,
    descripcionerror: payload.descripcion,
    aniosirecq: parseInt(payload.aniosirecq) || null,
    id_zona: payload.id_zona ? parseInt(payload.id_zona) : undefined,
    id_tecnico: payload.id_tecnico ? Number(payload.id_tecnico) : undefined,
    id_analista: payload.id_analista ? Number(payload.id_analista) : undefined,
    asignaciones: Array.isArray(payload.asignaciones) ? payload.asignaciones : undefined,
    mensajeerror: payload.mensaje_error,
    fech_solucion: toBackendDate(payload.fecha_solucion),
    obs_incidente: payload.observaciones,
    error_img: payload.error_reportado
      ? payload.error_reportado.startsWith("data:")
        ? payload.error_reportado.split(",")[1]
        : payload.error_reportado
      : undefined,
  };

  console.log("Datos de actualización que se envían:", mappedPayload);

  if (API) {
    const res = await fetch(`${API}/incidentes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(mappedPayload),
    });
    if (!res.ok) throw new Error("No se pudo actualizar el incidente");
    return res.json();
  }
  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.numero === id);
  if (idx === -1) throw new Error("Incidente no encontrado");
  const updated = { ...all[idx], ...mappedPayload };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

// Exportar a XLSX 
export async function exportIncidentesXlsx({ token, items, search = "", status = "ALL", filename = null }) {
  const XLSX = await import('xlsx');

  // Si no hay items, intentar obtenerlos del backend
  if (API && !items && (token || search !== undefined || status !== undefined)) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "ALL") params.set("status", status);

    const res = await fetch(`${API}/incidentes?${params.toString()}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo obtener los datos para exportar");
    const data = await res.json();
    items = transformBackendData(data);
  }

  // Si no hay items o no es array, error
  if (!Array.isArray(items)) {
    throw new Error("No hay datos para exportar");
  }

  // Mapear items a formato tabular según campos del formulario
  const rows = items.map(item => ({
    "N° De Incidencia": item.numero,
    "Tipología de trámite": item.tipologia_tramite || item.tipologia,
    "Técnico responsable": item.tecnico_nombre || item.tecnico,
    "Analista que reporta": item.analista_nombre || item.analista,
    "Unidad zonal": item.zona || item.unidad_zonal,
    "Fecha Solución": item.fecha_solucion || "",
    "Fecha de ingreso del error": item.fecha_ingreso || item.fecha,
    "Año Sirec-Q error": item.aniosirecq || item.anio_sirecq,
    "Mensaje visualizado del error": item.mensaje_error || "",
    "Descripción del error": item.descripcion || "",
    "Observaciones": item.observaciones || ""
  }));

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ajustar ancho de columnas según campos del formulario
  ws['!cols'] = [
    { wch: 15 }, // N° De Incidencia
    { wch: 20 }, // Tipología de trámite
    { wch: 25 }, // Técnico responsable
    { wch: 25 }, // Analista que reporta
    { wch: 25 }, // Unidad zonal
    { wch: 15 }, // Fecha Solución
    { wch: 15 }, // Fecha de ingreso del error
    { wch: 15 }, // Año Sirec-Q error
    { wch: 40 }, // Mensaje visualizado del error
    { wch: 40 }, // Descripción del error
    { wch: 40 }  // Observaciones
  ];

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, "Incidentes");

  // Generar archivo
  const defaultFilename = `incidentes_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
}

// Exportar CSV
export async function exportIncidentesCsv(arg = {}) {
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

  const items = Array.isArray(arg) ? arg : arg.items;
  const headers = ["numero", "estado", "fecha", "descripcion"];
  const rows = (items || []).map((i) => [
    i.numero || "",
    i.estado || "",
    i.fecha || "",
    i.descripcion || "",
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

// Resolver incidente (cambiar estado a FAVORABLE)
export async function resolveIncidente({ token, no_incidente, payload }) {
  if (!no_incidente) throw new Error("Número de incidente requerido");

  const mappedPayload = {
    fech_solucion: toBackendDate(payload.fecha_solucion),
    obs_incidente: payload.observaciones,
    mensajeerror: payload.mensaje_error,
  };

  if (API) {
    const res = await fetch(
      `${API}/incidentes/estado/${encodeURIComponent(no_incidente)}`,
      {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(mappedPayload),
      }
    );
    if (!res.ok) {
      let msg = await res.text().catch(() => "Error al resolver incidente");
      throw new Error(msg);
    }
    return res.json();
  }

  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.numero === no_incidente);
  if (idx === -1) throw new Error("Incidente no encontrado");

  const updated = {
    ...all[idx],
    ...mappedPayload,
    estado: "FAVORABLE",
  };

  all[idx] = updated;
  writeAll(all);
  return updated;
}

// Eliminar incidente
export async function deleteIncidente({ token, id }) {
  if (!id) throw new Error("Id requerido");

  if (API) {
    const res = await fetch(`${API}/incidentes/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("No se pudo eliminar el incidente");
    return res.json();
  }

  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.numero === id);
  if (idx === -1) throw new Error("Incidente no encontrado");
  all.splice(idx, 1);
  writeAll(all);
  return { success: true };
}
