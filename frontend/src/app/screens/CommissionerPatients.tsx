import { Calendar, Mail, Phone, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

export function CommissionerPatients({ onSchedulePatient }: { onSchedulePatient: (patientId: string) => void }) {
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
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
            <ShieldCheck className="h-4 w-4" />
            Seguimiento con contexto
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Pacientes vinculados</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
            Consulta proximas citas y un resumen clinico basico de los usuarios vinculados a tus codigos para acompañarlos mejor.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Buscar paciente</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </label>
          <button onClick={loadPatients} className="self-end rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Aplicar filtro</button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {patients.length === 0 ? (
        <EmptyState title="Sin pacientes vinculados" description="Cuando un usuario use tu codigo o tenga citas contigo como apoyo, aparecera aqui." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {patients.map((patient) => (
            <article key={patient.patientId} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{patient.patient}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {patient.authorizesCommissionAgentChat ? 'Autorizo apoyo del comisionista en chat' : 'Sin autorizacion para chat'}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {patient.completedAppointments} completadas
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  {patient.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  {patient.phone || 'Sin telefono'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {patient.nextAppointmentAt ? `Proxima cita: ${new Date(patient.nextAppointmentAt).toLocaleString('es-CO')} con ${patient.nextDoctor}` : 'Sin cita proxima'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryBlock title="Historia basica" value={patient.medicalRecordsCount} subtitle={patient.latestAssessment || 'Sin analisis reciente'} />
                <SummaryBlock title="Plan reciente" value={patient.nextAppointmentStatus || 'Sin agenda'} subtitle={patient.latestPlan || 'Sin plan visible'} />
              </div>

              <button onClick={() => onSchedulePatient(patient.patientId)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                <Calendar className="h-4 w-4" />
                Agendar cita
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBlock({ title, value, subtitle }: any) {
  return (
    <div className="rounded-[20px] bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}
