import { Calendar, DollarSign, MapPin, Star, Stethoscope, BriefcaseMedical, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

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
        setError(err instanceof Error ? err.message : 'No fue posible cargar el perfil del medico.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDoctor();
  }, [doctorId]);

  if (isLoading) return <LoadingState label="Cargando perfil del medico..." />;
  if (error) return <ErrorState message={error} />;
  if (!doctor) {
    return (
      <EmptyState
        title="Selecciona un medico"
        description="Abre un especialista desde la busqueda para ver su perfil completo y avanzar al agendamiento."
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBackToSearch}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a busqueda
      </button>

      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/16 text-3xl font-bold text-white">
              {doctor.nombres?.charAt(0) || 'M'}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              Dr(a). {doctor.nombres} {doctor.apellidos}
            </h1>
            <p className="mt-3 text-lg font-semibold text-blue-50">
              {doctor.specialties?.join(', ') || 'Especialidad activa'}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              {doctor.professionalBio || 'Perfil profesional disponible en MediConnect.'}
            </p>
            <button
              onClick={() => onBookAppointment(doctor.id)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4" />
              Agendar con este medico
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard icon={Star} title="Calificacion" value={Number(doctor.ratingAverage || 0).toFixed(1)} />
            <SummaryCard icon={BriefcaseMedical} title="Experiencia" value={`${doctor.yearsOfExperience || 0} años`} />
            <SummaryCard icon={MapPin} title="Ciudad" value={doctor.ciudad || 'No registrada'} />
            <SummaryCard icon={DollarSign} title="Consulta" value={`$${Number(doctor.consultationFee || 0).toLocaleString('es-CO')}`} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Proximos horarios disponibles</h2>
            <p className="mt-1 text-sm text-slate-500">Vista rapida para que sepas si quieres avanzar al agendamiento ahora mismo.</p>
          </div>
          <button
            onClick={() => onBookAppointment(doctor.id)}
            className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Ir a agendar
          </button>
        </div>

        {slots.length === 0 ? (
          <EmptyState title="Sin slots visibles" description="Este especialista no tiene espacios libres en los proximos dias." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => (
              <div key={slot.startAt} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-900">{new Date(slot.startAt).toLocaleDateString('es-CO')}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value }: any) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="w-fit rounded-2xl bg-white/16 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
