import { Calendar, ChevronRight, Clock3, FileText, Search, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

export function PatientAppointments({
  onBookAppointment,
  onOpenHistory,
  onOpenVideoConsultation
}: {
  onBookAppointment?: () => void;
  onOpenHistory?: (appointmentId?: string | null) => void;
  onOpenVideoConsultation?: (appointmentId: string) => void;
}) {
  const reduce = useReducedMotion();
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
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la participacion del gestor en el chat.');
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

  if (isLoading) return <LoadingState label="Cargando gestión de citas..." />;
  if (error && !appointments.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#4338ca_0%,_#7c3aed_45%,_#c026d3_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Seguimiento claro de tu agenda
          </div>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Gestión de citas</h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Filtra tus citas y abre el historial clínico desde cada consulta para mantener toda la información unida al recorrido real.
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            <MiniSummary title="Total citas" value={appointments.length} icon={Calendar} />
            <MiniSummary title="Pendientes" value={appointments.filter((appointment: any) => ['pendiente_confirmacion', 'confirmada'].includes(appointment.status)).length} icon={Clock3} />
          </div>

          {onBookAppointment && (
            <motion.button
              onClick={onBookAppointment}
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Agendar nueva cita
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </motion.section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="Fecha" type="date" value={filters.date} onChange={(value) => setFilters((current) => ({ ...current, date: value }))} />
          <FilterInput label="Médico" value={filters.doctor} onChange={(value) => setFilters((current) => ({ ...current, doctor: value }))} />
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
        <motion.div
          variants={listStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-4 xl:grid-cols-2"
        >
          {filteredAppointments.map((appointment: any) => (
            <motion.article
              key={appointment.id}
              variants={listItem}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(37,99,235,0.06)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <span className="break-words">{new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}</span>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={appointment.status} />
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-lg font-bold text-slate-900">{appointment.doctor}</p>
                <p className="mt-0.5 text-sm text-slate-600">{appointment.reason}</p>
              </div>

              {appointment.requiresCommissionAgentInChat && (
                <div className="mt-3 rounded-2xl bg-blue-50/70 p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/80">
                    Acompañamiento en chat
                  </p>
                  <div className="mt-1.5 flex justify-center">
                    <StatusBadge status={appointment.commissionAgentChatRequestStatus || 'pendiente_paciente'} />
                  </div>
                  {appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && appointment.commissionAgentChatRequestAt && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Recibirás esta solicitud como recordatorio 5 minutos antes de la consulta y puedes resolverla desde aquí.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onOpenHistory?.(appointment.id)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <FileText className="h-4 w-4" />
                  Historial
                </button>
                {appointment.careChannel === 'virtual' && ['confirmada', 'en_curso'].includes(appointment.status) && (
                  <button
                    onClick={() => onOpenVideoConsultation?.(appointment.id)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Videoconsulta
                  </button>
                )}
                {appointment.requiresCommissionAgentInChat && appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && (
                  <button
                    onClick={() => respondCommissionAgentChatRequest(appointment.id, 'accept')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Aceptar chat
                  </button>
                )}
                {appointment.requiresCommissionAgentInChat && appointment.commissionAgentChatRequestStatus === 'pendiente_paciente' && (
                  <button
                    onClick={() => respondCommissionAgentChatRequest(appointment.id, 'reject')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                  >
                    Rechazar chat
                  </button>
                )}
                {['pendiente_confirmacion', 'confirmada'].includes(appointment.status) && (
                  <button
                    onClick={() => cancelAppointment(appointment.id)}
                    aria-label="Cancelar cita"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function MiniSummary({ title, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2.5 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-sm text-blue-50">{title}</p>
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
