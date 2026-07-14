import { Calendar, ChevronRight, ClipboardList, Clock3, CreditCard, FileText, ShieldCheck, Stethoscope, UserCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

const gridStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } }
};

const metricTones: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  amber: 'from-amber-500 to-orange-600',
  emerald: 'from-emerald-500 to-teal-600',
  violet: 'from-violet-500 to-fuchsia-600'
};

export function DoctorDashboard({
  onGoToSchedule,
  onGoToAppointments,
  onGoToProfile,
  onGoToPayments
}: {
  onGoToSchedule: () => void;
  onGoToAppointments: () => void;
  onGoToProfile: () => void;
  onGoToPayments: () => void;
}) {
  const reduce = useReducedMotion();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAppointments() {
      try {
        const response = await api.appointments({ limit: 12 });
        setAppointments(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar tu inicio médico.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.filter((appointment) => appointment.scheduledStartAt?.slice(0, 10) === today);
  }, [appointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => ['pendiente_confirmacion', 'confirmada'].includes(appointment.status)),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completada'),
    [appointments]
  );

  const patientsServed = useMemo(
    () => new Set(completedAppointments.map((appointment) => appointment.patient)).size,
    [completedAppointments]
  );

  if (isLoading) return <LoadingState label="Cargando tu inicio médico..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1e3a8a_0%,_#4f46e5_45%,_#7c3aed_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(79,70,229,0.32)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Tu jornada médica, más clara
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Inicio Médico</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Revisa tu agenda, confirma consultas y mantente cerca de cada paciente con una vista simple y accionable.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <ActionChip title="Ver agenda" icon={Calendar} onClick={onGoToSchedule} reduce={reduce} />
            <ActionChip title="Gestionar citas" icon={ClipboardList} onClick={onGoToAppointments} reduce={reduce} />
            <ActionChip title="Completar perfil" icon={UserCircle} onClick={onGoToProfile} reduce={reduce} />
            <ActionChip title="Ver pagos" icon={CreditCard} onClick={onGoToPayments} reduce={reduce} />
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={gridStagger}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <MetricCard title="Citas hoy" value={todayAppointments.length} subtitle="Jornada actual" icon={Calendar} tone="blue" reduce={reduce} />
        <MetricCard title="Consultas pendientes" value={pendingAppointments.length} subtitle="Por confirmar o atender" icon={Clock3} tone="amber" reduce={reduce} />
        <MetricCard title="Consultas completadas" value={completedAppointments.length} subtitle="Historial reciente" icon={FileText} tone="emerald" reduce={reduce} />
        <MetricCard title="Pacientes atendidos" value={patientsServed} subtitle="Seguimiento activo" icon={Users} tone="violet" reduce={reduce} />
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="min-w-0 space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-bold text-slate-950">Tu Agenda Inmediata</h2>
              <p className="mt-1 text-sm text-slate-500">Las siguientes consultas que requieren tu atención.</p>
            </div>

            {pendingAppointments.length === 0 ? (
              <EmptyState title="Sin citas pendientes" description="Cuando un paciente agende contigo, la consulta aparecerá aquí." />
            ) : (
              <div className="space-y-4">
                {pendingAppointments.slice(0, 4).map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] border border-blue-100 bg-[linear-gradient(160deg,_#ffffff_0%,_#eff6ff_100%)] p-5">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{appointment.patient}</p>
                        <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
                          <span>{new Date(appointment.scheduledStartAt).toLocaleDateString('es-CO')}</span>
                          <span>{new Date(appointment.scheduledStartAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="capitalize">{appointment.careChannel}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <StatusBadge status={appointment.status} />
                        <button
                          onClick={onGoToAppointments}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          Abrir
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-bold text-slate-950">Actividad Reciente</h2>
              <p className="mt-1 text-sm text-slate-500">Resumen rápido del movimiento más reciente en tu agenda.</p>
            </div>
            <div className="space-y-4">
              {appointments.slice(0, 4).map((appointment) => (
                <div key={appointment.id} className="flex gap-3 rounded-[22px] bg-slate-50 p-4">
                  <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-violet-600/20">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{appointment.patient}</p>
                    <p className="mt-1 text-sm text-slate-600">{appointment.reason}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function ActionChip({ title, icon: Icon, onClick, reduce }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <Icon className="h-4 w-4" />
      {title}
    </motion.button>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, tone = 'blue', reduce }: any) {
  return (
    <motion.div
      variants={gridItem}
      whileHover={reduce ? undefined : { y: -4 }}
      className="flex flex-col items-center rounded-[26px] border border-white/80 bg-white/90 p-5 text-center shadow-[0_18px_50px_rgba(37,99,235,0.08)]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${metricTones[tone]} text-white shadow-lg`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
    </motion.div>
  );
}
