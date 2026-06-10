import { AlertCircle, Calendar, CheckCircle2, CreditCard, ExternalLink, Landmark, Receipt, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function PatientPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [payableAppointments, setPayableAppointments] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [checkout, setCheckout] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadPayments() {
    setIsLoading(true);
    setError('');

    try {
      const [summaryResponse, paymentsResponse, payableResponse] = await Promise.all([
        api.paymentsSummary(),
        api.payments(filters),
        api.payableAppointments()
      ]);

      setSummary(summaryResponse.data || null);
      setPayments(paymentsResponse.data || []);
      setPayableAppointments(payableResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar tu panel de pagos.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const pendingTransactions = useMemo(
    () => payments.filter((payment) => ['pendiente', 'autorizado'].includes(payment.status)),
    [payments]
  );

  async function startPseCheckout(appointmentId: string) {
    try {
      setMessage('');
      const response = await api.createPseCheckout(appointmentId, { currency: 'COP' });
      setCheckout(response.data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible iniciar el pago PSE.');
    }
  }

  async function simulateSuccess() {
    if (!checkout?.payment?.id) {
      return;
    }

    try {
      const response = await api.simulatePaymentSuccess(checkout.payment.id, {
        providerReference: checkout.checkout?.reference
      });
      setMessage(`Pago confirmado correctamente. Estado actual: ${response.data.payment.status}.`);
      setCheckout(null);
      await loadPayments();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible confirmar el pago.');
    }
  }

  if (isLoading) return <LoadingState label="Cargando panel de pagos..." />;
  if (error && !summary) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <Landmark className="h-4 w-4" />
              Pagos conectados
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Tus pagos y consultas</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Revisa el estado de tus transacciones, identifica citas pendientes de pago y avanza por un checkout preparado para integracion PSE.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Pagado" value={`$${Number(summary?.paidAmount || 0).toLocaleString('es-CO')}`} icon={Wallet} />
            <HeroMiniCard title="Pendiente" value={`$${Number(summary?.pendingAmount || 0).toLocaleString('es-CO')}`} icon={CreditCard} />
            <HeroMiniCard title="Saldo a favor" value={`$${Number(summary?.availableBalance || 0).toLocaleString('es-CO')}`} icon={CheckCircle2} />
            <HeroMiniCard title="Citas pagables" value={summary?.payableAppointmentsCount || payableAppointments.length} icon={Calendar} />
          </div>
        </div>
      </section>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}
      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Citas pendientes de pago</h2>
              <p className="mt-1 text-sm text-slate-500">Todos los pagos se procesan por PSE y confirman el preagendamiento.</p>
            </div>
          </div>

          {payableAppointments.length === 0 ? (
            <EmptyState title="Sin citas por pagar" description="Tus consultas programadas ya fueron atendidas en pagos o aun no requieren transaccion." />
          ) : (
            <div className="space-y-4">
              {payableAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{appointment.doctor}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(appointment.scheduledStartAt).toLocaleString('es-CO')} · {appointment.appointmentType}
                      </p>
                      <p className="mt-2 text-xs text-amber-700">
                        {appointment.paymentExpiresAt
                          ? `Reserva temporal hasta ${new Date(appointment.paymentExpiresAt).toLocaleString('es-CO')}.`
                          : 'Pago pendiente por confirmar.'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <StatusBadge status={appointment.status} />
                        <StatusBadge status={appointment.paymentStatus} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                        ${Number(appointment.amount || 0).toLocaleString('es-CO')}
                      </p>
                      <button
                        onClick={() => startPseCheckout(appointment.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Iniciar pago PSE
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Actividad reciente</h2>
                <p className="mt-1 text-sm text-slate-500">Tus ultimas transacciones y su estado operativo.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                {payments.length} movimientos
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="Pagos realizados" value={summary?.paidTransactions || 0} subtitle="Transacciones exitosas" />
              <MetricCard title="Pendientes" value={summary?.pendingTransactions || pendingTransactions.length} subtitle="En validacion o por confirmar" />
              <MetricCard title="PSE" value={summary?.pseTransactions || 0} subtitle="Transacciones preparadas por pasarela" />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <FilterInput label="Buscar" value={filters.search} onChange={(value) => setFilters((current) => ({ ...current, search: value }))} />
              <SelectFilter label="Estado" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={['pagado', 'pendiente', 'autorizado', 'reembolsado', 'fallido']} />
              <button onClick={loadPayments} className="self-end rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Aplicar filtro</button>
            </div>

            <div className="mt-6 space-y-4">
              {payments.length === 0 ? (
                <EmptyState title="Sin pagos registrados" description="Tus pagos confirmados y pendientes apareceran aqui cuando haya movimiento real." />
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-[22px] bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.doctor}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(payment.scheduledStartAt).toLocaleString('es-CO')} · Ref. {payment.providerReference || 'Sin referencia'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge status={payment.status} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">${Number(payment.amount || 0).toLocaleString('es-CO')}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{payment.currency}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Checkout PSE Staging</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Pago preparado para pasarela</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Esta interfaz ya usa la arquitectura de checkout. En produccion, este paso redirigira al proveedor PSE con `returnUrl` y `notifyUrl`.
                </p>
              </div>
              <button type="button" onClick={() => setCheckout(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Referencia" value={checkout.checkout?.reference || 'Sin referencia'} />
              <SummaryItem label="Proveedor" value={(checkout.checkout?.provider || 'pse').toUpperCase()} />
              <SummaryItem label="Estado" value={checkout.checkout?.status || 'pendiente'} />
              <SummaryItem label="Pago" value={`$${Number(checkout.payment?.amount || 0).toLocaleString('es-CO')}`} />
            </div>

            <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  En este entorno simulamos la respuesta de la pasarela. Cuando staging publico este disponible, este mismo contrato se podra conectar a PSE real sin cambiar la experiencia del usuario.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setCheckout(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                Volver
              </button>
              <button type="button" onClick={simulateSuccess} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Simular pago exitoso
              </button>
            </div>
          </div>
        </div>
      )}
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

function MetricCard({ title, value, subtitle }: any) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
