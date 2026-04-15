import { FileText, Pill } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

export function PatientHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClinicalData() {
      try {
        const [recordsResponse, prescriptionsResponse] = await Promise.all([
          api.medicalRecords(),
          api.prescriptions()
        ]);
        setRecords(recordsResponse.data || []);
        setPrescriptions(prescriptionsResponse.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar la historia clínica.');
      } finally {
        setIsLoading(false);
      }
    }

    loadClinicalData();
  }, []);

  if (isLoading) return <LoadingState label="Cargando historia clínica..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historia Clínica</h2>
        <p className="mt-1 text-gray-600">Consulta registros y recetas disponibles para tu usuario.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <FileText className="h-5 w-5 text-blue-600" />
          Registros clínicos
        </h3>
        {records.length === 0 ? (
          <EmptyState title="Sin registros clínicos" description="Las notas aparecerán después de consultas completadas." />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{record.reason || record.motivo_consulta || 'Consulta médica'}</p>
                <p className="mt-1 text-sm text-gray-600">{record.summary || record.resumen || 'Registro clínico disponible.'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Pill className="h-5 w-5 text-blue-600" />
          Recetas
        </h3>
        {prescriptions.length === 0 ? (
          <EmptyState title="Sin recetas" description="Cuando un médico genere una receta, quedará visible aquí." />
        ) : (
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">Receta {prescription.id}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Fecha: {new Date(prescription.createdAt || prescription.created_at || Date.now()).toLocaleDateString('es-CO')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
