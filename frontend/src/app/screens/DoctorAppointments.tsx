import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ErrorState, LoadingState } from '../components/AsyncState';
import { AppointmentsTable } from './PatientAppointments';

export function DoctorAppointments() {
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

  async function confirmAppointment(id: string) {
    await api.confirmAppointment(id);
    await loadAppointments();
  }

  async function completeAppointment(id: string) {
    await api.completeAppointment(id);
    await loadAppointments();
  }

  async function cancelAppointment(id: string) {
    await api.cancelAppointment(id, { cancellationReason: 'Cancelada por médico desde frontend' });
    await loadAppointments();
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  if (isLoading) return <LoadingState label="Cargando citas médicas..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <AppointmentsTable
      title="Gestión de Citas"
      description="Confirma, cancela o completa citas usando la máquina de estados del backend."
      appointments={appointments}
      emptyTitle="No tienes citas asignadas"
      emptyDescription="Cuando un paciente agende contigo, aparecerá en esta tabla."
      onCancel={cancelAppointment}
      onConfirm={confirmAppointment}
      onComplete={completeAppointment}
    />
  );
}
