import { Calendar, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
    await api.deleteAvailability(id);
    await loadAvailability();
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  if (isLoading) return <LoadingState label="Cargando agenda..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi Agenda</h2>
        <p className="mt-1 text-gray-600">Configura bloques reales de disponibilidad para que pacientes puedan agendar.</p>
      </div>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      <form onSubmit={createAvailability} className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Plus className="h-5 w-5 text-blue-600" />
          Nuevo bloque disponible
        </h3>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-700">Día</span>
            <select name="dayOfWeek" className="w-full rounded-lg border border-gray-300 px-3 py-2">
              {weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>
          <Field name="startTime" label="Inicio" type="time" required />
          <Field name="endTime" label="Fin" type="time" required />
          <Field name="slotDurationMinutes" label="Duración" type="number" defaultValue="60" required />
          <Field name="validFrom" label="Vigente desde" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <button className="self-end rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            Crear
          </button>
        </div>
      </form>

      {availability.length === 0 ? (
        <EmptyState title="Sin disponibilidad" description="Crea al menos un bloque para que aparezcan slots públicos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availability.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{weekDays[item.dayOfWeek]}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.startTime} - {item.endTime}</p>
                  <p className="mt-2 text-xs text-gray-500">{item.slotDurationMinutes} minutos por consulta</p>
                </div>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <button onClick={() => deleteAvailability(item.id)} className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50">
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
      <input {...inputProps} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
    </label>
  );
}
