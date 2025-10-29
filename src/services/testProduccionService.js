

// src/services/testProduccionService.js
// Servicio para TestProduccion — soporta modo API (NestJS) y fallback MOCK

const API = (import.meta.env.VITE_API_URL || "").trim() || null;
const USE_API = true; // true = usa API NestJS si API está configurado

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// 🚨 Mock de datos para pruebas (fallback cuando no hay backend)
let MOCK_TEST_PRODUCCION = [
  {
    id: 1,
    numero: "TP-001",
    estado: "ENVIADO",
    ejecutor: "Ana Torres",
    etapa: "Desarrollo",
    oficioEnvio: "GADDMQ-SHOT-DMC-2025-001-O",
    fechaEnvio: "2025-09-10",
    propuestaOficio: "GADDMQ-SGDTIC-DMSIST-2025-050-O",
    fechaPropuesta: "2025-09-11",
    respuestaTics:
      "Se recibió el requerimiento y se planifica el inicio de desarrollo el 15/09/2025.",
    descripcion: "Prueba inicial del sistema",
  },
  {
    id: 2,
    numero: "TP-002",
    estado: "ATENDIDO",
    ejecutor: "José Campoverde",
    etapa: "Producción",
    oficioEnvio: "GADDMQ-SHOT-DMC-2025-002-O",
    fechaEnvio: "2025-09-12",
    propuestaOficio: "GADDMQ-SGDTIC-DMSIST-2025-051-O",
    fechaPropuesta: "2025-09-13",
    respuestaTics:
      "El desarrollo fue concluido y se implementó en producción el 14/09/2025.",
    descripcion: "Versión propuesta técnica",
  },
  {
    id: 3,
    numero: "TP-003",
    estado: "RECHAZADO",
    ejecutor: "María López",
    etapa: "Planificación",
    oficioEnvio: "GADDMQ-SHOT-DMC-2025-003-O",
    fechaEnvio: "2025-09-14",
    propuestaOficio: "GADDMQ-SGDTIC-DMSIST-2025-052-O",
    fechaPropuesta: "2025-09-15",
    respuestaTics:
      "El requerimiento fue observado por falta de información técnica suficiente.",
    descripcion: "Respuesta observada",
  },
];

// 🔹 Listar requerimientos con paginación y filtros
// 🔹 Listar requerimientos
export async function listRequerimientos({
  page = 1,
  pageSize = 10,
  search = "",
  etapa = "ALL",
  token,
} = {}) {

  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/test-produccion`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const itemsRaw = Array.isArray(json?.data) ? json.data : json || [];

      // ✅ Mapeo corregido
      const mapped = itemsRaw.map((it) => {
        const version = it?.test_versions?.[0]?.versionamiento || {};
        const fechaEnvio = version.fechaenvioreq || null;

        return {
          id_test_produccion: it.id_test_produccion || it.id,
          no_requerimiento: it.no_requerimiento || "—",
          etapa_implementation: it.etapa_implementation || "—",
          fechaenvioreq: fechaEnvio,
          raw: it,
        };
      });

      // ✅ Búsqueda opcional
const s = search.trim().toLowerCase();
let filtered = mapped.filter((x) => {
  const okSearch =
    !s ||
    (x.no_requerimiento || "").toLowerCase().includes(s) ||
    ((x.raw?.descripcion || "") + " " + (x.raw?.respuesta_tics || "")).toLowerCase().includes(s);
  return okSearch;
});

// ✅ Filtro por etapa (solo si no es "ALL")
if (etapa && etapa !== "ALL") {
  filtered = filtered.filter(
    (x) =>
      (x.etapa_implementation || "").toLowerCase() === etapa.toLowerCase()
  );
}




      // ✅ Paginación
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return { items, page, total, totalPages };
    } catch (err) {
      console.warn("[testProduccionService] listRequerimientos API error:", err?.message);
    }
  }
  return { items: [], page, total: 0, totalPages: 1 };
}

// 🔹 Obtener detalle
export async function getRequerimientoById(id, token) {
  if (API && USE_API) {
    try {
      const res = await fetch(`${API}/test-produccion/${encodeURIComponent(id)}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const it = json?.data || json;
      if (!it) return null;

      return {
        id: it.id_test_produccion,
        numero: it.no_requerimiento || "",
        ejecutor: `${it.rolUsuario?.usuario?.nombre_usuario || ""} ${it.rolUsuario?.usuario?.apellidos_usuario || ""}`.trim(),
        id_rol_usuario: it.rolUsuario?.id_rol_usuario || null,
        etapa: it.etapa_implementacion || "",
        ofi_env_pt: it.ofi_env_pt || "",
        fech_env_pt: it.fech_env_pt
          ? it.fech_env_pt.split("T")[0] // ✅ garantiza formato "2024-04-27"
          : "",
        oficioEnvio:
          it.test_versions?.map((tv) => ({
            id: tv.id_test_version,
            id_version: tv.versionamiento?.id_version, // ✅ Agregado
            valor: tv.versionamiento?.oficioenviodmi || "",
            version: tv.versionamiento?.num_version,
          })) || [],
        fechaEnvio:
          it.test_versions?.map((tv) => ({
            id: tv.id_test_version,
            id_version: tv.versionamiento?.id_version, // ✅ Agregado
            valor: tv.versionamiento?.fechaenvioreq?.slice(0, 10) || "",
            version: tv.versionamiento?.num_version,
          })) || [],
        propuesta:
          it.test_versions?.map((tv) => ({
            id: tv.id_test_version,
            id_version: tv.versionamiento?.id_version, // ✅ Agregado
            oficio: tv.versionamiento?.ofi_desp_pt || "",
            fecha: tv.versionamiento?.fech_desp_pt?.slice(0, 10) || "",
            observaciones: tv.versionamiento?.obs_version || tv.versionamiento?.observaciones || "",
            version: tv.versionamiento?.num_version,
          })) || [],
        respuestaTics: it.respuesta_tics || "",
        descripcion: it.descripcion || "",
        raw: it,
      };
    } catch (err) {
      console.warn("[testProduccionService] getRequerimientoById error:", err?.message);
    }
  }
  return null;
}

