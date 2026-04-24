import { CheckCircle, ClipboardList, ShieldCheck, XCircle } from 'lucide-react';
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
      setError(err instanceof Error ? err.message : 'No fue posible cargar medicos en revision.');
    } finally {
      setIsLoading(false);
    }
  }

  async function approve(doctorId: string) {
    setMessage('');
    try {
      await api.approveDoctor(doctorId);
      setMessage('Medico aprobado correctamente. Ya aparece en la busqueda publica.');
      await loadDoctors();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible aprobar el medico.');
    }
  }

  async function reject(doctorId: string) {
    setMessage('');
    try {
      await api.rejectDoctor(doctorId, { reason: 'Rechazado desde panel administrativo' });
      setMessage('Medico rechazado correctamente.');
      await loadDoctors();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible rechazar el medico.');
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  if (isLoading) return <LoadingState label="Cargando revision medica..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <ShieldCheck className="h-4 w-4" />
              Validacion operativa de medicos
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Revision medica</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Centraliza aprobaciones, rechazos y control de documentacion en un flujo claro y responsable para el equipo administrador.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Pendientes" value={doctors.length} icon={ClipboardList} />
            <HeroMiniCard title="Decision requerida" value={doctors.length > 0 ? 'Si' : 'No'} icon={ShieldCheck} />
          </div>
        </div>
      </section>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      {doctors.length === 0 ? (
        <EmptyState title="Sin medicos pendientes" description="Cuando un medico cargue documentos aparecera aqui para revision." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doctor.firstName} {doctor.lastName}</h3>
                  <p className="mt-1 text-sm text-gray-600">Registro medico: {doctor.medicalLicenseNumber}</p>
                  <p className="text-sm text-gray-600">Ciudad: {doctor.city}</p>
                </div>
                <StatusBadge status={doctor.validationStatus} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
                <ClipboardList className="h-4 w-4" />
                {doctor.documentsCount} documento(s) cargado(s)
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => approve(doctor.id)} className="flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </button>
                <button onClick={() => reject(doctor.id)} className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50">
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

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="rounded-2xl bg-white/16 p-3 text-white w-fit">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
