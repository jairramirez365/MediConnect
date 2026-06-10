import { useEffect, useMemo, useState } from 'react';
import { MonitorPlay, RefreshCw, Search, Video } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function AdminVideoConsultations() {
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
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <MonitorPlay className="h-4 w-4" />
              Control transversal de teleconsulta
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Videoconsultas</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Supervisa las sesiones virtuales, detecta fallos operativos y revisa el avance real de las consultas dentro de la plataforma.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard title="Total" value={metrics.total} />
            <MetricCard title="En curso" value={metrics.inProgress} />
            <MetricCard title="Completadas" value={metrics.completed} />
            <MetricCard title="Con incidente" value={metrics.failed} />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              {['ready', 'in_progress', 'completed', 'cancelled', 'expired', 'failed'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Proveedor</span>
            <select
              value={filters.provider}
              onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              <option value="mock">mock</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="paciente, medico o room id"
              />
            </div>
          </label>
        </div>

        <button
          onClick={loadSessions}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </section>

      {sessions.length === 0 ? (
        <EmptyState title="Sin sesiones registradas" description="Cuando se preparen salas de videoconsulta para citas confirmadas, apareceran aqui." />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Medico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Cita</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Sala</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Inicio real</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Fin real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{session.patient}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{session.doctor}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(session.scheduledStartAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-600" />
                        <span>{session.providerRoomId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={session.status} />
                        <StatusBadge status={session.appointmentStatus} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {session.startedAt ? new Date(session.startedAt).toLocaleString('es-CO') : 'Pendiente'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {session.endedAt ? new Date(session.endedAt).toLocaleString('es-CO') : 'Pendiente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <p className="text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
