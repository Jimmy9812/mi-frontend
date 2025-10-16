// src/services/sirecqService.js
const LS_KEY = "sirecq-interno@seed";
const API = (import.meta.env.VITE_API_URL || "").trim() || null;

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Utilidades
const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// 🔹 Normalizar fecha al formato YYYY-MM-DD (sin zona horaria)
function toBackendDate(dateString) {
  if (!dateString) return null;
  // Si ya es YYYY-MM-DD, devolver tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const d = new Date(dateString + "T12:00:00");
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomDate() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 9, 1).getTime();
  return new Date(start + Math.random() * (end - start));
}

// 🆕 Función para calcular estado derivado
function calcularEstado(item) {
  if (!item) return 'PENDIENTE';
  if (!item.fecha_env_dmc) return 'PENDIENTE';
  if (item.sirecqExterno || item.id_sirecq_externo) return 'FAVORABLE';
  return 'ENVIADO';
}

// 🆕 Función para normalizar item del backend
function normalizarItem(item) {
  if (!item) return null;
  
  return {
    ...item,
    estado: item.estado || calcularEstado(item),
    usuariosSirecq: Array.isArray(item.usuariosSirecq) ? item.usuariosSirecq : [],
    clasifCatastral: item.clasifCatastral || null,
    sirecqExterno: item.sirecqExterno || null
  };
}

// 🔹 Forzar datos de prueba detallados
function seed(force = false) {
  if (!force && localStorage.getItem(LS_KEY)) return;

  const estadosMock = ["ENVIADO", "PENDIENTE", "FAVORABLE"];

  const mockData = Array.from({ length: 15 }).map((_, i) => ({
    id_sirecq_interno: i + 1,
    fecha_env_dmc: randomDate().toISOString().split('T')[0],
    obsv_tecnica: `Observaciones técnicas para Sirecq Interno ${i + 1}. Detalles del análisis realizado.`,
    estado: estadosMock[i % estadosMock.length],
    id_sirecq_externo: i % 2 === 0 ? i + 1 : null,
    createdAt: randomDate().toISOString(),
    updatedAt: randomDate().toISOString(),
    clasifCatastral: { id_clasif_catastral: 1, nombre: "Clasificación A" },
    usuariosSirecq: [
      { id_usuario_sirecq: 1, rol: "Analista", usuario: { nombre_usuario: "Juan", apellidos_usuario: "Pérez" } },
      { id_usuario_sirecq: 2, rol: "Técnico", usuario: { nombre_usuario: "Ana", apellidos_usuario: "López" } }
    ],
    sirecqExterno: i % 2 === 0 ? { id_sirecq_externo: i + 1, descripcion: "Externo relacionado" } : null
  }));

  localStorage.setItem(LS_KEY, JSON.stringify(mockData));
}

// 🆕 LISTADO CON PAGINACIÓN + FILTROS DESDE BACKEND
export async function listSirecq({
  token,
  page = 1,
  pageSize = 10,
  search = "",
  status = "Todos",
} = {}) {
  if (API) {
    try {
      // Construcción de parámetros dinámicos
      const params = new URLSearchParams({
        page,
        pageSize,
        search: search.trim(),
        status,
      }).toString();

      const res = await fetch(`${API}/sirecq-interno?${params}`, {
        headers: authHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener Sirecq Internos`);
      }

      const data = await res.json();

      // 🔹 Backend ya devuelve { data: { items, total, totalPages } }
      const payload = data.data || {};

      return {
        items: (payload.items || []).map(normalizarItem),
        page: payload.page || page,
        total: payload.total || 0,
        totalPages: payload.totalPages || 1,
      };
    } catch (error) {
      console.error("Error en listSirecq:", error);
      throw error;
    }
  }

  // 🔹 Fallback local (sin backend)
  seed();
  await sleep(300);
  const allData = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  let transformedItems = allData.map((item) => normalizarItem(item));

  // Búsqueda local
  if (search && search.trim()) {
    const normalize = (str) =>
      (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const searchNorm = normalize(search);
    transformedItems = transformedItems.filter(
      (item) =>
        normalize(String(item.id_sirecq_interno)).includes(searchNorm) ||
        normalize(item.obsv_tecnica || "").includes(searchNorm)
    );
  }

  // Filtro local por estado
  const normalize = (str) =>
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const filteredItems =
    status === "Todos"
      ? transformedItems
      : transformedItems.filter((item) => normalize(item.estado) === normalize(status));

  // Paginación local
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedItems = filteredItems.slice(start, end);

  return {
    items: pagedItems,
    page,
    total,
    totalPages,
  };
}


export async function getSirecq(id, { token } = {}) {
  if (API) {
    try {
      const res = await fetch(`${API}/sirecq-interno/${id}`, {
        headers: authHeaders(token),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener el Sirecq Interno`);
      }
      
      const data = await res.json();
      return normalizarItem(data.data);
      
    } catch (error) {
      console.error("Error en getSirecq:", error);
      throw error;
    }
  }

  seed();
  await sleep(300);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const item = data.find((d) => d.id_sirecq_interno === Number(id));
  if (!item) throw new Error("No encontrado");
  return normalizarItem(item);
}

