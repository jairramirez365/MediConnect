import { Calendar, FileText, Pill } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PatientHistory({ selectedAppointmentId }: { selectedAppointmentId?: string | null }) {
  const reduce = useReducedMotion();
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClinicalData() {
      try {
        const [recordsResponse, prescriptionsResponse, appointmentsResponse] = await Promise.all([
          api.medicalRecords(),
          api.prescriptions(),
          api.appointments({ status: 'completada', limit: 20 })
        ]);
        setRecords(recordsResponse.data || []);
        setPrescriptions(prescriptionsResponse.data || []);
        setCompletedAppointments(appointmentsResponse.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar la historia clínica.');
      } finally {
        setIsLoading(false);
      }
    }

    loadClinicalData();
  }, []);

  const clinicalEntries = useMemo(() => {
    const entries = completedAppointments.map((appointment) => {
      const note = records.flatMap((record) => record.notes || []).find((entry: any) => entry.appointmentId === appointment.id);
      const prescription = prescriptions.find((entry) => entry.appointmentId === appointment.id);

      return {
        appointment,
        note,
        prescription
      };
    });

    if (!selectedAppointmentId) {
      return entries;
    }

    return entries.sort((left, right) => {
      if (left.appointment.id === selectedAppointmentId) return -1;
      if (right.appointment.id === selectedAppointmentId) return 1;
      return 0;
    });
  }, [completedAppointments, prescriptions, records, selectedAppointmentId]);

  if (isLoading) return <LoadingState label="Cargando historia clínica..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#047857_0%,_#0d9488_45%,_#0891b2_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(13,148,136,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <FileText className="h-4 w-4" />
            Resumen clínico por cita
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Toda tu información clínica se organiza alrededor de cada consulta completada.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-emerald-50 md:text-base">
            Esta vista resume el recorrido de tus citas finalizadas y los documentos clínicos asociados sin separar artificialmente recetas y observaciones.
          </p>
        </div>
      </motion.section>

      {clinicalEntries.length === 0 ? (
        <EmptyState title="Sin consultas completadas" description="Cuando termines tus citas, aquí verás un resumen clínico agrupado por consulta." />
      ) : (
        <div className="space-y-4">
          {clinicalEntries.map(({ appointment, note, prescription }) => (
            <section key={appointment.id} className={`rounded-[28px] border bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${appointment.id === selectedAppointmentId ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200/80'}`}>
              <div className="flex flex-col items-center gap-3 text-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{appointment.doctor}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.doctorSpecialties?.join(', ') || 'Especialidad registrada'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(appointment.scheduledStartAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
                  {String(appointment.status || '').replaceAll('_', ' ')}
                </span>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[22px] bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <p className="font-semibold">Observaciones médicas</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {note
                      ? `${note.assessment || 'Sin análisis'}${note.plan ? ` · Plan: ${note.plan}` : ''}`
                      : 'Esta consulta aún no tiene nota clínica visible.'}
                  </p>
                </div>

                <div className="rounded-[22px] bg-cyan-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                      <Pill className="h-4 w-4" />
                    </span>
                    <p className="font-semibold">Receta asociada</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {prescription
                      ? `${prescription.items?.length || 0} medicamento(s) formulados${prescription.generalInstructions ? ` · ${prescription.generalInstructions}` : ''}`
                      : 'No se registró receta médica para esta consulta.'}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
