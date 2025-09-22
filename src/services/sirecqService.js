const API = import.meta.env.VITE_API_URL; // para conectar después al backend
const LS_KEY = "sirecq@seed";

const ESTADOS = ["ENVIADO", "PENDIENTE", "EN PROCESO"];

/* =====================
 * Utilidades compartidas
 * ===================== */
const sleep = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const load = () => {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : [];
};

const save = (data) => {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};

/* =====================
 * Métodos principales
 * ===================== */
export const getSirecq = async () => {
  await sleep();
  return load();
};

export const getSirecqById = async (id) => {
  await sleep();
  return load().find((item) => item.id === id);
};

export const createSirecq = async (data) => {
  await sleep();
  const items = load();
  const newItem = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  items.push(newItem);
  save(items);
  return newItem;
};

export const updateSirecq = async (id, data) => {
  await sleep();
  let items = load();
  items = items.map((item) => (item.id === id ? { ...item, ...data } : item));
  save(items);
  return data;
};

export const deleteSirecq = async (id) => {
  await sleep();
  let items = load();
  items = items.filter((item) => item.id !== id);
  save(items);
  return true;
};

export { ESTADOS };
