import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, ClipboardList, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

export function AdminDoctorReview() {
  const reduce = useReducedMotion();
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
            Validación operativa de médicos
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">Revisión Médica</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-cyan-50 md:text-base">
            Centraliza aprobaciones, rechazos y control de documentación en un flujo claro y responsable para el equipo administrador.
          </p>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3">
            <HeroMiniCard title="Pendientes" value={doctors.length} icon={ClipboardList} />
            <HeroMiniCard title="Decisión requerida" value={doctors.length > 0 ? 'Sí' : 'No'} icon={ShieldCheck} />
          </div>
        </div>
      </motion.section>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      {doctors.length === 0 ? (
        <EmptyState title="Sin médicos pendientes" description="Cuando un médico cargue documentos aparecerá aquí para revisión." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doctor.firstName} {doctor.lastName}</h3>
                  <p className="mt-1 text-sm text-gray-600">Registro médico: {doctor.medicalLicenseNumber}</p>
                  <p className="text-sm text-gray-600">Ciudad: {doctor.city}</p>
                </div>
                <StatusBadge status={doctor.validationStatus} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                  <ClipboardList className="h-5 w-5" />
                </div>
                {doctor.documentsCount} documento(s) cargado(s)
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => approve(doctor.id)}
                  className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => reject(doctor.id)}
                  className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                >
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
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-xs text-cyan-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
