import { CheckCircle2, Copy, Plus, Search, Share2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

export function CommissionerCodes({ onGoToPatients }: { onGoToPatients: () => void }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadCodes() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.commissionerCodes(filters);
      setCodes(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los codigos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function createCode() {
    try {
      const response = await api.createCommissionerCode();
      setMessage(`Nuevo codigo generado: ${response.data.code}`);
      await loadCodes();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible generar el codigo.');
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setMessage(`Codigo ${code} copiado al portapapeles.`);
  }

  useEffect(() => {
    loadCodes();
  }, []);

  const totalGenerated = useMemo(
    () => codes.reduce((sum, code) => sum + Number(code.generatedCommission || 0), 0),
    [codes]
  );

  if (isLoading) return <LoadingState label="Cargando codigos de referencia..." />;
  if (error && !codes.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <CheckCircle2 className="h-4 w-4" />
              Codigos de seguimiento reales
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Codigos de referencia</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Cada codigo se genera con formato unico `C-######` y te permite vincular pacientes, citas y comisiones sobre datos reales.
            </p>
          </div>
          <button onClick={createCode} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50">
            <Plus className="h-4 w-4" />
            Generar codigo
          </button>
        </div>
      </section>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar codigo</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <button onClick={loadCodes} className="self-end rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Aplicar filtros</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Codigos visibles" value={codes.length} />
        <MetricCard title="Pacientes vinculados" value={codes.reduce((sum, code) => sum + Number(code.linkedPatients || 0), 0)} />
        <MetricCard title="Comision generada" value={`$${totalGenerated.toLocaleString('es-CO')}`} />
      </section>

      {codes.length === 0 ? (
        <EmptyState title="Sin codigos para esos filtros" description="Genera tu primer codigo o ajusta los filtros para continuar." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {codes.map((code) => (
            <article key={code.id} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-2xl font-black text-blue-700">{code.code}</p>
                  <p className="mt-2 text-sm text-slate-500">Expira: {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('es-CO') : 'Sin fecha'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${code.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {code.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatBox label="Pacientes" value={code.linkedPatients} />
                <StatBox label="Citas" value={code.appointmentsCount} />
                <StatBox label="Comision" value={`$${Number(code.generatedCommission || 0).toLocaleString('es-CO')}`} />
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => copyCode(code.code)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
                <button onClick={() => navigator.clipboard.writeText(`Usa mi codigo ${code.code} en MediConnect`)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
                <button onClick={onGoToPatients} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800">
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value }: any) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
    </div>
  );
}

function StatBox({ label, value }: any) {
  return (
    <div className="rounded-[20px] bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
