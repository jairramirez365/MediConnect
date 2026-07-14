import { motion, useReducedMotion } from 'framer-motion';
import { Landmark, Receipt, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

export function CommissionerPayments() {
  const reduce = useReducedMotion();
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadPayments() {
    setIsLoading(true);
    setError('');

    try {
      const [summaryResponse, paymentsResponse] = await Promise.all([
        api.paymentsSummary(),
        api.payments(filters)
      ]);
      setSummary(summaryResponse.data || null);
      setPayments(paymentsResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar tu panel financiero.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  if (isLoading) return <LoadingState label="Cargando pagos del gestor..." />;
  if (error && !summary) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#047857_0%,_#0d9488_45%,_#0891b2_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(13,148,136,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Wallet className="h-4 w-4" />
            Comisiones y recaudación
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Pagos del Gestor</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-emerald-50 md:text-base">
            Consulta pagos vinculados a tus referidos, saldo disponible y comisiones liquidadas o pendientes dentro del flujo de atención.
          </p>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroMiniCard title="Saldo disponible" value={`$${Number(summary?.availableBalance || 0).toLocaleString('es-CO')}`} icon={Wallet} />
            <HeroMiniCard title="Comisión liquidada" value={`$${Number(summary?.liquidatedCommissionsAmount || 0).toLocaleString('es-CO')}`} icon={Receipt} />
            <HeroMiniCard title="Pendiente de liquidar" value={`$${Number(summary?.pendingCommissionsAmount || 0).toLocaleString('es-CO')}`} icon={Landmark} />
            <HeroMiniCard title="Pagos vinculados" value={summary?.totalTransactions || 0} icon={Receipt} />
          </div>
        </div>
      </motion.section>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(13,148,136,0.08)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <FilterInput label="Buscar" value={filters.search} onChange={(value: string) => setFilters((current) => ({ ...current, search: value }))} />
          <SelectFilter label="Estado" value={filters.status} onChange={(value: string) => setFilters((current) => ({ ...current, status: value }))} options={['pagado', 'pendiente', 'autorizado', 'reembolsado', 'liquidada']} />
          <button
            onClick={loadPayments}
            className="self-end min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Aplicar filtro
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {payments.length === 0 ? (
            <EmptyState title="Sin pagos vinculados" description="Cuando una consulta referida tenga movimiento financiero, aparecerá aquí con su comisión asociada." />
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="rounded-[22px] bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{payment.patient}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.doctor} · {payment.referralCode || 'Sin código'} · {new Date(payment.scheduledStartAt).toLocaleDateString('es-CO')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={payment.status} />
                      {payment.commissionStatus && <StatusBadge status={payment.commissionStatus} />}
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">${Number(payment.amount || 0).toLocaleString('es-CO')}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      Comisión: ${Number(payment.commissionAmount || 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs text-emerald-50">{title}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
    </label>
  );
}

function SelectFilter({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
        <option value="">Todos</option>
        {options.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
