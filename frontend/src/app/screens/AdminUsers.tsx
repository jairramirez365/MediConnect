import { Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadUsers(nextPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.users({ page: nextPage, limit: 10, role });
      setUsers(response.data || []);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar usuarios.');
    } finally {
      setIsLoading(false);
    }
  }

  async function setUserBlocked(user: any) {
    try {
      if (user.status === 'bloqueado') {
        await api.unblockUser(user.id);
      } else {
        await api.blockUser(user.id);
      }
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cambiar estado del usuario.');
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, []);

  if (isLoading) return <LoadingState label="Cargando usuarios..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="mt-1 text-gray-600">Listado real del backend con bloqueo y desbloqueo por administrador.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input disabled placeholder="Búsqueda textual se habilitará cuando exista endpoint dedicado" className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm" />
          </div>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-2">
            <option value="">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="medico">Médicos</option>
            <option value="comisionista">Comisionistas</option>
            <option value="administrador">Administradores</option>
          </select>
        </div>
        <button onClick={() => loadUsers(1)} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Aplicar filtro
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState title="Sin usuarios" description="No hay resultados para el filtro seleccionado." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone || 'Sin teléfono'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-900">{user.role}</td>
                    <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setUserBlocked(user)} className="rounded-lg p-2 hover:bg-gray-100">
                        {user.status === 'bloqueado'
                          ? <ToggleLeft className="h-5 w-5 text-red-600" />
                          : <ToggleRight className="h-5 w-5 text-green-600" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button disabled={page <= 1} onClick={() => loadUsers(page - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">
          Anterior
        </button>
        <span className="text-sm text-gray-600">Página {page}</span>
        <button onClick={() => loadUsers(page + 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
          Siguiente
        </button>
      </div>
    </div>
  );
}
