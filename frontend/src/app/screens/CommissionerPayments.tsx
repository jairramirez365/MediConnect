import { Landmark, Receipt, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function CommissionerPayments() {
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
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <Wallet className="h-4 w-4" />
              Comisiones y recaudo
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Pagos del gestor</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Consulta pagos vinculados a tus referidos, saldo disponible y comisiones liquidadas o pendientes dentro del flujo de atencion.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Saldo disponible" value={`$${Number(summary?.availableBalance || 0).toLocaleString('es-CO')}`} icon={Wallet} />
            <HeroMiniCard title="Comision liquidada" value={`$${Number(summary?.liquidatedCommissionsAmount || 0).toLocaleString('es-CO')}`} icon={Receipt} />
            <HeroMiniCard title="Pendiente de liquidar" value={`$${Number(summary?.pendingCommissionsAmount || 0).toLocaleString('es-CO')}`} icon={Landmark} />
            <HeroMiniCard title="Pagos vinculados" value={summary?.totalTransactions || 0} icon={Receipt} />
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <FilterInput label="Buscar" value={filters.search} onChange={(value: string) => setFilters((current) => ({ ...current, search: value }))} />
          <SelectFilter label="Estado" value={filters.status} onChange={(value: string) => setFilters((current) => ({ ...current, status: value }))} options={['pagado', 'pendiente', 'autorizado', 'reembolsado', 'liquidada']} />
          <button onClick={loadPayments} className="self-end rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Aplicar filtro</button>
        </div>

        <div className="mt-6 space-y-4">
          {payments.length === 0 ? (
            <EmptyState title="Sin pagos vinculados" description="Cuando una consulta referida tenga movimiento financiero, aparecera aqui con su comision asociada." />
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="rounded-[22px] bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{payment.patient}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.doctor} · {payment.referralCode || 'Sin codigo'} · {new Date(payment.scheduledStartAt).toLocaleDateString('es-CO')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={payment.status} />
                      {payment.commissionStatus && <StatusBadge status={payment.commissionStatus} />}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">${Number(payment.amount || 0).toLocaleString('es-CO')}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      Comision: ${Number(payment.commissionAmount || 0).toLocaleString('es-CO')}
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
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function SelectFilter({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
        <option value="">Todos</option>
        {options.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
