// src/services/testProduccionService.js

// 🚨 Mock de datos para pruebas
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
export async function listRequerimientos({ page, pageSize, search, status }) {
  let filtered = MOCK_TEST_PRODUCCION;

  if (status && status !== "ALL") {
    filtered = filtered.filter((r) => r.estado === status);
  }

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.numero.toLowerCase().includes(search.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  return {
    items,
    page,
    total,
    totalPages,
  };
}

// 🔹 Obtener detalle
export async function getRequerimientoById(id) {
  return MOCK_TEST_PRODUCCION.find((r) => r.id === Number(id)) || null;
}

// 🔹 Crear
export async function createRequerimiento(data) {
  const newItem = {
    ...data,
    id: Date.now(),
  };
  MOCK_TEST_PRODUCCION.push(newItem);
  return newItem;
}

// 🔹 Actualizar
export async function updateRequerimiento(id, data) {
  const index = MOCK_TEST_PRODUCCION.findIndex((r) => r.id === Number(id));
  if (index !== -1) {
    MOCK_TEST_PRODUCCION[index] = {
      ...MOCK_TEST_PRODUCCION[index],
      ...data,
    };
    return MOCK_TEST_PRODUCCION[index];
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
