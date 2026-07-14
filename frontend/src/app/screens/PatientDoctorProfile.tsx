import { Calendar, DollarSign, MapPin, Star, BriefcaseMedical, ArrowLeft, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

const gridStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } }
};

const statTones: Record<string, string> = {
  amber: 'from-amber-500 to-orange-600',
  blue: 'from-blue-500 to-blue-600',
  violet: 'from-violet-500 to-fuchsia-600',
  emerald: 'from-emerald-500 to-teal-600'
};

type PatientDoctorProfileProps = {
  doctorId: string | null;
  onBackToSearch: () => void;
  onBookAppointment: (doctorId?: string | null) => void;
};

export function PatientDoctorProfile({
  doctorId,
  onBackToSearch,
  onBookAppointment
}: PatientDoctorProfileProps) {
  const reduce = useReducedMotion();
  const [doctor, setDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDoctor() {
      if (!doctorId) {
        setDoctor(null);
        setSlots([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const today = new Date();
        const dateFrom = today.toISOString().slice(0, 10);
        const dateTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const [doctorResponse, availabilityResponse] = await Promise.all([
          api.doctorById(doctorId),
          api.doctorAvailability(doctorId, { dateFrom, dateTo })
        ]);

        setDoctor(doctorResponse.data || null);
        setSlots((availabilityResponse.data?.slots || []).filter((slot: any) => slot.isAvailable).slice(0, 6));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el perfil del médico.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDoctor();
  }, [doctorId]);

  if (isLoading) return <LoadingState label="Cargando perfil del médico..." />;
  if (error) return <ErrorState message={error} />;
  if (!doctor) {
    return (
      <EmptyState
        title="Selecciona un médico"
        description="Abre un especialista desde la búsqueda para ver su perfil completo y avanzar al agendamiento."
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBackToSearch}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a búsqueda
      </button>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#0891b2_50%,_#0d9488_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(8,145,178,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/20 text-4xl font-black text-white shadow-lg shadow-cyan-950/20 backdrop-blur">
            {doctor.nombres?.charAt(0) || 'M'}
          </div>
          <h1 className="mt-5 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Dr(a). {doctor.nombres} {doctor.apellidos}
          </h1>
          <p className="mt-2 text-base font-semibold text-cyan-50">
            {doctor.specialties?.join(', ') || 'Especialidad activa'}
          </p>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-cyan-50/95 md:text-base">
            {doctor.professionalBio || 'Perfil profesional disponible en MediConnect.'}
          </p>
          <motion.button
            onClick={() => onBookAppointment(doctor.id)}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-cyan-700 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Calendar className="h-4 w-4" />
            Agendar con este médico
          </motion.button>
        </div>
      </motion.section>

      <motion.section
        variants={gridStagger}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <StatCard icon={Star} title="Calificación" value={Number(doctor.ratingAverage || 0).toFixed(1)} tone="amber" reduce={reduce} />
        <StatCard icon={BriefcaseMedical} title="Experiencia" value={`${doctor.yearsOfExperience || 0} años`} tone="blue" reduce={reduce} />
        <StatCard icon={MapPin} title="Ciudad" value={doctor.ciudad || 'No registrada'} tone="violet" reduce={reduce} />
        <StatCard icon={DollarSign} title="Consulta" value={`$${Number(doctor.consultationFee || 0).toLocaleString('es-CO')}`} tone="emerald" reduce={reduce} />
      </motion.section>

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Próximos Horarios Disponibles</h2>
            <p className="mt-1 text-sm text-slate-500">Vista rápida para que sepas si quieres avanzar al agendamiento ahora mismo.</p>
          </div>
          <button
            onClick={() => onBookAppointment(doctor.id)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          >
            <Calendar className="h-4 w-4" />
            Ir a agendar
          </button>
        </div>

        {slots.length === 0 ? (
          <EmptyState title="Sin horarios visibles" description="Este especialista no tiene espacios libres en los próximos días." />
        ) : (
          <motion.div
            variants={gridStagger}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {slots.map((slot) => (
              <motion.div
                key={slot.startAt}
                variants={gridItem}
                className="flex flex-col items-center rounded-[24px] border border-cyan-100 bg-[linear-gradient(180deg,_#ecfeff,_#ffffff)] p-4 text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md shadow-cyan-600/20">
                  <Clock3 className="h-5 w-5" />
                </span>
                <p className="mt-2.5 font-bold text-slate-900">
                  {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{new Date(slot.startAt).toLocaleDateString('es-CO')}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, tone = 'blue', reduce }: any) {
  return (
    <motion.div
      variants={gridItem}
      whileHover={reduce ? undefined : { y: -4 }}
      className="flex flex-col items-center rounded-[24px] border border-white/80 bg-white/90 p-5 text-center shadow-[0_18px_50px_rgba(37,99,235,0.08)]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${statTones[tone]} text-white shadow-md`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
    </motion.div>
  );
}
