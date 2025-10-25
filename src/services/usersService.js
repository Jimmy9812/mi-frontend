const API = (import.meta.env.VITE_API_URL || "").trim() || null;

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function createUserWithRoles({ token, payload } = {}) {
  if (!payload || !payload.contrasenia_usuario) {
    throw new Error("Payload inválido: se requiere contrasenia_usuario");
  }

  const body = {
    cedula_usuario: payload.cedula_usuario || null,
    apellidos_usuario: payload.apellidos_usuario || null,
    nombre_usuario: payload.nombre_usuario || null,
    correo_usuario: payload.correo_usuario || null,
    contrasenia_usuario: payload.contrasenia_usuario,
    roles_ids: Array.isArray(payload.roles_ids) ? payload.roles_ids : [],
  };

  if (!API) {
    // fake
    const fake = {
      id_usuario: Math.floor(Math.random() * 1000000),
      ...body,
      roles_usuario: (body.roles_ids || []).map((id_rol, i) => ({
        id_rol_usuario: i + 1,
        rol: { id_rol, nombre_rol: `ROL_${id_rol}` }
      }))
    };
    const rolesTexto = (fake.roles_usuario || []).map(r => r?.rol?.nombre_rol || "");
    return {
      id: fake.id_usuario,
      cedula_usuario: fake.cedula_usuario ?? "",
      nombre_usuario: fake.nombre_usuario ?? "",
      apellidos_usuario: fake.apellidos_usuario ?? "",
      correo_usuario: fake.correo_usuario ?? "",
      roles: rolesTexto,
      raw: fake,
    };
  }

  const res = await fetch(`${API}/users-rol/create`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const json = await res.json();

  // 👇 tu backend responde directo con el usuario (sin contenedor)
  const data = json.usuario ?? json; // por si algún día lo envías envuelto

  const rolesTexto = (data.roles_usuario || data.roles || [])
    .map(r => r?.rol?.nombre_rol || r?.nombre_rol || "");

  // Devolvemos un objeto LISTO para pintar en la tabla
  return {
    id: data.id_usuario ?? data.id,
    cedula_usuario: data.cedula_usuario ?? "",
    nombre_usuario: data.nombre_usuario ?? "",
    apellidos_usuario: data.apellidos_usuario ?? "",
    correo_usuario: data.correo_usuario ?? "",
    roles: rolesTexto,
    raw: data,
  };
}


export async function getAllUsuarios({ token } = {}) {
  if (!API) {
    // Modo fake: retornar lista de ejemplo
    const fake = [
      {
        id_usuario: 1,
        cedula_usuario: "0102030405",
        nombre_usuario: "Juan",
        apellidos_usuario: "Pérez",
        correo_usuario: "juan.perez@example.com",
        roles_usuario: [{ id_rol_usuario: 1, rol: { id_rol: 1, nombre_rol: "Administrador" } }],
      },
      {
        id_usuario: 2,
        cedula_usuario: "0102030406",
        nombre_usuario: "Ana",
        apellidos_usuario: "Gómez",
        correo_usuario: "ana.gomez@example.com",
        roles_usuario: [{ id_rol_usuario: 20, rol: { id_rol: 3, nombre_rol: "Técnico" } }],
      },
    ];

    // Normalizar formato
    return fake.map((u) => ({
      id: u.id_usuario ?? u.id,
      cedula_usuario: u.cedula_usuario,
      nombre_usuario: u.nombre_usuario,
      apellidos_usuario: u.apellidos_usuario,
      correo_usuario: u.correo_usuario,
      roles: (u.roles_usuario || []).map((r) => r?.rol?.nombre_rol || r?.rol?.nombre || r?.nombre_rol),
      raw: u,
    }));
  }

  const res = await fetch(`${API}/usuario`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const data = await res.json();
  // Esperamos un array de usuarios con la estructura que compartiste.
  if (!Array.isArray(data)) return [];

  return data.map((u) => ({
    id: u.id_usuario ?? u.id ?? u.id_user,
    cedula_usuario: u.cedula_usuario ?? null,
    nombre_usuario: u.nombre_usuario ?? "",
    apellidos_usuario: u.apellidos_usuario ?? "",
    correo_usuario: u.correo_usuario ?? null,
    roles: (u.roles_usuario || []).map((r) => r?.rol?.nombre_rol || r?.rol?.nombre || r?.nombre_rol || ""),
    raw: u,
  }));
}

export async function getUsuarioById({ token, id } = {}) {
  if (!API) {
    // Buscar en fake list
    const list = await getAllUsuarios({ token });
    return list.find((u) => Number(u.id) === Number(id)) || null;
  }

  const res = await fetch(`${API}/usuario/id/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  const u = await res.json();
  return {
    id: u.id_usuario ?? u.id,
    cedula_usuario: u.cedula_usuario ?? null,
    nombre_usuario: u.nombre_usuario ?? "",
    apellidos_usuario: u.apellidos_usuario ?? "",
    correo_usuario: u.correo_usuario ?? null,
    roles: (u.roles_usuario || []).map((r) => r?.rol?.nombre_rol || r?.rol?.nombre || r?.nombre_rol || ""),
    roles_raw: u.roles_usuario || [],
    raw: u,
  };
}

export async function updateUsuarioConRoles({ token, id, payload } = {}) {
  if (!API) {
    // Modo fake: devolver payload combinado
    return { id, ...payload };
  }

  const res = await fetch(`${API}/users-rol/update/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  return res.json();
}

export async function deleteUsuarioConRoles({ token, id_usuario, roles_ids } = {}) {
  if (!API) {
    console.warn("⚠️ Modo fake: simulando eliminación de usuario", id_usuario);
    return { success: true, id_usuario, roles_ids };
  }

  if (!id_usuario || !Array.isArray(roles_ids)) {
    throw new Error("Debe enviar un id_usuario y un arreglo roles_ids válidos");
  }

  const res = await fetch(`${API}/users-rol/remover-roles/${encodeURIComponent(id_usuario)}`, {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify({ roles: roles_ids }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  return res.json();
}


export async function getAllRoles({ token } = {}) {
  // Intentar endpoints comunes y si no existe, devolver lista fake
  if (!API) {
    return [
      { id_rol: 1, nombre_rol: "Administrador" },
      { id_rol: 2, nombre_rol: "Analista" },
      { id_rol: 3, nombre_rol: "Técnico" },
    ];
  }

  // probar /roles
  const tryEndpoints = [ "rol", "roles/list", "roles",];
  for (const ep of tryEndpoints) {
    try {
      const res = await fetch(`${API}/${ep}`, { headers: authHeaders(token) });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) return data.map((r) => {
        const idVal = r.id_rol ?? r.id ?? r.idRole;
        const nameVal = r.nombre_rol ?? r.nombre ?? r.name;
        return { id_rol: idVal, nombre_rol: nameVal };
      });
    } catch (e) {
      // ignore and try next
    }
  }

  return [
    { id_rol: 1, nombre_rol: "Administrador" },
    { id_rol: 2, nombre_rol: "Analista" },
    { id_rol: 3, nombre_rol: "Técnico" },
  ];
}

export default {
  createUserWithRoles,
  getAllUsuarios,
  getUsuarioById,
  updateUsuarioConRoles,
  getAllRoles,
};
