// src/services/externosService.js
// -----------------------------------------------
// Conexión directa a backend NestJS o MOCK local
// -----------------------------------------------

const API = (import.meta.env.VITE_API_URL || "").trim() || null;
const USE_API = true; // true = usa API NestJS; false = mock local

const LS_KEY = "externos@seed";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// --------- MOCK DATA ---------
const ESTADOS = ["ENVIADO", "PENDIENTE", "EN PROCESO"];
const TIPOS = ["RSW", "RST", "RSD"];

function pad(n, len = 3) {
  return n.toString().padStart(len, "0");
}
function toISO(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function randomDate(y = 2025) {
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y, 11, 31).getTime();
  return toISO(new Date(start + Math.random() * (end - start)));
}

function makeItem(i) {
  const tipo = TIPOS[i % TIPOS.length];
  const numero = `${tipo}_SUIM_${2024 + (i % 2)}_${pad(i + 1, 3)}`;
  return {
    id: `EXT${pad(i + 1, 4)}`,
    tipo,
    no_requerimiento: numero,
    estado: ESTADOS[i % ESTADOS.length],
    fecha: randomDate(2025),
    responsable: ["Pedro Zhinín", "Ana Gómez", "Luis Pérez"][i % 3],
    descripcion:
      "Implementación de controles para validación de campos determinados en el informe.",
    prioridad: `${(i % 3) + 1}`,
    clasificacion: ["A", "B", "C"][i % 3],
    dependencia: ["DMSIST", "DMI", "DMC"][i % 3],
    tramite_pri: "ACTUALIZACIÓN DE PREDIOS",
    seguimiento: "Contraloría General del Estado - Cartera Vencida",
    tramite_cat: "CAT-42, CAT-43",
    oficio_despacho: "GADDMQ-SHOT-DMC-2025-0387-M",
    oficio_dmi: "GADDMQ-SHOT-DMC-2024-2114-O",
    fecha_despacho: randomDate(2025),
    fecha_envio_dmc: randomDate(2025),
    fecha_envio_req: randomDate(2024),
    observaciones:
      "Mediante memorando... el desarrollo inicia el 14 de mayo de 2025.",
  };
}

