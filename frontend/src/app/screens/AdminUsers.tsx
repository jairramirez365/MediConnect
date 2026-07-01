import { Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

export function AdminUsers() {
  const reduce = useReducedMotion();
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
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#4338ca_0%,_#7c3aed_45%,_#c026d3_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Users className="h-4 w-4" />
            Operación y seguridad de cuentas
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Gestión de usuarios con foco en control, soporte y continuidad.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-indigo-50 md:text-base">
            Revisa el listado real del backend, filtra por rol y bloquea o desbloquea cuentas cuando la operación lo requiera.
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            <SummaryPill label="Usuarios visibles" value={users.length} />
            <SummaryPill label="Página actual" value={page} />
          </div>
        </div>
      </motion.section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por correo o teléfono"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="medico">Médicos</option>
            <option value="comisionista">Gestores</option>
            <option value="administrador">Administradores</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="bloqueado">Bloqueados</option>
            <option value="pendiente_verificacion">Pendiente verificación</option>
          </select>
          <button
            onClick={() => loadUsers(1)}
            className="min-h-[44px] rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition hover:from-violet-700 hover:to-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
          >
            Aplicar filtro
          </button>
        </div>
      </section>

      {users.length === 0 ? (
        <EmptyState title="Sin usuarios" description="No hay resultados para el filtro seleccionado." />
      ) : (
        <motion.div
          variants={listStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {users.map((user) => (
            <motion.article
              key={user.id}
              variants={listItem}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex flex-col items-center rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-[0_12px_36px_rgba(37,99,235,0.06)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl font-bold text-white shadow-md shadow-fuchsia-600/20">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <p className="mt-3 break-all font-semibold text-slate-900">{user.email}</p>
              <p className="mt-0.5 text-sm text-slate-500">{user.phone || 'Sin teléfono registrado'}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  {formatRoleLabel(user.role)}
                </span>
                <StatusBadge status={user.status} />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Creado el {new Date(user.createdAt).toLocaleDateString('es-CO')}
              </p>

              <button
                onClick={() => setUserBlocked(user)}
                className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  user.status === 'bloqueado'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500'
                    : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-400'
                }`}
              >
                {user.status === 'bloqueado' ? (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    Bloquear
                  </>
                )}
              </button>
            </motion.article>
          ))}
        </motion.div>
      )}

      <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <button
          disabled={page <= 1}
          onClick={() => loadUsers(page - 1)}
          className="min-h-[44px] rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          Anterior
        </button>
        <span className="text-sm font-medium text-slate-500">Página {page}</span>
        <button
          onClick={() => loadUsers(page + 1)}
          className="min-h-[44px] rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function formatRoleLabel(role: string) {
  const roleLabels: Record<string, string> = {
    paciente: 'Paciente',
    medico: 'Médico',
    comisionista: 'Gestor',
    administrador: 'Administrador'
  };

  return roleLabels[role] || role;
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-50">{label}</p>
    </div>
  );
}
