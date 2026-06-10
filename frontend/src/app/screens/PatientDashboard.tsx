import {
  Calendar,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wallet
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

type PatientDashboardProps = {
  onGoToSearchDoctors: () => void;
  onGoToBookAppointment: () => void;
  onGoToHistory: () => void;
  onGoToAppointments: () => void;
  onGoToPayments: () => void;
};

export function PatientDashboard({
  onGoToSearchDoctors,
  onGoToBookAppointment,
  onGoToHistory,
  onGoToAppointments,
  onGoToPayments
}: PatientDashboardProps) {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAppointments() {
      try {
        const response = await api.appointments({ limit: 12 });
        setAppointments(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar tu inicio.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => ['pendiente_confirmacion', 'confirmada'].includes(appointment.status)),
    [appointments]
  );
  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completada'),
    [appointments]
  );
  const totalConsultationValue = useMemo(
    () => completedAppointments.reduce((acc, appointment) => acc + Number(appointment.consultationFee || 0), 0),
    [completedAppointments]
  );
  const specialistsConsulted = useMemo(
    () => new Set(completedAppointments.map((appointment) => appointment.doctorId)).size,
    [completedAppointments]
  );

  if (isLoading) return <LoadingState label="Cargando tu inicio..." />;
  if (error) return <ErrorState message={error} />;

  const patientName = profile?.nombres || 'Paciente';
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#60a5fa_60%,_#bfdbfe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.22)] md:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Tu espacio personal de salud
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Hola, {patientName}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Desde aqui puedes revisar tu siguiente consulta, entender tu historial y avanzar directo a la accion que necesites.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionChip icon={Calendar} label="Agenda tu proxima cita" onClick={onGoToBookAppointment} />
              <ActionChip icon={Search} label="Buscar medicos" onClick={onGoToSearchDoctors} />
              <ActionChip icon={FileText} label="Ver historial" onClick={onGoToHistory} />
              <ActionChip icon={Wallet} label="Ver pagos" onClick={onGoToPayments} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard
              icon={Clock3}
              title="Proxima cita"
              text={
                nextAppointment
                  ? new Date(nextAppointment.scheduledStartAt).toLocaleString('es-CO')
                  : 'Agenda tu primera consulta'
              }
            />
            <HeroMiniCard
              icon={Wallet}
              title="Valor acumulado"
              text={`$${totalConsultationValue.toLocaleString('es-CO')}`}
            />
            <HeroMiniCard
              icon={HeartPulse}
              title="Consultas completadas"
              text={`${completedAppointments.length} finalizadas`}
            />
            <HeroMiniCard
              icon={Sparkles}
              title="Especialistas consultados"
              text={`${specialistsConsulted} profesionales`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Proximas citas" value={upcomingAppointments.length} subtitle="Listas para seguimiento" icon={Calendar} />
            <MetricCard title="Consultas completadas" value={completedAppointments.length} subtitle="Con soporte clinico" icon={FileText} />
            <MetricCard title="Especialistas consultados" value={specialistsConsulted} subtitle="Historial enriquecido" icon={Stethoscope} />
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Tu proxima cita</h2>
                <p className="mt-1 text-sm text-slate-500">Todo lo que viene en tu agenda, sin perder contexto.</p>
              </div>
              <button
                onClick={onGoToAppointments}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyState title="Sin citas programadas" description="Explora especialistas y agenda tu siguiente consulta en pocos pasos." />
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 1).map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-950">{appointment.doctor}</p>
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
                          Ver detalle
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
          <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Actividad reciente</h2>
                <p className="mt-1 text-sm text-slate-500">Tus citas completadas alimentan el seguimiento clinico.</p>
              </div>
              <button
                onClick={onGoToHistory}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Abrir historia
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {completedAppointments.length === 0 ? (
                <EmptyState title="Aun no hay consultas completadas" description="Cuando finalices tus citas, este resumen se ira enriqueciendo automaticamente." />
              ) : (
                completedAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex gap-3 rounded-[22px] bg-slate-50 p-4">
                    <div className="mt-1 rounded-2xl bg-blue-100 p-3 text-blue-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{appointment.doctor}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.doctorSpecialties?.join(', ') || 'Especialidad disponible en historia clinica'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionChip({ icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-medium text-white/95 transition hover:bg-white/24"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function HeroMiniCard({ icon: Icon, title, text }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-lg font-bold text-white">{text}</p>
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
