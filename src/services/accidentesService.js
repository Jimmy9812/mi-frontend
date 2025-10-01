// Eliminar accidente
export async function deleteAccidente({ token, id }) {
  if (!API) throw new Error("Backend URL no configurada");
  if (!id) throw new Error("ID de accidente requerido");
  try {
    const res = await fetch(`${API}/accidente/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    throw new Error(`No se pudo eliminar el accidente: ${error.message}`);
  }
}
// Aprobar fiscalización (cambiar a favorable o no)
export async function approveFiscalizacion({ token, id, fiscalizacion }) {
  if (!API) throw new Error("Backend URL no configurada");
  if (!id) throw new Error("ID de accidente requerido");
  try {
    const res = await fetch(`${API}/accidente/fiscalizacion/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ fiscalizacion }),
      }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    throw new Error(`No se pudo aprobar la fiscalización: ${error.message}`);
  }
}
// src/services/accidentesService.js
const API = import.meta.env.VITE_API_URL; // Backend URL

/* =====================
 * Utilidades compartidas
 * ===================== */
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/* =====================
 * Transformaciones de datos
 * ===================== */

// Convierte fecha frontend (YYYY-MM-DD) a formato backend
const toBackendDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString();
};

// Transforma datos del backend al frontend
function transformBackendToFrontend(item) {
  if (!item) return null;

  return {
    id: item.id_accidente,
    id_accidente: item.id_accidente,
    tramite: item.tramite_accidente || '',
    oficio: item.oficio_memorando_mail || '',
    fecha_ingreso_tramite: item.fech_ingr_tramite ? new Date(item.fech_ingr_tramite).toISOString().slice(0, 10) : '',
    fecha_asignacion_tramite: item.fecha_asignacion ? new Date(item.fecha_asignacion).toISOString().slice(0, 10) : '',
    tipologia_tramite: item.tipologia?.toString() || '',
    inspeccion: item.inspeccion ? 'SI' : 'NO',
    predio: item.predio || '',
    numero_predio: item.predio || '', // alias
    clave_catastral: item.clave_catastral || '',
    nom_propietario: item.nom_propietario || '',
    propietario: item.nom_propietario || '', // alias
    documento: item.documento || '',
    numero_documento: item.documento || '', // alias
    cod_consulta: item.cod_consulta || '',
    codigo_consulta: item.cod_consulta || '', // alias
    control_calidad: item.control_calidad || '',
    numero_interno: item.numero_interno || '',
    observaciones: item.observaciones || '',
    
    // Estado
    estado: item.estadoAccInc?.nombre_estado_acc_inc || 'SIN ESTADO',
    estado_tramite: item.estadoAccInc?.nombre_estado_acc_inc || 'SIN ESTADO',
    id_estado_acc_inc: item.estadoAccInc?.id_estado_acc_inc || null,
    
    // Zona
    zona: item.zona?.nombre_zona || null,
    parroquia: item.zona?.nombre_zona || '', // si zona es parroquia
    id_zona: item.zona?.id_zona || null,
    
    // Usuario responsable
    tecnico_responsable: item.rolUsuario?.usuario ? 
      `${item.rolUsuario.usuario.nombre_usuario} ${item.rolUsuario.usuario.apellidos_usuario}`.trim() : '',
    id_rol_usuario: item.rolUsuario?.id_rol_usuario || null,
    
    // Fechas adicionales
    fecha: item.fech_ingr_tramite ? new Date(item.fech_ingr_tramite).toISOString().slice(0, 10) : '',
    fecha_estado: item.fecha_estado ? new Date(item.fecha_estado).toISOString().slice(0, 10) : '',
    
    // Campos adicionales para compatibilidad
    lugar: item.zona?.ubi_zona || 'N/A',
    descripcion: item.observaciones || '',
    responsable: item.rolUsuario?.usuario ? 
      `${item.rolUsuario.usuario.nombre_usuario} ${item.rolUsuario.usuario.apellidos_usuario}`.trim() : '',
      
    _raw: item // datos originales del backend
  };
}

