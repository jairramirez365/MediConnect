import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadAppointments() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.appointments({ limit: 20 });
      setAppointments(response.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      await api.cancelAppointment(id, { cancellationReason: 'Cancelada desde frontend' });
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cancelar la cita.');
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  if (isLoading) return <LoadingState label="Cargando citas..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <AppointmentsTable
      title="Mis Citas"
      description="Consulta tus citas reales registradas en el backend."
      appointments={appointments}
      emptyTitle="Todavía no tienes citas"
      emptyDescription="Busca un médico activo y agenda desde los slots disponibles."
      onCancel={cancelAppointment}
    />
  );
}

export function AppointmentsTable({ title, description, appointments, emptyTitle, emptyDescription, onCancel, onConfirm, onComplete }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Médico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment: any) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {new Date(appointment.scheduledStartAt).toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{appointment.patient}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{appointment.doctor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.reason}</td>
                    <td className="px-6 py-4"><StatusBadge status={appointment.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {onConfirm && appointment.status === 'pendiente_confirmacion' && (
                          <button onClick={() => onConfirm(appointment.id)} className="rounded-lg p-2 text-green-700 hover:bg-green-50">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {onComplete && appointment.status === 'confirmada' && (
                          <button onClick={() => onComplete(appointment.id)} className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
                            Completar
                          </button>
                        )}
                        {onCancel && ['pendiente_confirmacion', 'confirmada'].includes(appointment.status) && (
                          <button onClick={() => onCancel(appointment.id)} className="rounded-lg p-2 text-red-700 hover:bg-red-50">
                            <XCircle className="h-4 w-4" />
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
      )}
    </div>
  );
}
