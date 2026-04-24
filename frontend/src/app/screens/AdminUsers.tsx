import { Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadUsers(nextPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.users({ page: nextPage, limit: 10, role, status, search });
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
      setError(err instanceof Error ? err.message : 'No fue posible cambiar el estado del usuario.');
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, []);

  if (isLoading) return <LoadingState label="Cargando usuarios..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
        <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
              <Users className="h-4 w-4" />
              Operacion y seguridad de cuentas
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Gestion de usuarios con foco en control, soporte y continuidad.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Revisa el listado real del backend, filtra por rol y bloquea o desbloquea cuentas cuando la operacion lo requiera.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <SummaryPill label="Usuarios visibles" value={users.length} />
            <SummaryPill label="Pagina actual" value={page} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por correo o telefono"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm text-slate-700"
            />
          </div>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="medico">Medicos</option>
            <option value="comisionista">Comisionistas</option>
            <option value="administrador">Administradores</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="bloqueado">Bloqueados</option>
            <option value="pendiente_verificacion">Pendiente verificacion</option>
          </select>
          <button
            onClick={() => loadUsers(1)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] transition hover:bg-blue-700"
          >
            Aplicar filtro
          </button>
        </div>
      </section>

      {users.length === 0 ? (
        <EmptyState title="Sin usuarios" description="No hay resultados para el filtro seleccionado." />
      ) : (
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Creado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-blue-50/40">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.email}</p>
                          <p className="text-sm text-slate-500">{user.phone || 'Sin telefono registrado'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium capitalize text-slate-700">{user.role}</td>
                    <td className="px-6 py-5"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-5 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => setUserBlocked(user)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        {user.status === 'bloqueado' ? (
                          <>
                            <ToggleLeft className="h-5 w-5 text-red-500" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                            Bloquear
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <button
          disabled={page <= 1}
          onClick={() => loadUsers(page - 1)}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm font-medium text-slate-500">Pagina {page}</span>
        <button
          onClick={() => loadUsers(page + 1)}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(37,99,235,0.1)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
