import { Calendar, Clock3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function DoctorSchedule() {
  const reduce = useReducedMotion();
  const [availability, setAvailability] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadAvailability() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.listMyAvailability();
      setAvailability(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar disponibilidad.');
    } finally {
      setIsLoading(false);
    }
  }

  async function createAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('');

    try {
      await api.createAvailability({
        dayOfWeek: Number(form.get('dayOfWeek')),
        startTime: `${String(form.get('startTime'))}:00`,
        endTime: `${String(form.get('endTime'))}:00`,
        slotDurationMinutes: Number(form.get('slotDurationMinutes')),
        timeZone: 'America/Bogota',
        validFrom: String(form.get('validFrom'))
      });
      setMessage('Disponibilidad creada correctamente.');
      event.currentTarget.reset();
      await loadAvailability();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible crear disponibilidad.');
    }
  }

  async function deleteAvailability(id: string) {
    try {
      await api.deleteAvailability(id);
      await loadAvailability();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible eliminar el bloque.');
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  if (isLoading) return <LoadingState label="Cargando agenda..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f766e_0%,_#059669_45%,_#06b6d4_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(13,148,136,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Configura tu disponibilidad real
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Agenda Médica</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-emerald-50 md:text-base">
            Define bloques de atención, organiza tu jornada y habilita slots que luego podrán ser reservados por pacientes.
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            <HeroMiniCard title="Bloques activos" value={availability.length} icon={Calendar} />
            <HeroMiniCard title="Duración por cita" value="20 min" icon={Clock3} />
          </div>
        </div>
      </motion.section>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      <form onSubmit={createAvailability} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-slate-950">
          <Plus className="h-5 w-5 text-blue-600" />
          Crear nuevo bloque disponible
        </h2>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-700">Día</span>
            <select name="dayOfWeek" className="w-full rounded-2xl border border-gray-300 px-3 py-3">
              {weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>
          <Field name="startTime" label="Inicio" type="time" required />
          <Field name="endTime" label="Fin" type="time" required />
          <Field name="slotDurationMinutes" label="Duración" type="number" defaultValue="20" required readOnly />
          <Field name="validFrom" label="Vigente desde" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <button className="min-h-[48px] self-end rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
            Crear
          </button>
        </div>
      </form>

      {availability.length === 0 ? (
        <EmptyState title="Sin disponibilidad" description="Crea al menos un bloque para que aparezcan slots públicos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availability.map((item) => (
            <div key={item.id} className="flex flex-col items-center rounded-[26px] border border-white/80 bg-white/92 p-5 text-center shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-teal-600/20">
                <Calendar className="h-6 w-6" />
              </span>
              <p className="mt-3 text-lg font-bold text-gray-900">{weekDays[item.dayOfWeek]}</p>
              <p className="mt-1 text-sm text-gray-600">{item.startTime} - {item.endTime}</p>
              <p className="mt-1 text-xs text-gray-500">20 minutos por consulta</p>
              <button onClick={() => deleteAvailability(item.id)} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field(props: any) {
  const { label, ...inputProps } = props;
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <input {...inputProps} className="w-full rounded-2xl border border-gray-300 px-3 py-3" />
    </label>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2.5 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-sm text-emerald-50">{title}</p>
    </div>
  );
}
