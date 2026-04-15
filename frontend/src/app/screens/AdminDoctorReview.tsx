import { CheckCircle, ClipboardList, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

export function AdminDoctorReview() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadDoctors() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.pendingDoctors();
      setDoctors(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar médicos en revisión.');
    } finally {
      setIsLoading(false);
    }
  }

  async function approve(doctorId: string) {
    setMessage('');
    try {
      await api.approveDoctor(doctorId);
      setMessage('Médico aprobado correctamente. Ya aparece en la búsqueda pública.');
      await loadDoctors();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible aprobar el médico.');
    }
  }

  async function reject(doctorId: string) {
    setMessage('');
    try {
      await api.rejectDoctor(doctorId, { reason: 'Rechazado desde panel administrativo' });
      setMessage('Médico rechazado correctamente.');
      await loadDoctors();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible rechazar el médico.');
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  if (isLoading) return <LoadingState label="Cargando revisión médica..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Revisión Médica</h2>
        <p className="mt-1 text-gray-600">Solo el administrador puede aprobar o rechazar médicos.</p>
      </div>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      {doctors.length === 0 ? (
        <EmptyState title="Sin médicos pendientes" description="Cuando un médico cargue documentos aparecerá aquí." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doctor.firstName} {doctor.lastName}</h3>
                  <p className="mt-1 text-sm text-gray-600">Registro médico: {doctor.medicalLicenseNumber}</p>
                  <p className="text-sm text-gray-600">Ciudad: {doctor.city}</p>
                </div>
                <StatusBadge status={doctor.validationStatus} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <ClipboardList className="h-4 w-4" />
                {doctor.documentsCount} documento(s) cargado(s)
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => approve(doctor.id)} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </button>
                <button onClick={() => reject(doctor.id)} className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
