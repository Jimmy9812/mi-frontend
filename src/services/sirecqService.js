// src/services/sirecqService.js
const LS_KEY = "sirecq@seed";

// Utilidades
const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function randomDate() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 9, 1).getTime();
  return new Date(start + Math.random() * (end - start));
}

// Mapeos para mocks
const tipos = [
  { id: 1, name: "Con Adjunto" },
  { id: 2, name: "Sin Adjunto" }
];

const clasificaciones = [
  { id: 1, name: "Clasificación A" },
  { id: 2, name: "Clasificación B" },
  { id: 3, name: "Clasificación C" }
];

const sistemas = [
  { id: 1, name: "SIREC-Q" },
  { id: 2, name: "STL" },
  { id: 3, name: "DBB" },
  { id: 4, name: "SUIM" },
  { id: 5, name: "CERTIFICADOS" }
];

const estados = [
  { id: 1, name: "Enviado" },
  { id: 2, name: "Devuelto" },
  { id: 3, name: "Test" },
  { id: 4, name: "Producción" },
  { id: 5, name: "En revisión" },
  { id: 6, name: "Atendido" }
];

const dependencias = [
  { id: 1, name: "DMSIST" },
  { id: 2, name: "DMC" },
  { id: 3, name: "DMF" }
];

// 🔹 Forzar datos de prueba detallados
function seed(force = false) {
  if (!force && localStorage.getItem(LS_KEY)) return;

  const mockData = Array.from({ length: 3 }).map((_, i) => ({
    id_sirecq_interno: i + 1,
    requerimiento: {
      id_requerimiento: i + 1,
      no_requerimiento: `SIRECQ-${2025}-${String(i + 1).padStart(3, '0')}`,
      descripcion: `Descripción detallada para requerimiento SIREC-Q ${i + 1}. Incluye análisis de requisitos y especificaciones técnicas.`,
      categoria: { id_categoria: 1, siglas_categoria: "CAT-01", nom_categoria: "Clasificación A" },
      sistema: { id_sistema: 1, nom_sistema: "SIREC-Q" },
      estadoRequerimiento: { id_estado_requerimiento: 1, nombre_estado_requerimiento: "Enviado" },
      fecha_registro: randomDate(),
      rolUsuario: { usuario: { nombre_usuario: "Juan", apellidos_usuario: "Pérez" } },
      requerimientoVersiones: [
        {
          versionamiento: {
            id_versionamiento: 1,
            num_version: 1,
            ofi_desp_pt: "OFP-001-2025",
            fech_desp_pt: randomDate().toISOString().split('T')[0],
            oficioenviodmi: "OFD-001-2025",
            fechaenvioreq: randomDate().toISOString().split('T')[0],
            obs_version: "Versión inicial aprobada sin observaciones."
          }
        },
        ...(i > 0 ? [{
          versionamiento: {
            id_versionamiento: 2,
            num_version: 2,
            ofi_desp_pt: "OFP-002-2025",
            fech_desp_pt: randomDate().toISOString().split('T')[0],
            oficioenviodmi: "OFD-002-2025",
            fechaenvioreq: randomDate().toISOString().split('T')[0],
            obs_version: "Versión revisada con ajustes menores."
          }
        }] : [])
      ]
    },
    adjunto: `Adjunto_${i + 1}.pdf`,
    tipo: tipos[0].name,
    clasificacion: clasificaciones[0].name,
    seguimiento: `Seguimiento institucional para req ${i + 1}`,
    responsable: "Ana López (Analista)",
    tramite_pr: "TRAM-PR-001",
    tramite_cat: "TRAM-CAT-001",
    dependencia: { id_dependencia: 1, sigla_dependencia: "DMSIST" },
    observacionesgen: `Observaciones generales: Este requerimiento requiere atención prioritaria debido a su impacto en el sistema. Fecha: ${randomDate().toISOString().split('T')[0]}.`
  }));

  localStorage.setItem(LS_KEY, JSON.stringify(mockData));
}

export async function listSirecq({ token } = {}) {
  seed(); // genera si no existe
  await sleep(300);
  return JSON.parse(localStorage.getItem(LS_KEY)) || [];
}

export async function getSirecq(id, { token } = {}) {
  seed();
  await sleep(300);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const item = data.find((d) => d.id_sirecq_interno === Number(id));
  if (!item) throw new Error("No encontrado");
  return item;
}

export async function createSirecq({ token, payload }) {
  seed(true); // force seed for consistency
  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const id = data.length ? Math.max(...data.map(d => d.id_sirecq_interno)) + 1 : 1;
  const newItem = {
    id_sirecq_interno: id,
    ...payload,
    requerimiento: {
      ...payload.requerimiento,
      id_requerimiento: id,
      estadoRequerimiento: { nombre_estado_requerimiento: "Enviado" },
      fecha_registro: new Date(),
      requerimientoVersiones: payload.requerimiento.versiones || []
    }
  };
  data.push(newItem);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return newItem;
}

export async function updateSirecq({ token, id, payload }) {
  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const index = data.findIndex((d) => d.id_sirecq_interno === Number(id));
  if (index === -1) throw new Error("No encontrado");
  data[index] = { ...data[index], ...payload };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data[index];
}

export async function addVersionToSirecq({ token, id_requerimiento, payload }) {
  await sleep(500);
  const data = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  const item = data.find(d => d.requerimiento.id_requerimiento === Number(id_requerimiento));
  if (!item) throw new Error("No encontrado");
  const newVersion = {
    versionamiento: payload
  };
  if (!item.requerimiento.requerimientoVersiones) {
    item.requerimiento.requerimientoVersiones = [];
  }
  item.requerimiento.requerimientoVersiones.push(newVersion);
  const index = data.findIndex(d => d.requerimiento.id_requerimiento === Number(id_requerimiento));
  data[index] = item;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return newVersion;
}

// 🧹 util para debug manual (borrar seed)
export function clearSirecqSeed() {
  localStorage.removeItem(LS_KEY);
}
