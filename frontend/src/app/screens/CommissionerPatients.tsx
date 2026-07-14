import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, Mail, Phone, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const listItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function CommissionerPatients({ onSchedulePatient }: { onSchedulePatient: (patientId: string) => void }) {
  const reduce = useReducedMotion();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadPatients() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.commissionerPatients({ search });
      setPatients(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar tus pacientes vinculados.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  if (isLoading) return <LoadingState label="Cargando pacientes vinculados..." />;
  if (error && !patients.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f766e_0%,_#0891b2_45%,_#1d4ed8_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(8,145,178,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Seguimiento con contexto
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Pacientes Vinculados
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-cyan-50 md:text-base">
            Consulta próximas citas y un resumen clínico básico de los usuarios vinculados a tus códigos para acompañarlos mejor.
          </p>
        </div>
      </motion.section>

      {/* SEARCH */}
      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(8,145,178,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar paciente</span>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </label>
          <button
            onClick={loadPatients}
            className="min-h-[44px] self-end rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
          >
            Aplicar filtro
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {patients.length === 0 ? (
        <EmptyState
          title="Sin pacientes vinculados"
          description="Cuando un usuario use tu código o tenga citas contigo como apoyo, aparecerá aquí."
        />
      ) : (
        <motion.div
          variants={listStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-4 lg:grid-cols-2"
        >
          {patients.map((patient) => (
            <motion.article
              key={patient.patientId}
              variants={listItem}
              whileHover={reduce ? undefined : { y: -3 }}
              className="flex flex-col items-center rounded-[28px] border border-white/80 bg-white/92 p-6 text-center shadow-[0_18px_50px_rgba(8,145,178,0.06)]"
            >
              {/* Avatar chip */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                <span className="text-xl font-black leading-none">
                  {String(patient.patient || '').charAt(0).toUpperCase()}
                </span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-slate-950">{patient.patient}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {patient.authorizesCommissionAgentChat ? 'Autorizó apoyo del gestor en chat' : 'Sin autorización para chat'}
              </p>

              <span className="mt-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                {String(patient.completedAppointments || 0)} completadas
              </span>

              <div className="mt-5 w-full space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-cyan-600" />
                  <span className="break-all">{patient.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-cyan-600" />
                  {patient.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-cyan-600" />
                  {patient.nextAppointmentAt
                    ? `Próxima cita: ${new Date(patient.nextAppointmentAt).toLocaleString('es-CO')} con ${patient.nextDoctor}`
                    : 'Sin cita próxima'}
                </div>
              </div>

              <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
                <SummaryBlock
                  title="Historia básica"
                  value={patient.medicalRecordsCount}
                  subtitle={patient.latestAssessment || 'Sin análisis reciente'}
                />
                <SummaryBlock
                  title="Plan reciente"
                  value={String(patient.nextAppointmentStatus || 'Sin agenda').replaceAll('_', ' ')}
                  subtitle={patient.latestPlan || 'Sin plan visible'}
                />
              </div>

              <button
                onClick={() => onSchedulePatient(patient.patientId)}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
              >
                <Calendar className="h-4 w-4" />
                Agendar cita
              </button>
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function SummaryBlock({ title, value, subtitle }: any) {
  return (
    <div className="rounded-[20px] bg-slate-50/80 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}
