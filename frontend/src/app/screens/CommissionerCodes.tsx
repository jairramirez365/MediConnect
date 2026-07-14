import { CheckCircle2, Copy, Plus, Search, Share2, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

export function CommissionerCodes({ onGoToPatients }: { onGoToPatients: () => void }) {
  const reduce = useReducedMotion();
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
      setError(err instanceof Error ? err.message : 'No fue posible cargar los códigos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function createCode() {
    try {
      const response = await api.createCommissionerCode();
      setMessage(`Nuevo código generado: ${response.data.code}`);
      await loadCodes();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible generar el código.');
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setMessage(`Código ${code} copiado al portapapeles.`);
  }

  useEffect(() => {
    loadCodes();
  }, []);

  const totalGenerated = useMemo(
    () => codes.reduce((sum, code) => sum + Number(code.generatedCommission || 0), 0),
    [codes]
  );

  if (isLoading) return <LoadingState label="Cargando códigos de referencia..." />;
  if (error && !codes.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#7e22ce_0%,_#c026d3_45%,_#db2777_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(192,38,211,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-pink-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <CheckCircle2 className="h-4 w-4" />
            Códigos de seguimiento reales
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Códigos de Referencia
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-fuchsia-50 md:text-base">
            Cada código se genera con formato único <span className="font-mono">C-######</span> y te permite vincular pacientes, citas y comisiones sobre datos reales.
          </p>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-black text-white">{codes.length}</p>
              <p className="text-xs text-fuchsia-50">Códigos visibles</p>
            </div>
            <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-black text-white">{codes.reduce((sum, code) => sum + Number(code.linkedPatients || 0), 0)}</p>
              <p className="text-xs text-fuchsia-50">Pacientes vinculados</p>
            </div>
            <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur col-span-2 lg:col-span-2">
              <p className="text-2xl font-black text-white">${totalGenerated.toLocaleString('es-CO')}</p>
              <p className="text-xs text-fuchsia-50">Comisión generada</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={createCode}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3 font-semibold text-white transition hover:from-fuchsia-700 hover:to-pink-700 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Generar código
            </button>
          </div>
        </div>
      </motion.section>

      {message && <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-700">{message}</div>}

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(192,38,211,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar código</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-700 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100" />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100">
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <div className="flex justify-center self-end">
            <button
              onClick={loadCodes}
              className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-fuchsia-700 hover:to-pink-700 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </section>

      {codes.length === 0 ? (
        <EmptyState title="Sin códigos para esos filtros" description="Genera tu primer código o ajusta los filtros para continuar." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {codes.map((code) => (
            <article key={code.id} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(192,38,211,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-black text-fuchsia-700">{code.code}</p>
                    <p className="mt-2 text-sm text-slate-500">Expira: {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('es-CO') : 'Sin fecha'}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${code.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {String(code.isActive ? 'activo' : 'inactivo').replaceAll('_', ' ')}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatBox label="Pacientes" value={code.linkedPatients} />
                <StatBox label="Citas" value={code.appointmentsCount} />
                <StatBox label="Comisión" value={`$${Number(code.generatedCommission || 0).toLocaleString('es-CO')}`} />
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => copyCode(code.code)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-fuchsia-200 hover:text-fuchsia-700 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2">
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
                <button onClick={() => navigator.clipboard.writeText(`Usa mi código ${code.code} en MediConnect`)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-fuchsia-700 hover:to-pink-700 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
                <button onClick={onGoToPatients} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
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

function StatBox({ label, value }: any) {
  return (
    <div className="rounded-[20px] bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