function seed() {
  if (typeof localStorage === "undefined") return [];
  const exists = localStorage.getItem(LS_KEY);
  if (exists) return JSON.parse(exists);

  const list = Array.from({ length: 38 }).map((_, i) => makeItem(i));
  localStorage.setItem(LS_KEY, JSON.stringify(list));
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

// --------- UTILS ---------
function paginate(items, page, pageSize, search, tipo) {
  const s = (search || "").trim().toLowerCase();
  const filtered = items.filter((x) => {
    const okSearch =
      !s ||
      x.no_requerimiento.toLowerCase().includes(s) ||
      x.estado.toLowerCase().includes(s) ||
      x.descripcion.toLowerCase().includes(s);
    const okTipo = tipo === "Todos" || !tipo || x.tipo === tipo;
    return okSearch && okTipo;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return { items: pageItems, page, total, totalPages };
}

// --------- API PÚBLICA ---------

// ✅ Listar externos (mock o backend)
export async function listExternos({
  token,
  page = 1,
  pageSize = 5,
  search = "",
  tipo = "Todos",
} = {}) {
  if (API && USE_API) {
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search,
        tipo,
      });
      const res = await fetch(`${API}/sirecq-externo?${params}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();

      // 🔹 Normalizamos la respuesta para que siempre devuelva el mismo formato
      if (Array.isArray(result)) {
        // Si el backend devuelve un array directo
        return {
          items: result,
          page: 1,
          total: result.length,
          totalPages: 1,
        };
      }

      // Si devuelve objeto tipo { data: [...], total, totalPages, ... }
      if (result?.data && Array.isArray(result.data)) {
        return {
          items: result.data,
          page: result.page || 1,
          total: result.total || result.data.length,
          totalPages: result.totalPages || 1,
        };
      }

      // Si ya está en formato { items: [...], total, totalPages }
      return result;

    } catch (err) {
      console.warn("[externosService] Error listExternos API:", err?.message);
    }
  }

  // 🔹 Modo MOCK (sin backend)
  await sleep();
  const all = readAll();
  return paginate(all, page, pageSize, search, tipo);
}


// ✅ Obtener externo por ID
export async function getExterno(id, token) {
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/sirecq-externo/${encodeURIComponent(id)}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[externosService] Error getExterno API:", err?.message);
      throw err;
    }
  }
  await sleep();
  const all = readAll();
  return all.find((x) => x.id === id || x.no_requerimiento === id) || null;
}

// ✅ Crear externo
export async function createExterno({ token, payload }) {
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/sirecq-externo`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[externosService] Error createExterno API:", err?.message);
      throw err;
    }
  }
  await sleep();
  const all = readAll();
  const nuevo = {
    ...makeItem(all.length),
    ...payload,
    id: `EXT${pad(all.length + 1, 4)}`,
    fecha: payload?.fecha ? toISO(payload.fecha) : toISO(new Date()),
  };
  all.unshift(nuevo);
  writeAll(all);
  return nuevo;
}

// ✅ Actualizar externo
export async function updateExterno({ token, id, payload }) {
  if (!id) throw new Error("id requerido");
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/sirecq-externo/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[externosService] Error updateExterno API:", err?.message);
      throw err;
    }
  }
  await sleep();
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.no_requerimiento === id);
  if (idx === -1) throw new Error("No encontrado");
  const updated = { ...all[idx], ...payload };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export async function exportExternosCsv({
  token,
  search = "",
  tipo = "",
  status = "ALL",
} = {}) {
  try {
    let allExternos = [];

    // 🔹 Si hay backend (NestJS activo)
    if (API && USE_API) {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tipo && tipo !== "Todos") params.set("tipo", tipo);
      if (status && status !== "ALL") params.set("estado", status);
      params.set("page", "1");
      params.set("pageSize", "10000"); // obtener todos los registros

      const res = await fetch(`${API}/sirecq-externo?${params}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      // ✅ Tu backend devuelve data: [ ... ], count: N
      if (Array.isArray(json.data)) {
        allExternos = json.data;
      } else if (Array.isArray(json.items)) {
        allExternos = json.items;
      } else {
        throw new Error("Estructura de datos inesperada en la respuesta del backend");
      }

      console.log(`Exportando ${allExternos.length} externos`);
    } else {
      // 🔹 Modo MOCK local
      const all = readAll();
      allExternos = all.filter((x) => {
        const matchSearch =
          !search ||
          x.no_requerimiento?.toLowerCase().includes(search.toLowerCase()) ||
          x.estado?.toLowerCase().includes(search.toLowerCase()) ||
          x.descripcion?.toLowerCase().includes(search.toLowerCase());
        const matchTipo = !tipo || tipo === "Todos" || x.tipo === tipo;
        const matchEstado = !status || status === "ALL" || x.estado === status;
        return matchSearch && matchTipo && matchEstado;
      });
    }

    // 🔹 Generamos el CSV correctamente
    const headers = [
      "no_requerimiento",
      "estado",
      "fecha",
      "tipo",
      "responsable",
    ];

    const rows = allExternos.map((i) => [
      // no_requerimiento
      i.requerimiento?.no_requerimiento || i.no_requerimiento || i.noRequerimiento || "",
      // estado
      i.requerimiento?.estadoRequerimiento?.nombre_estado_requerimiento ||
      i.requerimiento?.estadoRequerimiento?.nombre_estado ||
      i.estado || i.status || "",
      // fecha
      i.requerimiento?.fecha_registro || i.fecha || i.fecha_requerimiento || "",
      // tipo
      i.categoria?.siglas_categoria || i.tipo || i.tipo_requerimiento || "",
      // responsable
      (i.rolUsuario?.usuario?.nombre_usuario && i.rolUsuario?.usuario?.apellidos_usuario
        ? `${i.rolUsuario.usuario.nombre_usuario} ${i.rolUsuario.usuario.apellidos_usuario}`
        : i.responsable || i.usuario_responsable || "")
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // 🔹 Descarga del archivo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `externos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando externos:", err);
    alert("Error al exportar los datos. Revisa la consola para más detalles.");
  }
}

// ✅ Agregar versión a requerimiento
export async function addVersionToRequerimiento({ token, id_requerimiento, payload }) {
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/requerimiento/${id_requerimiento}/versiones`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[externosService] Error addVersionToRequerimiento API:", err?.message);
      throw err;
    }
  }
  // Mock no implementado
  throw new Error("Mock no implementado para addVersionToRequerimiento");
}

// ✅ Obtener versiones por requerimiento
export async function getVersionesByRequerimiento(id_requerimiento, token) {
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/requerimiento/${id_requerimiento}/versiones`, {
        headers: authHeaders(token)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[externosService] Error getVersionesByRequerimiento API:", err?.message);
      throw err;
    }
  }
  // Mock no implementado
  throw new Error("Mock no implementado para getVersionesByRequerimiento");
}
