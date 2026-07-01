import { CalendarDays, DollarSign, Search, ShieldCheck, Star, MapPin, BriefcaseMedical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

type Doctor = {
  id: string;
  nombres: string;
  apellidos: string;
  ciudad: string;
  careMode: string;
  consultationFee: string;
  ratingAverage: string;
  yearsOfExperience: number;
  professionalBio: string;
  specialties: string[];
};

type SearchForm = {
  specialty: string;
  city: string;
  minRating: string;
  minYearsExperience: string;
  date: string;
  jornada: string;
};

type PatientSearchDoctorsProps = {
  onViewDoctor: (doctorId: string) => void;
  onBookAppointment: (doctorId?: string | null) => void;
};

const initialForm: SearchForm = {
  specialty: '',
  city: '',
  minRating: '',
  minYearsExperience: '',
  date: '',
  jornada: ''
};

export function PatientSearchDoctors({ onViewDoctor, onBookAppointment }: PatientSearchDoctorsProps) {
  const [catalogDoctors, setCatalogDoctors] = useState<Doctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<SearchForm>(initialForm);
  const reduce = useReducedMotion();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  async function loadCatalog() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.doctors({ limit: 100 });
      const rows = response.data || [];
      setCatalogDoctors(rows);
      setDoctors(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar medicos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function applyFilters() {
    setIsFiltering(true);
    setError('');

    try {
      const response = await api.doctors({
        specialty: form.specialty,
        city: form.city,
        minRating: form.minRating,
        minYearsExperience: form.minYearsExperience,
        limit: 100
      });
      let filteredDoctors = response.data || [];

      if (form.date || form.jornada) {
        const date = form.date || new Date().toISOString().slice(0, 10);
        const availabilityResponses = await Promise.all(
          filteredDoctors.map(async (doctor) => {
            const availability = await api.doctorAvailability(doctor.id, { date });
            const slots = (availability.data?.slots || []).filter((slot: any) => {
              if (!slot.isAvailable) return false;
              const hour = new Date(slot.startAt).getHours();
              if (form.jornada === 'manana') return hour < 12;
              if (form.jornada === 'tarde') return hour >= 12;
              return true;
            });

            return {
              doctor,
              slots
            };
          })
        );

        filteredDoctors = availabilityResponses
          .filter((item) => item.slots.length > 0)
          .map((item) => ({
            ...item.doctor,
            nextSlots: item.slots.slice(0, 3)
          }));
      }

      setDoctors(filteredDoctors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible aplicar filtros.');
    } finally {
      setIsFiltering(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  const specialties = useMemo(
    () => Array.from(new Set(catalogDoctors.flatMap((doctor) => doctor.specialties || []).filter(Boolean))).sort(),
    [catalogDoctors]
  );
  const cities = useMemo(
    () => Array.from(new Set(catalogDoctors.map((doctor) => doctor.ciudad).filter(Boolean))).sort(),
    [catalogDoctors]
  );
  const ratings = useMemo(
    () =>
      Array.from(
        new Set(
          catalogDoctors
            .map((doctor) => Number(doctor.ratingAverage || 0))
            .filter((value) => value > 0)
            .map((value) => value.toFixed(1))
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [catalogDoctors]
  );
  const yearsExperience = useMemo(
    () =>
      Array.from(
        new Set(catalogDoctors.map((doctor) => Number(doctor.yearsOfExperience || 0)).filter((value) => value > 0))
      ).sort((a, b) => a - b),
    [catalogDoctors]
  );

  if (isLoading) return <LoadingState label="Buscando médicos activos..." />;
  if (error && !doctors.length) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1e40af_0%,_#0284c7_45%,_#0891b2_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(2,132,199,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Búsqueda médica guiada
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Encuentra al especialista ideal para tu siguiente consulta</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-cyan-50 md:text-base">
            Filtra por especialidad, ciudad, calificación y experiencia. Cada opción viene de información real disponible en la plataforma.
          </p>

          <div className="mt-6 w-full max-w-3xl rounded-[28px] border border-white/20 bg-white/15 p-5 text-left backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              <FilterSelect
                label="Especialidad"
                value={form.specialty}
                onChange={(value) => setForm((current) => ({ ...current, specialty: value }))}
                options={specialties}
              />
              <FilterSelect
                label="Ciudad"
                value={form.city}
                onChange={(value) => setForm((current) => ({ ...current, city: value }))}
                options={cities}
              />
              <FilterSelect
                label="Calificación mínima"
                value={form.minRating}
                onChange={(value) => setForm((current) => ({ ...current, minRating: value }))}
                options={ratings.map((rating) => `${rating}+`)}
                optionValues={ratings}
              />
              <FilterSelect
                label="Experiencia mínima"
                value={form.minYearsExperience}
                onChange={(value) => setForm((current) => ({ ...current, minYearsExperience: value }))}
                options={yearsExperience.map((years) => `${years} años`)}
                optionValues={yearsExperience.map(String)}
              />
              <FilterInput
                label="Fecha disponible"
                type="date"
                value={form.date}
                onChange={(value) => setForm((current) => ({ ...current, date: value }))}
              />
              <FilterSelect
                label="Jornada"
                value={form.jornada}
                onChange={(value) => setForm((current) => ({ ...current, jornada: value }))}
                options={['Mañana', 'Tarde']}
                optionValues={['manana', 'tarde']}
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={applyFilters}
                disabled={isFiltering}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                Buscar filtros
              </button>
              <button
                onClick={() => {
                  setForm(initialForm);
                  setDoctors(catalogDoctors);
                }}
                className="min-h-[44px] rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {doctors.length === 0 ? (
        <EmptyState title="No hay médicos activos" description="Ajusta tus filtros o limpia la búsqueda para volver a explorar especialistas." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-[28px] border border-white/80 bg-white/92 p-6 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_20px_60px_rgba(37,99,235,0.10)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-sky-400 text-xl font-bold text-white">
                    {doctor.nombres?.charAt(0) || 'M'}
                  </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">Dr(a). {doctor.nombres} {doctor.apellidos}</h3>
                        <p className="mt-1 text-sm font-medium text-blue-600">{doctor.specialties?.join(', ') || 'Especialidad activa'}</p>
                      </div>
                    </div>
                <div className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  <Star className="h-4 w-4 fill-current" />
                  {Number(doctor.ratingAverage || 0).toFixed(1)}
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                {doctor.professionalBio || 'Perfil profesional disponible para ayudarte a tomar una decisión informada.'}
              </p>

              <div className="my-5 space-y-3 text-sm">
                <Info icon={MapPin} label="Ciudad" value={doctor.ciudad || 'No registrada'} />
                <Info icon={DollarSign} label="Consulta" value={`$${Number(doctor.consultationFee || 0).toLocaleString('es-CO')}`} />
                <Info icon={BriefcaseMedical} label="Experiencia" value={`${Number(doctor.yearsOfExperience || 0)} años`} />
              </div>

              {doctor.nextSlots?.length ? (
                <div className="mb-5 rounded-[20px] bg-blue-50/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Disponibilidad encontrada</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doctor.nextSlots.map((slot: any) => (
                      <span key={slot.startAt} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                        {new Date(slot.startAt).toLocaleDateString('es-CO')} {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onViewDoctor(doctor.id)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Ver perfil
                </button>
                <button
                  onClick={() => onBookAppointment(doctor.id)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                >
                  Agendar cita
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  optionValues,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  optionValues?: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/90">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/30 bg-white/18 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/40"
      >
        <option value="" className="text-slate-900">Todos</option>
        {options.map((option, index) => (
          <option
            key={`${label}-${option}`}
            value={optionValues?.[index] ?? option}
            className="text-slate-900"
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterInput({
  label,
  value,
  type,
  onChange
}: {
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/90">{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/30 bg-white/18 py-3 pl-11 pr-4 text-white outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>
    </label>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-right font-medium capitalize text-slate-900">{value}</span>
    </div>
  );
}
