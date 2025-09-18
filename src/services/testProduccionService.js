// src/services/testProduccionService.js

// 🔹 Mock temporal con un requerimiento inicial
let mockRequerimientos = [
  {
    id: 1,
    numero: "RSW_SIREC_Q_2024_011",
    estado: "ENVIADO",
    fecha: "2025-01-07",
    ejecutor: "José Campoverde",
    etapa: "Producción",
    oficios: [
      { version: 1, oficio: "GADDMQ-SHOT-DMC-2024-0711-O", fecha: "2025-01-10" },
    ],
    propuestas: [
      { version: 1, oficio: "GADDMQ-SGDTIC-DMSIST-2024-00312-O", fecha: "2025-01-10" },
    ],
    respuestas: [
      { version: 1, texto: "Desarrollo inicia 14 de mayo y termina 30 de mayo 2025" },
    ],
    descripcion: "CREACIÓN DE SERVICIO WEB REST DE CONSULTA DE INFORMACIÓN CATASTRAL",
    observaciones: "Pendiente de validación final",
  },
];

// 🔹 Simula una llamada async con retraso
function delay(ms = 300) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================== CRUD ==================

export async function listRequerimientos({ page = 1, pageSize = 5, search = "", status = "ALL" }) {
  await delay();

  let items = [...mockRequerimientos];

  if (search) {
    items = items.filter((i) =>
      i.numero.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status && status !== "ALL") {
    items = items.filter((i) => i.estado === status);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  return {
    items: paginated,
    page,
    total,
    totalPages,
  };
}

export async function getRequerimientoById(id) {
  await delay();
  return mockRequerimientos.find((i) => i.id === Number(id));
}

export async function createRequerimiento(data) {
  await delay();
  const newReq = {
    id: Date.now(),
    estado: "ENVIADO", // 🔹 por defecto
    fecha: new Date().toISOString().slice(0, 10),
    ...data,
    oficios: data.oficios || [],
    propuestas: data.propuestas || [],
    respuestas: data.respuestas || [],
  };
  mockRequerimientos.push(newReq);
  return newReq;
}

export async function updateRequerimiento(id, data) {
  await delay();
  const idx = mockRequerimientos.findIndex((i) => i.id === Number(id));
  if (idx !== -1) {
    mockRequerimientos[idx] = { ...mockRequerimientos[idx], ...data };
    return mockRequerimientos[idx];
  }
  return null;
}

export async function exportRequerimientosCsv(items) {
  const header = ["N° Requerimiento", "Estado", "Fecha", "Ejecutor", "Etapa"];
  const rows = items.map((i) => [
    i.numero,
    i.estado,
    i.fecha,
    i.ejecutor,
    i.etapa,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `test_produccion_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
