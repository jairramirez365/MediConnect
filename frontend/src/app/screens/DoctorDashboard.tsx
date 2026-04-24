import { Calendar, ChevronRight, ClipboardList, Clock3, FileText, ShieldCheck, Sparkles, Stethoscope, UserCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function DoctorDashboard({
  onGoToSchedule,
  onGoToAppointments,
  onGoToProfile
}: {
  onGoToSchedule: () => void;
  onGoToAppointments: () => void;
  onGoToProfile: () => void;
}) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAppointments() {
      try {
        const response = await api.appointments({ limit: 12 });
        setAppointments(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar tu inicio medico.');
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

  if (isLoading) return <LoadingState label="Cargando tu inicio medico..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <ShieldCheck className="h-4 w-4" />
              Tu jornada medica, mas clara
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Inicio medico</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Revisa tu agenda, confirma consultas y mantente cerca de cada paciente con una vista simple y accionable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionChip title="Ver agenda" icon={Calendar} onClick={onGoToSchedule} />
              <ActionChip title="Gestionar citas" icon={ClipboardList} onClick={onGoToAppointments} />
              <ActionChip title="Completar perfil" icon={UserCircle} onClick={onGoToProfile} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Citas de hoy" value={todayAppointments.length} icon={Calendar} />
            <HeroMiniCard title="Pendientes" value={pendingAppointments.length} icon={Clock3} />
            <HeroMiniCard title="Completadas" value={completedAppointments.length} icon={FileText} />
            <HeroMiniCard title="Seguimiento" value="Activo" icon={Sparkles} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Citas hoy" value={todayAppointments.length} subtitle="Jornada actual" icon={Calendar} />
            <MetricCard title="Consultas pendientes" value={pendingAppointments.length} subtitle="Por confirmar o atender" icon={ClipboardList} />
            <MetricCard title="Pacientes atendidos" value={new Set(completedAppointments.map((appointment) => appointment.patient)).size} subtitle="Historial reciente" icon={Users} />
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-950">Tu agenda inmediata</h2>
              <p className="mt-1 text-sm text-slate-500">Las siguientes consultas que requieren tu atencion.</p>
            </div>

            {pendingAppointments.length === 0 ? (
              <EmptyState title="Sin citas pendientes" description="Cuando un paciente agende contigo, la consulta aparecera aqui." />
            ) : (
              <div className="space-y-4">
                {pendingAppointments.slice(0, 4).map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{appointment.patient}</p>
                        <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span>{new Date(appointment.scheduledStartAt).toLocaleDateString('es-CO')}</span>
                          <span>{new Date(appointment.scheduledStartAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="capitalize">{appointment.careChannel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={appointment.status} />
                        <button
                          onClick={onGoToAppointments}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
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

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <h2 className="text-2xl font-bold text-slate-950">Actividad reciente</h2>
            <p className="mt-1 text-sm text-slate-500">Resumen rapido del movimiento mas reciente en tu agenda.</p>
            <div className="mt-5 space-y-4">
              {appointments.slice(0, 4).map((appointment) => (
                <div key={appointment.id} className="flex gap-3 rounded-[22px] bg-slate-50 p-4">
                  <div className="mt-1 rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{appointment.patient}</p>
                    <p className="mt-1 text-sm text-slate-600">{appointment.reason}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

function ActionChip({ title, icon: Icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-medium text-white/95 transition hover:bg-white/24"
    >
      <Icon className="h-4 w-4" />
      {title}
    </button>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="rounded-2xl bg-white/16 p-3 text-white w-fit">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
