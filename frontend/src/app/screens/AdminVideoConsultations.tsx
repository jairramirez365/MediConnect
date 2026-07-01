import { useEffect, useMemo, useState } from 'react';
import { MonitorPlay, RefreshCw, Search, Video } from 'lucide-react';
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

export function AdminVideoConsultations() {
  const reduce = useReducedMotion();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    search: ''
  });

  async function loadSessions() {
    setLoading(true);
    setError('');

    try {
      const response = await api.videoConsultations({
        ...filters,
        limit: 100
      });
      setSessions(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las videoconsultas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, [filters.status, filters.provider, filters.search]);

  const metrics = useMemo(() => ({
    total: sessions.length,
    inProgress: sessions.filter((session) => session.status === 'in_progress').length,
    completed: sessions.filter((session) => session.status === 'completed').length,
    failed: sessions.filter((session) => ['failed', 'expired', 'cancelled'].includes(session.status)).length
  }), [sessions]);

  if (loading) return <LoadingState label="Cargando monitoreo de videoconsultas..." />;
  if (error && !sessions.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#7e22ce_0%,_#c026d3_45%,_#db2777_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(192,38,211,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-pink-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <MonitorPlay className="h-4 w-4" />
            Control transversal de teleconsulta
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Videoconsultas</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-fuchsia-50 md:text-base">
            Supervisa las sesiones virtuales, detecta fallos operativos y revisa el avance real de las consultas dentro de la plataforma.
          </p>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard title="Total" value={metrics.total} />
            <MetricCard title="En curso" value={metrics.inProgress} />
            <MetricCard title="Completadas" value={metrics.completed} />
            <MetricCard title="Con incidente" value={metrics.failed} />
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
            >
              <option value="">Todos</option>
              {['ready', 'in_progress', 'completed', 'cancelled', 'expired', 'failed'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-slate-700">Proveedor</span>
            <select
              value={filters.provider}
              onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
            >
              <option value="">Todos</option>
              <option value="mock">mock</option>
            </select>
          </label>

          <label className="block min-w-0 md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                placeholder="paciente, médico o room id"
              />
            </div>
          </label>
        </div>

        <button
          onClick={loadSessions}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition hover:from-fuchsia-700 hover:to-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </section>

      {sessions.length === 0 ? (
        <EmptyState title="Sin sesiones registradas" description="Cuando se preparen salas de videoconsulta para citas confirmadas, aparecerán aquí." />
      ) : (
        <motion.div
          variants={listStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {sessions.map((session) => (
            <motion.article
              key={session.id}
              variants={listItem}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex flex-col items-center rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-[0_12px_36px_rgba(37,99,235,0.06)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-md shadow-fuchsia-600/20">
                <Video className="h-6 w-6" />
              </span>
              <p className="mt-3 text-lg font-bold text-slate-900">{session.patient}</p>
              <p className="mt-0.5 text-sm text-slate-500">con {session.doctor}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status={session.status} />
                <StatusBadge status={session.appointmentStatus} />
              </div>

              <div className="mt-4 w-full space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>Cita: {new Date(session.scheduledStartAt).toLocaleString('es-CO')}</p>
                <p className="break-all">Sala: {session.providerRoomId}</p>
                <p>
                  Inicio: {session.startedAt ? new Date(session.startedAt).toLocaleString('es-CO') : 'Pendiente'}
                </p>
                <p>
                  Fin: {session.endedAt ? new Date(session.endedAt).toLocaleString('es-CO') : 'Pendiente'}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-xs text-fuchsia-50">{title}</p>
    </div>
  );
}