// 🔹 Crear
export async function createRequerimiento(data, token) {
  if (API && USE_API) {
    const res = await fetch(`${API}/test-produccion`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
  return null;
}

// 🔹 Actualizar
export async function updateRequerimiento(id, data, token) {
  if (API && USE_API) {
    const res = await fetch(`${API}/test-produccion/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
  return null;
}

// 🔹 Exportar CSV (con todos los campos principales)
export async function exportRequerimientosCsv(items) {
  const headers = [
    "numero",
    "estado",
    "ejecutor",
    "etapa",
    "oficioEnvio",
    "fechaEnvio",
    "propuestaOficio",
    "fechaPropuesta",
    "respuestaTics",
    "descripcion",
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(",")]
      .concat(
        items.map((row) =>
          headers
            .map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`)
            .join(",")
        )
      )
      .join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "test_produccion.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// 🔹 Exportar a XLSX (solo los campos del formulario)
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export async function exportRequerimientosXlsx(items = []) {
  if (!items || items.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // 🔸 Define las columnas del formulario
  const headers = [
    "N° Requerimiento",
    "Ejecutor",
    "Etapa",
    "Oficio de Envío",
    "Fecha de Envío",
    "Oficio de Recepción",
    "Fecha de Recepción",
    "Observaciones",
    "Respuesta TICS",
    "Descripción",
  ];

  // 🔸 Estructura los datos de salida
  const rows = items.map((it) => {
    const firstVersion = it.raw?.test_versions?.[0]?.versionamiento || {};

    return {
      "N° Requerimiento": it.no_requerimiento || "—",
      "Ejecutor":
        it.raw?.rolUsuario?.usuario
          ? `${it.raw.rolUsuario.usuario.nombre_usuario} ${it.raw.rolUsuario.usuario.apellidos_usuario}`
          : "—",
      "Etapa": it.etapa_implementation || it.raw?.etapa_implementacion || "—",
      "Oficio de Envío": firstVersion.oficioenviodmi || "—",
      "Fecha de Envío": firstVersion.fechaenvioreq
        ? firstVersion.fechaenvioreq.split("T")[0]
        : "—",
      "Oficio de Recepción": firstVersion.ofi_desp_pt || "—",
      "Fecha de Recepción": firstVersion.fech_desp_pt
        ? firstVersion.fech_desp_pt.split("T")[0]
        : "—",
      "Observaciones": firstVersion.obs_version || "—",
      "Respuesta TICS": it.raw?.respuesta_tics || "—",
      "Descripción": it.raw?.descripcion || "—",
    };
  });

  // 🔸 Crea la hoja de Excel
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "TestProduccion");

  // 🔸 Genera archivo y descarga
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "test_produccion.xlsx");
}


// ✅ Eliminar TestProduccion
export async function deleteTestProduccion(id, token) {
  if (API && USE_API) {
    const res = await fetch(`${API}/test-produccion/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }
    const json = await res.json();
    return json;
  }
  const idx = MOCK_TEST_PRODUCCION.findIndex((r) => r.id === Number(id));
  if (idx === -1) throw new Error("No encontrado");
  MOCK_TEST_PRODUCCION.splice(idx, 1);
  return { message: "Eliminado (mock)" };
}

// ✅ Agregar versión a test de producción
export async function addVersionToTest({ idTestProduccion, payload, token }) {
  if (API && USE_API) {
    const res = await fetch(`${API}/test-produccion/versiones/${encodeURIComponent(idTestProduccion)}`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
  throw new Error("Mock no implementado");
}

// ✅ Actualizar TestProduccion completo (incluye versiones nuevas o modificadas)
export async function updateTestCompleto(id, data, token) {
  if (API && USE_API) {
    const res = await fetch(`${API}/test-produccion/test-version/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }
    return await res.json();
  }
  throw new Error("Mock no implementado para updateTestCompleto");
}

export async function getEjecutores(token) {
  const res = await fetch(`${API}/test-produccion/ejecutor`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Error al obtener ejecutores");
  return await res.json();
}
