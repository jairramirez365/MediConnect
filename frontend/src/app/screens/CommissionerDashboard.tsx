import { Calendar, ChevronRight, Code, Wallet, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

export function CommissionerDashboard({
  onGoToCodes,
  onGoToPatients,
  onGoToSchedule,
  onGoToPayments
}: {
  onGoToCodes: () => void;
  onGoToPatients: () => void;
  onGoToSchedule: () => void;
  onGoToPayments: () => void;
}) {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await api.commissionerOverview();
        setData(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el inicio del gestor.');
      } finally {
        setIsLoading(false);
      }
    }

    loadOverview();
  }, []);

  if (isLoading) return <LoadingState label="Cargando inicio gestor..." />;
  if (error) return <ErrorState message={error} />;

  const overview = data?.overview || {};
  const commissions = data?.recentCommissions || [];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <Users className="h-4 w-4" />
              Acompanamiento y referidos
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Inicio gestor</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Gestiona tus pacientes vinculados, genera codigos unicos y acompana la agenda de quienes requieren apoyo para reservar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionChip label="Ver codigos" icon={Code} onClick={onGoToCodes} />
              <ActionChip label="Pacientes vinculados" icon={Users} onClick={onGoToPatients} />
              <ActionChip label="Agendar cita" icon={Calendar} onClick={onGoToSchedule} />
              <ActionChip label="Ver pagos" icon={Wallet} onClick={onGoToPayments} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Codigos activos" value={overview.activeCodes || 0} icon={Code} />
            <HeroMiniCard title="Pacientes vinculados" value={overview.linkedPatients || 0} icon={Users} />
            <HeroMiniCard title="Citas activas" value={overview.activeAppointments || 0} icon={Calendar} />
            <HeroMiniCard title="Saldo disponible" value={`$${Number(overview.availableBalance || 0).toLocaleString('es-CO')}`} icon={Wallet} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Resumen comercial</h2>
              <p className="mt-1 text-sm text-slate-500">Tu impacto real dentro del flujo de atencion.</p>
            </div>
            <button onClick={onGoToCodes} className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              Abrir codigos
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Comision total" value={`$${Number(overview.totalCommissions || 0).toLocaleString('es-CO')}`} subtitle="Historico generado" />
            <MetricCard title="Liquidada" value={`$${Number(overview.liquidatedCommissions || 0).toLocaleString('es-CO')}`} subtitle="Disponible para retiro" />
            <MetricCard title="Pendiente" value={`$${Number(overview.pendingCommissions || 0).toLocaleString('es-CO')}`} subtitle="En curso de liquidacion" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Comisiones recientes</h2>
              <p className="mt-1 text-sm text-slate-500">Ultimos movimientos asociados a tus referidos.</p>
            </div>
          </div>
          {commissions.length === 0 ? (
            <EmptyState title="Sin comisiones recientes" description="Cuando una cita vinculada se pague, el movimiento aparecera aqui." />
          ) : (
            <div className="space-y-4">
              {commissions.map((commission: any) => (
                <div key={commission.id} className="rounded-[22px] bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{commission.patient}</p>
                  <p className="mt-1 text-sm text-slate-500">{commission.code || 'Sin codigo visible'} · {new Date(commission.appointmentAt).toLocaleDateString('es-CO')}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{commission.status}</span>
                    <span className="font-bold text-emerald-600">${Number(commission.amount || 0).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ActionChip({ label, icon: Icon, onClick }: any) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-medium text-white/95 transition hover:bg-white/24">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: any) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
