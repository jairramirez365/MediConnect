import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function DoctorAppointments({ onOpenVideoConsultation }: { onOpenVideoConsultation?: (appointmentId: string) => void }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadAppointments() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.appointments({ limit: 20 });
      setAppointments(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmAppointment(id: string) {
    await api.confirmAppointment(id);
    await loadAppointments();
  }

  async function completeAppointment(id: string) {
    await api.completeAppointment(id);
    await loadAppointments();
  }

  async function cancelAppointment(id: string) {
    await api.cancelAppointment(id, { cancellationReason: 'Cancelada por medico desde frontend' });
    await loadAppointments();
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  if (isLoading) return <LoadingState label="Cargando gestion de citas medicas..." />;
  if (error) return <ErrorState message={error} />;

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No tienes citas asignadas"
        description="Cuando un paciente agende contigo, la consulta aparecera aqui para que la confirmes o la completes."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_58%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <h2 className="text-4xl font-black tracking-[-0.05em] md:text-5xl">Gestion de citas</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
          Confirma, cancela o completa consultas usando la maquina de estados del backend.
        </p>
      </section>

      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      {new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{appointment.patient}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{appointment.reason}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {appointment.status === 'pendiente_confirmacion' && (
                        <button
                          onClick={() => confirmAppointment(appointment.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmar
                        </button>
                      )}
                      {['pendiente_confirmacion', 'confirmada'].includes(appointment.status) && (
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      {appointment.status === 'confirmada' && (
                        <button
                          onClick={() => onOpenVideoConsultation?.(appointment.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Videoconsulta
                        </button>
                      )}
                      {appointment.status === 'confirmada' && (
                        <button
                          onClick={() => completeAppointment(appointment.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Completar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