export async function createSirecq({ token, payload }) {
  const mappedPayload = {
    ...payload,
    fecha_env_dmc: toBackendDate(payload.fecha_env_dmc),
  };

  // 🔹 Normalizar fechas de versiones (para el backend)
if (mappedPayload.requerimiento?.requerimientoVersiones) {
  mappedPayload.requerimiento.requerimientoVersiones =
    mappedPayload.requerimiento.requerimientoVersiones.map((v) => ({
      versionamiento: {
        ...v.versionamiento,
        fech_desp_pt: toBackendDate(v.versionamiento.fech_desp_pt),
        fechaenvioreq: toBackendDate(v.versionamiento.fechaenvioreq),
      },
    }));
}


  if (API) {
    try {
      const res = await fetch(`${API}/sirecq-interno`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(mappedPayload),
      });
      
      if (!res.ok) {
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error("No se pudo leer la respuesta de error:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      return { success: true, data: normalizarItem(data.data) };
      
    } catch (error) {
      console.error("Error en createSirecq:", error);
      throw error;
    }
  }

  seed(true);
  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const id = data.length ? Math.max(...data.map(d => d.id_sirecq_interno)) + 1 : 1;
  
  const newItem = {
    id_sirecq_interno: id,
    fecha_env_dmc: payload.fecha_env_dmc,
    obsv_tecnica: payload.obsv_tecnica,
    id_sirecq_externo: payload.id_sirecq_externo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clasifCatastral: payload.clasifCatastral || null,
    usuariosSirecq: payload.usuariosSirecq || [],
    sirecqExterno: payload.sirecqExterno || null
  };
  
  const normalizedItem = normalizarItem(newItem);
  data.push(normalizedItem);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return normalizedItem;
}

export async function updateSirecq({ token, id, payload }) {
  const mappedPayload = {
    ...payload,
    fecha_env_dmc: toBackendDate(payload.fecha_env_dmc),
  };

  if (API) {
    try {
      const res = await fetch(`${API}/sirecq-interno/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(mappedPayload),
      });
      
      if (!res.ok) {
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error("No se pudo leer la respuesta de error:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      return normalizarItem(data.data);
      
    } catch (error) {
      console.error("Error en updateSirecq:", error);
      throw error;
    }
  }

  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const index = data.findIndex((d) => d.id_sirecq_interno === Number(id));
  if (index === -1) throw new Error("No encontrado");
  
  data[index] = {
    ...data[index],
    fecha_env_dmc: payload.fecha_env_dmc,
    obsv_tecnica: payload.obsv_tecnica,
    id_sirecq_externo: payload.id_sirecq_externo,
    updatedAt: new Date().toISOString()
  };
  
  const normalizedItem = normalizarItem(data[index]);
  data[index] = normalizedItem;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return normalizedItem;
}

export async function deleteSirecq({ token, id }) {
  if (API) {
    try {
      const res = await fetch(`${API}/sirecq-interno/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      
      if (!res.ok) {
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error("No se pudo leer la respuesta de error:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      return data.data;
      
    } catch (error) {
      console.error("Error en deleteSirecq:", error);
      throw error;
    }
  }

  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const index = data.findIndex((d) => d.id_sirecq_interno === Number(id));
  if (index === -1) throw new Error("No encontrado");
  data.splice(index, 1);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return { success: true };
}

// 🆕 Exportar CSV
export async function exportSirecqCsv(arg = {}) {
  const { token, search = "", status = "ALL" } = arg;

  try {
    // Intentar exportar desde el backend primero
    if (API) {
      const params = new URLSearchParams({ search, status });

      const res = await fetch(`${API}/sirecq-interno/export?${params.toString()}`, {
        headers: authHeaders(token),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sirecq_internos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    }

    // Si el backend no tiene el endpoint o falla, generar CSV en el frontend
    console.log("Generando CSV en el frontend...");
    const allData = await listSirecq({
      token,
      page: 1,
      pageSize: 10000,
      search,
      status,
    });

    const items = allData.items;

    // Definir headers del CSV
    const headers = [
      "ID",
      "Código",
      "Fecha Envío DMC",
      "Observaciones Técnicas",
      "Estado",
      "ID Sirecq Externo",
      "Clasificación Catastral",
      "Fecha Creación",
      "Fecha Actualización"
    ];

    // Generar filas del CSV
    const rows = items.map(item => [
      item.id_sirecq_interno || "",
      `SIRECQ-IN-${String(item.id_sirecq_interno).padStart(3, '0')}`,
      item.fecha_env_dmc || "",
      (item.obsv_tecnica || "").replace(/,/g, ";"),
      item.estado || "",
      item.id_sirecq_externo || "",
      item.clasifCatastral?.nombre || "",
      item.createdAt || "",
      item.updatedAt || ""
    ]);

    // Crear contenido CSV
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sirecq_internos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al exportar SIRECQ:", error);
    throw new Error(`No se pudo exportar: ${error.message}`);
  }
}

export async function addVersionToSirecq({ token, id_requerimiento, payload }) {
  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const item = data.find(d => d.requerimiento?.id_requerimiento === Number(id_requerimiento));
  if (!item) throw new Error("No encontrado");
  
  const newVersion = {
    versionamiento: payload
  };
  
  if (!item.requerimiento.requerimientoVersiones) {
    item.requerimiento.requerimientoVersiones = [];
  }
  item.requerimiento.requerimientoVersiones.push(newVersion);
  
  const index = data.findIndex(d => d.requerimiento?.id_requerimiento === Number(id_requerimiento));
  data[index] = item;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return newVersion;
}

export async function listDependencias({ token } = {}) {
  if (API) {
    try {
      const res = await fetch(`${API}/dependencia`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener dependencias`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error("Error en listDependencias:", error);
      throw error;
    }
  }
}

// 🆕 Listar clasificaciones catastrales
export async function listClasificaciones({ token } = {}) {
  if (API) {
    try {
      const res = await fetch(`${API}/clasif-catastral`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener clasificaciones catastrales`);
      }

      const data = await res.json();
      // Aseguramos formato homogéneo
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error("Error en listClasificaciones:", error);
      throw error;
    }
  }
}

// 🆕 Listar sistemas
export async function listSistemas({ token } = {}) {
  if (API) {
    try {
      const res = await fetch(`${API}/sistema`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener sistemas`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error("Error en listSistemas:", error);
      throw error;
    }
  }
}

// 🆕 Listar estados de requerimiento
export async function listEstadosRequerimiento({ token } = {}) {
  if (API) {
    try {
      const res = await fetch(`${API}/estado-requerimiento`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Error ${res.status}: ${res.statusText}`, errorText);
        throw new Error(`Error ${res.status}: No se pudo obtener estados de requerimiento`);
      }

      const data = await res.json();
      // Aseguramos formato homogéneo
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error("Error en listEstadosRequerimiento:", error);
      throw error;
    }
  }
}


// 🧹 util para debug manual
export function clearSirecqSeed() {
  localStorage.removeItem(LS_KEY);
}

export { calcularEstado, normalizarItem };