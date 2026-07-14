import { Calendar, CheckCircle2, ChevronRight, Clock3, Code, Wallet, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600'
};

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
  const reduce = useReducedMotion();
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
            <Users className="h-4 w-4" />
            Acompañamiento y referidos
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Inicio Gestor</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Gestiona tus pacientes vinculados, genera códigos únicos y acompaña la agenda de quienes requieren apoyo para reservar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <ActionChip label="Ver códigos" icon={Code} onClick={onGoToCodes} reduce={reduce} />
            <ActionChip label="Pacientes vinculados" icon={Users} onClick={onGoToPatients} reduce={reduce} />
            <ActionChip label="Agendar cita" icon={Calendar} onClick={onGoToSchedule} reduce={reduce} />
            <ActionChip label="Ver pagos" icon={Wallet} onClick={onGoToPayments} reduce={reduce} />
          </div>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroMiniCard title="Códigos activos" value={overview.activeCodes || 0} icon={Code} />
            <HeroMiniCard title="Pacientes vinculados" value={overview.linkedPatients || 0} icon={Users} />
            <HeroMiniCard title="Citas activas" value={overview.activeAppointments || 0} icon={Calendar} />
            <HeroMiniCard title="Saldo disponible" value={`$${Number(overview.availableBalance || 0).toLocaleString('es-CO')}`} icon={Wallet} />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="min-w-0 rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col items-center gap-3 text-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Resumen Comercial</h2>
              <p className="mt-1 text-sm text-slate-500">Tu impacto real dentro del flujo de atención.</p>
            </div>
            <button
              onClick={onGoToCodes}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Abrir códigos
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <motion.div
            variants={gridStagger}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <MetricCard title="Comisión total" value={`$${Number(overview.totalCommissions || 0).toLocaleString('es-CO')}`} subtitle="Histórico generado" icon={Wallet} tone="blue" reduce={reduce} />
            <MetricCard title="Liquidada" value={`$${Number(overview.liquidatedCommissions || 0).toLocaleString('es-CO')}`} subtitle="Disponible para retiro" icon={CheckCircle2} tone="emerald" reduce={reduce} />
            <MetricCard title="Pendiente" value={`$${Number(overview.pendingCommissions || 0).toLocaleString('es-CO')}`} subtitle="En curso de liquidación" icon={Clock3} tone="amber" reduce={reduce} />
          </motion.div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-bold text-slate-950">Comisiones Recientes</h2>
            <p className="mt-1 text-sm text-slate-500">Últimos movimientos asociados a tus referidos.</p>
          </div>
          {commissions.length === 0 ? (
            <EmptyState title="Sin comisiones recientes" description="Cuando una cita vinculada se pague, el movimiento aparecerá aquí." />
          ) : (
            <div className="space-y-4">
              {commissions.map((commission: any) => (
                <div key={commission.id} className="rounded-[22px] bg-slate-50 p-4 text-center">
                  <p className="font-semibold text-slate-900">{commission.patient}</p>
                  <p className="mt-1 text-sm text-slate-500">{commission.code || 'Sin código visible'} · {new Date(commission.appointmentAt).toLocaleDateString('es-CO')}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
                    <StatusBadge status={commission.status} />
                    <span className="font-bold text-emerald-600">${Number(commission.amount || 0).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function ActionChip({ label, icon: Icon, onClick, reduce }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2.5 text-xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-xs text-blue-50">{title}</p>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, tone = 'blue', reduce }: any) {
  return (
    <motion.div
      variants={gridItem}
      whileHover={reduce ? undefined : { y: -4 }}
      className="flex flex-col items-center rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-[0_12px_36px_rgba(37,99,235,0.06)]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${metricTones[tone]} text-white shadow-md`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
    </motion.div>
  );
}
