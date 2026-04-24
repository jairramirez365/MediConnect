import { Calendar, ChevronRight, Clock3, FileText, Search, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function PatientAppointments({
  onBookAppointment,
  onOpenHistory
}: {
  onBookAppointment?: () => void;
  onOpenHistory?: (appointmentId?: string | null) => void;
}) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    date: '',
    doctor: '',
    reason: '',
    status: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadAppointments() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.appointments({ limit: 50 });
      setAppointments(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      await api.cancelAppointment(id, { cancellationReason: 'Cancelada desde frontend' });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cancelar la cita.');
    }
  }

  async function respondCommissionAgentChatRequest(id: string, action: 'accept' | 'reject') {
    try {
      await api.respondCommissionAgentChatRequest(id, { action });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la participacion del comisionista en el chat.');
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesDate = !filters.date || new Date(appointment.scheduledStartAt).toISOString().slice(0, 10) === filters.date;
      const matchesDoctor = !filters.doctor || appointment.doctor.toLowerCase().includes(filters.doctor.toLowerCase());
      const matchesReason = !filters.reason || appointment.reason.toLowerCase().includes(filters.reason.toLowerCase());
      const matchesStatus = !filters.status || appointment.status === filters.status;
      return matchesDate && matchesDoctor && matchesReason && matchesStatus;
    });
  }, [appointments, filters]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(appointments.map((appointment) => appointment.status))),
    [appointments]
  );

  if (isLoading) return <LoadingState label="Cargando gestion de citas..." />;
  if (error && !appointments.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <ShieldCheck className="h-4 w-4" />
              Seguimiento claro de tu agenda
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Gestion de citas</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Filtra tus citas y abre el historial clinico desde cada consulta para mantener toda la informacion unida al recorrido real.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniSummary title="Total citas" value={appointments.length} icon={Calendar} />
            <MiniSummary title="Pendientes" value={appointments.filter((appointment: any) => ['pendiente_confirmacion', 'confirmada'].includes(appointment.status)).length} icon={Clock3} />
          </div>
        </div>
        {onBookAppointment && (
          <button
            onClick={onBookAppointment}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Agendar nueva cita
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="Fecha" type="date" value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
          <FilterInput label="Medico" value={filters.doctor} onChange={(value) => setFilters((current) => ({ ...current, doctor: value }))} />
          <FilterInput label="Motivo" value={filters.reason} onChange={(value) => setFilters((current) => ({ ...current, reason: value }))} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filteredAppointments.length === 0 ? (
        <EmptyState title="Sin citas para esos filtros" description="Ajusta los criterios o crea una nueva cita para seguir construyendo tu historial." />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Medico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment: any) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{appointment.doctor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.reason}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={appointment.status} />
                        {appointment.requiresCommissionAgentInChat && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Acompanamiento en chat
                            </p>
                            <StatusBadge status={appointment.commissionAgentChatRequestStatus || 'pendiente_paciente'} />
                            {appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && appointment.commissionAgentChatRequestAt && (
                              <p className="max-w-[220px] text-xs leading-5 text-slate-500">
                                Recibiras esta solicitud como recordatorio 5 minutos antes de la consulta y puedes resolverla desde aqui.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onOpenHistory?.(appointment.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          Historial
                        </button>
                        {appointment.requiresCommissionAgentInChat && appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && (
                          <button
                            onClick={() => respondCommissionAgentChatRequest(appointment.id, 'accept')}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Aceptar chat
                          </button>
                        )}
                        {appointment.requiresCommissionAgentInChat && appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && (
                          <button
                            onClick={() => respondCommissionAgentChatRequest(appointment.id, 'reject')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Rechazar chat
                          </button>
                        )}
                        {['pendiente_confirmacion', 'confirmada'].includes(appointment.status) && (
                          <button onClick={() => cancelAppointment(appointment.id)} className="rounded-lg p-2 text-red-700 hover:bg-red-50">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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

function MiniSummary({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = 'text' }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </label>
  );
}
