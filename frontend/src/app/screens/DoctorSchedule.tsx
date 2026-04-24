import { Calendar, Clock3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export function DoctorSchedule() {
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
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <ShieldCheck className="h-4 w-4" />
              Configura tu disponibilidad real
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">Agenda medico</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Define bloques de atencion, organiza tu jornada y habilita slots que luego podran ser reservados por pacientes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMiniCard title="Bloques activos" value={availability.length} icon={Calendar} />
            <HeroMiniCard title="Duracion por cita" value="20 min" icon={Clock3} />
          </div>
        </div>
      </section>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      <form onSubmit={createAvailability} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-slate-950">
          <Plus className="h-5 w-5 text-blue-600" />
          Crear nuevo bloque disponible
        </h2>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-700">Dia</span>
            <select name="dayOfWeek" className="w-full rounded-2xl border border-gray-300 px-3 py-3">
              {weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>
          <Field name="startTime" label="Inicio" type="time" required />
          <Field name="endTime" label="Fin" type="time" required />
          <Field name="slotDurationMinutes" label="Duracion" type="number" defaultValue="20" required readOnly />
          <Field name="validFrom" label="Vigente desde" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <button className="self-end rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700">
            Crear
          </button>
        </div>
      </form>

      {availability.length === 0 ? (
        <EmptyState title="Sin disponibilidad" description="Crea al menos un bloque para que aparezcan slots publicos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availability.map((item) => (
            <div key={item.id} className="rounded-[26px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{weekDays[item.dayOfWeek]}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.startTime} - {item.endTime}</p>
                  <p className="mt-2 text-xs text-gray-500">20 minutos por consulta</p>
                </div>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <button onClick={() => deleteAvailability(item.id)} className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-red-700 hover:bg-red-50">
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
    <div className="rounded-[24px] border border-white/18 bg-white/16 p-4 backdrop-blur">
      <div className="rounded-2xl bg-white/16 p-3 text-white w-fit">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-blue-50">{title}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
