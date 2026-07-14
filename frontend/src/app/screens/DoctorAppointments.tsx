import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ClipboardList, Video, XCircle } from 'lucide-react';
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

export function DoctorAppointments({ onOpenVideoConsultation }: { onOpenVideoConsultation?: (appointmentId: string) => void }) {
  const reduce = useReducedMotion();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadAppointments() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.appointments({ limit: 20 });
      setAppointments(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmAppointment(id: string) {
    await api.confirmAppointment(id);
    await loadAppointments();
  }

  async function completeAppointment(id: string) {
    await api.completeAppointment(id);
    await loadAppointments();
  }

  async function cancelAppointment(id: string) {
    await api.cancelAppointment(id, { cancellationReason: 'Cancelada por medico desde frontend' });
    await loadAppointments();
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  if (isLoading) return <LoadingState label="Cargando gestión de citas médicas..." />;
  if (error) return <ErrorState message={error} />;

  const pendingCount = appointments.filter((appointment) => ['pendiente_confirmacion', 'confirmada'].includes(appointment.status)).length;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#4338ca_0%,_#2563eb_45%,_#06b6d4_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(37,99,235,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ClipboardList className="h-4 w-4" />
            Gestión de consultas
          </div>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Gestión de Citas</h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-cyan-50 md:text-base">
            Confirma, cancela o completa consultas siguiendo el flujo de estados del backend.
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            <HeroStat title="Total citas" value={appointments.length} />
            <HeroStat title="Activas" value={pendingCount} />
          </div>
        </div>
      </motion.section>

      {appointments.length === 0 ? (
        <EmptyState
          title="No tienes citas asignadas"
          description="Cuando un paciente agende contigo, la consulta aparecerá aquí para que la confirmes o la completes."
        />
      ) : (
        <motion.div
          variants={listStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-4 xl:grid-cols-2"
        >
          {appointments.map((appointment) => (
            <motion.article
              key={appointment.id}
              variants={listItem}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(37,99,235,0.06)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <span className="break-words">{new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}</span>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={appointment.status} />
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-lg font-bold text-slate-900">{appointment.patient}</p>
                <p className="mt-0.5 text-sm text-slate-600">{appointment.reason}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {appointment.status === 'pendiente_confirmacion' && (
                  <button
                    onClick={() => confirmAppointment(appointment.id)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar
                  </button>
                )}
                {appointment.status === 'confirmada' && (
                  <button
                    onClick={() => onOpenVideoConsultation?.(appointment.id)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                  >
                    <Video className="h-4 w-4" />
                    Videoconsulta
                  </button>
                )}
                {appointment.status === 'confirmada' && (
                  <button
                    onClick={() => completeAppointment(appointment.id)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Completar
                  </button>
                )}
                {['pendiente_confirmacion', 'confirmada'].includes(appointment.status) && (
                  <button
                    onClick={() => cancelAppointment(appointment.id)}
                    aria-label="Cancelar cita"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
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

function HeroStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-sm text-cyan-50">{title}</p>
    </div>
  );
}
