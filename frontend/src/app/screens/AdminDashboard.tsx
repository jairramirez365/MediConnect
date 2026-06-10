import { Activity, CalendarDays, CreditCard, ShieldCheck, Users, Video } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { ErrorState, LoadingState } from '../components/AsyncState';

export function AdminDashboard({ onGoToUsers, onGoToDoctorReview, onGoToPayments, onGoToVideoConsultations }: { onGoToUsers: () => void; onGoToDoctorReview: () => void; onGoToPayments: () => void; onGoToVideoConsultations: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <section className="relative overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
        <div className="absolute -right-24 -top-20 h-60 w-60 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
              Centro de control MediConnect
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Gestion transversal del aplicativo con control operativo y trazabilidad central.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Supervisa usuarios, citas activas y medicos pendientes de revision en un mismo punto. La idea es que cada decision operativa se tome rapido y con contexto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionChip label="Gestionar usuarios" onClick={onGoToUsers} />
              <ActionChip label="Revisar medicos" onClick={onGoToDoctorReview} />
              <ActionChip label="Controlar pagos" onClick={onGoToPayments} />
              <ActionChip label="Monitorear videoconsultas" onClick={onGoToVideoConsultations} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
            <AdminMiniCard
              title="Pendientes"
              value={pendingDoctors.length}
              description="Medicos esperando aprobacion"
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
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="Pacientes"
          value={metrics.patients}
          description="Usuarios con acceso al cuidado"
        />
        <MetricCard
          icon={<Activity className="h-5 w-5 text-emerald-600" />}
          label="Medicos"
          value={metrics.doctors}
          description="Perfiles profesionales cargados"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5 text-indigo-600" />}
          label="Citas"
          value={appointments.length}
          description="Registros visibles en la operacion"
        />
        <MetricCard
          icon={<ShieldCheck className="h-5 w-5 text-sky-600" />}
          label="Revision"
          value={pendingDoctors.length}
          description="Solicitudes por validar"
        />
        <MetricCard
          icon={<Video className="h-5 w-5 text-cyan-600" />}
          label="Video"
          value={appointments.filter((appointment) => appointment.careChannel === 'virtual').length}
          description="Citas virtuales con trazabilidad"
        />
        <MetricCard
          icon={<CreditCard className="h-5 w-5 text-violet-600" />}
          label="Pagos"
          value={appointments.filter((appointment) => ['pendiente_confirmacion', 'confirmada', 'completada'].includes(appointment.status)).length}
          description="Consultas con traza financiera"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Actividad reciente</h3>
              <p className="mt-1 text-sm text-slate-500">Ultimas citas registradas en el sistema.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tiempo real
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {recentAppointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center text-sm text-slate-500">
                Aun no hay citas recientes para mostrar.
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

        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h3 className="text-xl font-bold text-slate-900">Prioridades del dia</h3>
          <p className="mt-1 text-sm text-slate-500">Acciones sugeridas para mantener la operacion estable.</p>

          <div className="mt-6 space-y-4">
            <PriorityCard
              title="Aprobar medicos pendientes"
              description="Revisa documentos cargados para habilitar nuevos especialistas visibles al paciente."
              onClick={onGoToDoctorReview}
            />
            <PriorityCard
              title="Monitorear citas proximas"
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
              description="Detecta cuentas con incidencias y confirma si corresponde reactivar o mantener restriccion."
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
    <button onClick={onClick} className="inline-flex items-center rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-white">
      {label}
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
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
    <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-4 shadow-[0_16px_40px_rgba(37,99,235,0.1)] backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function PriorityCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white px-5 py-5 text-left">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  );
}
