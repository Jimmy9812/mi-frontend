import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, Eye, Plus, Download, Users, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createUserWithRoles, getAllUsuarios, getAllRoles, getUsuarioById, updateUsuarioConRoles } from "../services/usersService";

export default function GestionUsuarios() {
  const { token, user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ cedula_usuario: "", apellidos_usuario: "", nombre_usuario: "", correo_usuario: "", contrasenia_usuario: "", roles_ids: [] });
  const [rolesList, setRolesList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getAllUsuarios({ token });
        setItems(Array.isArray(res) ? res : []);
        const roles = await getAllRoles({ token });
        setRolesList(Array.isArray(roles) ? roles : []);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleRolesChange = (e) => {
    const options = Array.from(e.target.selectedOptions || []);
    const values = options.map((o) => Number(o.value));
    setForm((f) => ({ ...f, roles_ids: values }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload = { ...form, roles_ids: form.roles_ids || [] };
      const res = await createUserWithRoles({ token, payload });
      setItems((prev) => [res, ...prev]);
      setOpenForm(false);
      setForm({ cedula_usuario: "", apellidos_usuario: "", nombre_usuario: "", correo_usuario: "", contrasenia_usuario: "", roles_ids: [] });
      alert("Usuario creado");
    } catch (err) {
      console.error(err);
      alert("Error creando usuario: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (id) => {
    try {
      setLoading(true);
      const user = await getUsuarioById({ token, id });
      if (!user) return alert('Usuario no encontrado');
      // Mapear roles_raw a ids
      const roleIds = (user.roles_raw || []).map(r => (r?.rol?.id_rol ?? r?.id_rol ?? null)).filter(Boolean);
      setForm({ cedula_usuario: user.cedula_usuario || '', apellidos_usuario: user.apellidos_usuario || '', nombre_usuario: user.nombre_usuario || '', correo_usuario: user.correo_usuario || '', contrasenia_usuario: '', roles_ids: roleIds });
      setEditUserId(id);
      setIsEditing(true);
      setOpenForm(true);
    } catch (err) {
      console.error('Error cargando usuario:', err);
      alert('Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = {
        cedula_usuario: form.cedula_usuario || undefined,
        apellidos_usuario: form.apellidos_usuario || undefined,
        nombre_usuario: form.nombre_usuario || undefined,
        correo_usuario: form.correo_usuario || undefined,
        // enviar contrasenia solo si se indicó
        ...(form.contrasenia_usuario ? { contrasenia_usuario: form.contrasenia_usuario } : {}),
        roles_ids: Array.isArray(form.roles_ids) ? form.roles_ids : [],
      };
      const res = await updateUsuarioConRoles({ token, id: editUserId, payload });
      // refrescar lista
      const refreshed = await getAllUsuarios({ token });
      setItems(Array.isArray(refreshed) ? refreshed : []);
      setOpenForm(false);
      setIsEditing(false);
      setEditUserId(null);
      setForm({ cedula_usuario: "", apellidos_usuario: "", nombre_usuario: "", correo_usuario: "", contrasenia_usuario: "", roles_ids: [] });
      alert('Usuario actualizado');
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      alert('Error actualizando usuario');
    } finally {
      setLoading(false);
    }
  };

  if (activeRole !== "Administrador") {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-600 font-semibold">Acceso no autorizado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-[380px_1fr]">
      {/* Imagen lateral */}
      <div className="h-screen">
        <img src="/INM.jpg" alt="Quito" className="w-full h-full object-cover" />
      </div>

      {/* Contenido derecho */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="w-5 h-5" />
            <Link to="/dashboard" className="hover:underline">Home</Link>
            <span className="text-slate-400">/</span>
            <span className="font-semibold">Gestión Usuarios</span>
          </div>
          <div className="text-sm text-slate-600">{user?.nombre_usuario} {user?.apellidos_usuario}</div>
        </div>

        {/* Título */}
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-[#3F6592] text-white px-5 py-3 font-bold tracking-wide shadow">GESTIÓN DE USUARIOS</div>
        </div>

        {/* Barra de acciones */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <button onClick={() => alert('Exportar CSV placeholder')} className="flex items-center gap-2 px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50">
              <Download className="w-4 h-4" /> EXPORTAR
            </button>

            <div className="relative">
              <input type="text" placeholder="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-3 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => setPage(1)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100"><Search className="w-4 h-4 text-slate-600" /></button>
            </div>
          </div>

          <div className="flex gap-2">

          </div>
        </div>

        {/* Tabla */}
        <div className="mx-6 my-4 rounded-xl border overflow-hidden bg-white">
          <div className="grid grid-cols-[0.6fr_1fr_2fr_2fr_2fr_120px] bg-[#3F6592] text-white font-semibold text-sm">
            <div className="px-4 py-3">#</div>
            <div className="px-4 py-3">Cédula</div>
            <div className="px-4 py-3">Nombre completo</div>
            <div className="px-4 py-3">Correo</div>
            <div className="px-4 py-3">Roles</div>
            <div className="px-4 py-3 text-center">Acción</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Cargando…</div>
          ) : items.filter(u => {
              if (!search) return true;
              const s = search.toLowerCase();
              return (
                String(u.cedula_usuario || "").toLowerCase().includes(s) ||
                (u.nombre_usuario || "").toLowerCase().includes(s) ||
                (u.apellidos_usuario || "").toLowerCase().includes(s) ||
                (u.correo_usuario || "").toLowerCase().includes(s)
              );
            }).slice((page - 1) * pageSize, page * pageSize).length === 0 ? (
            <div className="p-6 text-center text-slate-500">No hay resultados</div>
          ) : (
            items
              .filter(u => {
                if (!search) return true;
                const s = search.toLowerCase();
                return (
                  String(u.cedula_usuario || "").toLowerCase().includes(s) ||
                  (u.nombre_usuario || "").toLowerCase().includes(s) ||
                  (u.apellidos_usuario || "").toLowerCase().includes(s) ||
                  (u.correo_usuario || "").toLowerCase().includes(s)
                );
              })
              .slice((page - 1) * pageSize, page * pageSize)
              .map((u, idx) => (
                <div key={u.id} className="grid grid-cols-[0.6fr_1fr_2fr_2fr_2fr_120px] border-t items-center text-sm hover:bg-gray-50">
                  <div className="px-4 py-3">{(page - 1) * pageSize + idx + 1}</div>
                  <div className="px-4 py-3">{u.cedula_usuario || '—'}</div>
                  <div className="px-4 py-3">{u.nombre_usuario} {u.apellidos_usuario}</div>
                  <div className="px-4 py-3">{u.correo_usuario || '—'}</div>
                  <div className="px-4 py-3">{(u.roles || []).map((r,i) => <span key={i} className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-2 text-xs">{r}</span>)}</div>
                  <div className="px-4 py-3 flex items-center justify-center">
                    <button onClick={() => startEdit(u.id)} className="px-3 py-1 bg-[#3F6592] text-white rounded-md mr-2" title="Ver/Editar"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('¿Eliminar usuario #' + u.id + '? Esta acción no se puede deshacer.')) { alert('Eliminar usuario ' + u.id + ' (pendiente de implementación)'); } }} className="px-3 py-1 bg-red-500 text-white rounded-md" title="Eliminar">Eliminar</button>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer inferior */}
        <div className="mx-6 mt-0 mb-8 flex items-center justify-between">
          {/* Page size */}
          <div className="flex items-center gap-2 text-sm">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded">
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-slate-500">{items.length === 0 ? '0-0 de 0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, items.length)} de ${items.length}`}</span>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center gap-1">
            <p className="uppercase text-sm text-gray-600">Página</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
              {Array.from({ length: Math.min(items.length ? Math.ceil(items.length / pageSize) : 1, 8) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded ${pageNum === page ? 'bg-[#3F6592] text-white' : 'hover:bg-slate-100'}`}>{pageNum}</button>
                );
              })}
              <button disabled={page >= Math.ceil(items.length / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil(items.length / pageSize) || 1, p + 1))} className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
            </div>
          </div>

          {/* Botón agregar */}
          <button onClick={() => setOpenForm(true)} className="flex items-center gap-2 bg-[#3F6592] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> ADD NUEVO USUARIO
          </button>
        </div>

      </div>

      {/* Modal simple de creación */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded p-6 w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Editar usuario' : 'Crear usuario'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input name="cedula_usuario" value={form.cedula_usuario} onChange={handleChange} placeholder="Cédula" className="p-2 border rounded" />
              <input name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" />
              <input name="apellidos_usuario" value={form.apellidos_usuario} onChange={handleChange} placeholder="Apellidos" className="p-2 border rounded" />
              <input name="correo_usuario" value={form.correo_usuario} onChange={handleChange} placeholder="Correo" className="p-2 border rounded" />
              <input name="contrasenia_usuario" value={form.contrasenia_usuario} onChange={handleChange} placeholder={isEditing ? "Dejar vacío para no cambiar" : "Contraseña"} className="p-2 border rounded" />
              <div>
                <label className="block text-sm font-semibold mb-1">Roles</label>
                <select multiple name="roles_ids" value={form.roles_ids} onChange={handleRolesChange} className="w-full p-2 border rounded h-40 bg-white">
                  {rolesList.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 mt-1">Mantén presionada Ctrl/Cmd para seleccionar múltiples roles</div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-4">
              <div className="text-sm text-slate-600">{isEditing ? 'Editando usuario #' + editUserId : 'Creando nuevo usuario'}</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setOpenForm(false); setIsEditing(false); setEditUserId(null); setForm({ cedula_usuario: "", apellidos_usuario: "", nombre_usuario: "", correo_usuario: "", contrasenia_usuario: "", roles_ids: [] }); }} className="px-4 py-2 rounded border">Cancelar</button>
                <button onClick={isEditing ? handleUpdate : handleCreate} className="px-4 py-2 rounded bg-blue-600 text-white flex items-center gap-2">
                  <Save className="w-4 h-4" /> {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
