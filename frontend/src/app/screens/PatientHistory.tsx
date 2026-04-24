import { Calendar, FileText, Pill } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

export function PatientHistory({ selectedAppointmentId }: { selectedAppointmentId?: string | null }) {
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
        setError(err instanceof Error ? err.message : 'No fue posible cargar la historia clinica.');
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

  if (isLoading) return <LoadingState label="Cargando historia clinica..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
        <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
            <FileText className="h-4 w-4" />
            Resumen clinico por cita
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Toda tu informacion clinica se organiza alrededor de cada consulta completada.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Esta vista resume el recorrido de tus citas finalizadas y los documentos clinicos asociados sin separar artificialmente recetas y observaciones.
          </p>
        </div>
      </section>

      {clinicalEntries.length === 0 ? (
        <EmptyState title="Sin consultas completadas" description="Cuando termines tus citas, aqui veras un resumen clinico agrupado por consulta." />
      ) : (
        <div className="space-y-4">
          {clinicalEntries.map(({ appointment, note, prescription }) => (
            <section key={appointment.id} className={`rounded-[28px] border bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${appointment.id === selectedAppointmentId ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200/80'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{appointment.doctor}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.doctorSpecialties?.join(', ') || 'Especialidad registrada'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(appointment.scheduledStartAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {appointment.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[22px] bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="font-semibold">Observaciones medicas</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {note
                      ? `${note.assessment || 'Sin analisis'}${note.plan ? ` · Plan: ${note.plan}` : ''}`
                      : 'Esta consulta aun no tiene nota clinica visible.'}
                  </p>
                </div>

                <div className="rounded-[22px] bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Pill className="h-4 w-4 text-blue-600" />
                    <p className="font-semibold">Receta asociada</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {prescription
                      ? `${prescription.items?.length || 0} medicamento(s) formulados${prescription.generalInstructions ? ` · ${prescription.generalInstructions}` : ''}`
                      : 'No se registro receta medica para esta consulta.'}
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