// Transforma datos del frontend al backend para crear/actualizar
function transformFrontendToBackend(payload) {
  return {
    tramite_accidente: payload.tramite || undefined,
    oficio_memorando_mail: payload.oficio || undefined,
    fech_ingr_tramite: toBackendDate(payload.fecha_ingreso_tramite),
    fecha_asignacion: toBackendDate(payload.fecha_asignacion_tramite),
    fecha_estado: toBackendDate(payload.fecha_estado),
    tipologia: payload.tipologia_tramite ? parseInt(payload.tipologia_tramite) : undefined,
    inspeccion: payload.inspeccion === 'SI' || payload.inspeccion === true,
    predio: payload.predio || payload.numero_predio || undefined,
    clave_catastral: payload.clave_catastral || undefined,
    nom_propietario: payload.nom_propietario || payload.propietario || undefined,
    documento: payload.documento || payload.numero_documento || undefined,
    cod_consulta: payload.cod_consulta || payload.codigo_consulta || undefined,
    control_calidad: payload.control_calidad || undefined,
    numero_interno: payload.numero_interno || undefined,
    observaciones: payload.observaciones || undefined,
    id_estado_acc_inc: payload.id_estado_acc_inc ? parseInt(payload.id_estado_acc_inc) : undefined,
    id_zona: payload.id_zona ? parseInt(payload.id_zona) : undefined,
    id_rol_usuario: payload.id_rol_usuario ? parseInt(payload.id_rol_usuario) : undefined,
  };
}

/* =====================
 * API Functions
 * ===================== */

