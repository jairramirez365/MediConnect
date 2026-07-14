import { motion, useReducedMotion } from 'framer-motion';
import { Activity, CalendarDays, CreditCard, ShieldCheck, Users, Video } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

export function AdminDashboard({ onGoToUsers, onGoToDoctorReview, onGoToPayments, onGoToVideoConsultations }: { onGoToUsers: () => void; onGoToDoctorReview: () => void; onGoToPayments: () => void; onGoToVideoConsultations: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const reduce = useReducedMotion();

  useEffect(() => {
    async function loadData() {
      try {
        const [usersResponse, appointmentsResponse, pendingDoctorsResponse] = await Promise.all([
          api.users({ page: 1, limit: 20 }),
          api.appointments({ limit: 20 }),
          api.pendingDoctors()
        ]);

        setUsers(usersResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setPendingDoctors(pendingDoctorsResponse.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el inicio administrativo.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const metrics = useMemo(() => {
    const patients = users.filter((user) => user.role === 'paciente').length;
    const doctors = users.filter((user) => user.role === 'medico').length;
    const blocked = users.filter((user) => user.status === 'bloqueado').length;
    const upcoming = appointments.filter((appointment) =>
      ['pendiente_confirmacion', 'confirmada', 'en_curso'].includes(appointment.status)
    ).length;

    return { patients, doctors, blocked, upcoming };
  }, [appointments, users]);

  const recentAppointments = appointments.slice(0, 5);

  if (isLoading) return <LoadingState label="Cargando inicio administrativo..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1e3a8a_0%,_#4f46e5_45%,_#7c3aed_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(79,70,229,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            Centro de control MediConnect
          </span>
          <h2 className="mt-4 max-w-3xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Gestión transversal del aplicativo con control operativo y trazabilidad central.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Supervisa usuarios, citas activas y médicos pendientes de revisión en un mismo punto. La idea es que cada decisión operativa se tome rápido y con contexto.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <ActionChip label="Gestionar usuarios" onClick={onGoToUsers} />
            <ActionChip label="Revisar médicos" onClick={onGoToDoctorReview} />
            <ActionChip label="Controlar pagos" onClick={onGoToPayments} />
            <ActionChip label="Monitorear videoconsultas" onClick={onGoToVideoConsultations} />
          </div>

          <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-3">
            <AdminMiniCard
              title="Pendientes"
              value={pendingDoctors.length}
              description="Médicos esperando aprobación"
            />
            <AdminMiniCard
              title="Citas activas"
              value={metrics.upcoming}
              description="Programadas o confirmadas"
            />
            <AdminMiniCard
              title="Usuarios bloqueados"
              value={metrics.blocked}
              description="Requieren seguimiento"
            />
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<Users className="h-6 w-6 text-white" />}
          tone="blue"
          label="Pacientes"
          value={metrics.patients}
          description="Usuarios con acceso al cuidado"
        />
        <MetricCard
          icon={<Activity className="h-6 w-6 text-white" />}
          tone="emerald"
          label="Médicos"
          value={metrics.doctors}
          description="Perfiles profesionales cargados"
        />
        <MetricCard
          icon={<CalendarDays className="h-6 w-6 text-white" />}
          tone="indigo"
          label="Citas"
          value={appointments.length}
          description="Registros visibles en la operación"
        />
        <MetricCard
          icon={<ShieldCheck className="h-6 w-6 text-white" />}
          tone="sky"
          label="Revisión"
          value={pendingDoctors.length}
          description="Solicitudes por validar"
        />
        <MetricCard
          icon={<Video className="h-6 w-6 text-white" />}
          tone="cyan"
          label="Video"
          value={appointments.filter((appointment) => appointment.careChannel === 'virtual').length}
          description="Citas virtuales con trazabilidad"
        />
        <MetricCard
          icon={<CreditCard className="h-6 w-6 text-white" />}
          tone="violet"
          label="Pagos"
          value={appointments.filter((appointment) => ['pendiente_confirmacion', 'confirmada', 'completada'].includes(appointment.status)).length}
          description="Consultas con traza financiera"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Actividad Reciente</h3>
              <p className="mt-1 text-sm text-slate-500">Últimas citas registradas en el sistema.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tiempo real
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {recentAppointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center text-sm text-slate-500">
                Aún no hay citas recientes para mostrar.
              </div>
            ) : (
              recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {appointment.status?.replaceAll('_', ' ') || 'sin estado'}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      Cita {appointment.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(appointment.scheduledStartAt || Date.now()).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    Flujo listo para control operativo y trazabilidad.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h3 className="text-xl font-bold text-slate-900">Prioridades del Día</h3>
          <p className="mt-1 text-sm text-slate-500">Acciones sugeridas para mantener la operación estable.</p>

          <div className="mt-6 space-y-4">
            <PriorityCard
              title="Aprobar médicos pendientes"
              description="Revisa documentos cargados para habilitar nuevos especialistas visibles al paciente."
              onClick={onGoToDoctorReview}
            />
            <PriorityCard
              title="Monitorear citas próximas"
              description="Asegura que las consultas programadas mantengan continuidad y buena experiencia."
              onClick={onGoToUsers}
            />
            <PriorityCard
              title="Monitorear videoconsultas"
              description="Verifica sesiones fallidas, accesos activos y consultas virtuales en curso."
              onClick={onGoToVideoConsultations}
            />
            <PriorityCard
              title="Revisar usuarios bloqueados"
              description="Detecta cuentas con incidencias y confirma si corresponde reactivar o mantener restricción."
              onClick={onGoToUsers}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
      {label}
    </button>
  );
}

const adminMetricTones: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  indigo: 'from-indigo-500 to-violet-600',
  sky: 'from-sky-500 to-cyan-600',
  cyan: 'from-cyan-500 to-blue-600',
  violet: 'from-violet-500 to-fuchsia-600'
};

function MetricCard({
  icon,
  label,
  value,
  description,
  tone = 'blue'
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
  tone?: string;
}) {
  return (
    <article className="flex flex-col items-center rounded-[28px] border border-slate-200/80 bg-white/95 p-5 text-center shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${adminMetricTones[tone]} text-white shadow-lg`}>
        {icon}
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function AdminMiniCard({
  title,
  value,
  description
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-50">{title}</p>
      <p className="mt-1 text-xs text-blue-50/90">{description}</p>
    </div>
  );
}

function PriorityCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white px-5 py-5 text-left transition hover:border-blue-200 hover:shadow-md">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  );
}