export async function listAccidentes({
  token,
  page = 1,
  pageSize = 10,
  search = "",
  status = "ALL",
} = {}) {
  if (!API) {
    throw new Error("Backend URL no configurada");
  }

  try {
    // Traer todos los registros (sin paginación real)
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    // Usar un límite alto para traer todos los registros
    params.append('page', '1');
    params.append('limit', '10000');

    const res = await fetch(`${API}/accidente?${params.toString()}`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    const backendData = await res.json();
    let transformedItems = (backendData.data || []).map(transformBackendToFrontend);

    // Si el backend no filtra correctamente, filtrar en frontend por tramite y oficio
    if (search && search.trim()) {
      const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const searchNorm = normalize(search);
      transformedItems = transformedItems.filter(item =>
        normalize(item.tramite).includes(searchNorm) ||
        normalize(item.oficio).includes(searchNorm)
      );
    }

    // Normaliza cadenas para comparación insensible a mayúsculas/minúsculas y tildes
    const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    // Filtrar por estado en frontend
    const filteredItems = status === "ALL" ? transformedItems :
      transformedItems.filter(item => normalize(item.estado) === normalize(status));

    // Paginar en frontend
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

  } catch (error) {
    console.error("Error al obtener accidentes:", error);
    throw new Error(`No se pudieron cargar los accidentes: ${error.message}`);
  }
}

export async function getAccidente({ token, id }) {
  if (!API) {
    throw new Error("Backend URL no configurada");
  }

  if (!id) {
    throw new Error("ID de accidente requerido");
  }

  try {
    const res = await fetch(`${API}/accidente/id_accidente/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Accidente no encontrado");
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    const backendData = await res.json();
    return transformBackendToFrontend(backendData);

  } catch (error) {
    console.error("Error al obtener accidente:", error);
    throw new Error(`No se pudo cargar el accidente: ${error.message}`);
  }
}

export async function createAccidente(arg) {
  const token = arg?.token;
  const payload = arg?.payload ?? arg;

  if (!API) {
    throw new Error("Backend URL no configurada");
  }

  if (!payload) {
    throw new Error("Datos del accidente requeridos");
  }

  try {
    const backendPayload = transformFrontendToBackend(payload);
    
    console.log("Datos que se envían al backend:", backendPayload);

    const res = await fetch(`${API}/accidente`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    const backendData = await res.json();
    return transformBackendToFrontend(backendData);

  } catch (error) {
    console.error("Error al crear accidente:", error);
    throw new Error(`No se pudo crear el accidente: ${error.message}`);
  }
}

export async function updateAccidente({ token, id, payload }) {
  if (!API) {
    throw new Error("Backend URL no configurada");
  }

  if (!id) {
    throw new Error("ID de accidente requerido");
  }

  if (!payload) {
    throw new Error("Datos del accidente requeridos");
  }

  try {
    const backendPayload = transformFrontendToBackend(payload);
    
    console.log("Datos de actualización que se envían:", backendPayload);

    const res = await fetch(`${API}/accidente/buscar/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    const backendData = await res.json();
    return transformBackendToFrontend(backendData);

  } catch (error) {
    console.error("Error al actualizar accidente:", error);
    throw new Error(`No se pudo actualizar el accidente: ${error.message}`);
  }
}

export async function exportAccidentesCsv(arg = {}) {
  const { token, search = "", status = "ALL" } = arg;

  try {
    // Intentar exportar desde el backend primero
    if (API) {
      const params = new URLSearchParams({ search, status });

      const res = await fetch(`${API}/accidente/export?${params.toString()}`, {
        headers: authHeaders(token),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    }

    // Si el backend no tiene el endpoint o falla, generar CSV en el frontend
    console.log("Generando CSV en el frontend...");
    const allData = await listAccidentes({
      token,
      page: 1,
      pageSize: 10000, // Traer todos los registros
      search,
      status,
    });

    const items = allData.items;

    // Definir headers del CSV
    const headers = [
      "ID",
      "Trámite",
      "Oficio",
      "Fecha Ingreso",
      "Fecha Asignación",
      "Tipología",
      "Inspección",
      "Número Predio",
      "Clave Catastral",
      "Propietario",
      "Número Documento",
      "Estado",
      "Zona",
      "Técnico Responsable",
      "Fecha Estado",
      "Control Calidad",
      "Código Consulta",
      "Observaciones"
    ];

    // Generar filas del CSV
    const rows = items.map(item => [
      item.id || "",
      item.tramite || "",
      item.oficio || "",
      item.fecha_ingreso_tramite || "",
      item.fecha_asignacion_tramite || "",
      item.tipologia_tramite || "",
      item.inspeccion ? "SI" : "NO",
      item.numero_predio || "",
      item.clave_catastral || "",
      item.propietario || "",
      item.numero_documento || "",
      item.estado || "",
      item.zona || "",
      item.tecnico_responsable || "",
      item.fecha_estado || "",
      item.control_calidad || "",
      item.codigo_consulta || "",
      item.observaciones || ""
    ]);

    // Crear contenido CSV
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accidentes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al exportar accidentes:", error);
    throw new Error(`No se pudo exportar: ${error.message}`);
  }
}

/* =====================
 * Catálogos para Accidentes
 * ===================== */

  export async function getEstadosNoFavorable({ token } = {}) {
    if (!API) {
      throw new Error("Backend URL no configurada");
    }

    try {
      const res = await fetch(`${API}/accidente/estados-no-favorable`, {
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("📊 Estados no favorables cargados:", data);
      
      return data;

    } catch (error) {
      console.error("Error al obtener estados no favorables:", error);
      throw new Error(`No se pudieron cargar los estados: ${error.message}`);
    }
  }

  export async function getAnalistasAccidentes({ token } = {}) {
    if (!API) {
      throw new Error("Backend URL no configurada");
    }

    try {
      const res = await fetch(`${API}/accidente/analistas-accidentes`, {
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("👥 Analistas de accidentes cargados:", data);
      
      return data;

    } catch (error) {
      console.error("Error al obtener analistas de accidentes:", error);
      throw new Error(`No se pudieron cargar los analistas: ${error.message}`);
    }

}