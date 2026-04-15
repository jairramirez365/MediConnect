import { Calendar, DollarSign, MapPin, Search, Star, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

type Doctor = {
  id: string;
  nombres: string;
  apellidos: string;
  ciudad: string;
  careMode: string;
  consultationFee: string;
  ratingAverage: string;
  specialties: string[];
};

export function PatientSearchDoctors() {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [query, setQuery] = useState({ specialty: '', city: '' });
  const [reason, setReason] = useState('Consulta general');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);

  async function loadDoctors() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.doctors({ ...query, limit: 12 });
      setDoctors(response.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar médicos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAvailability(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setMessage('');
    const today = new Date();
    const dateFrom = today.toISOString().slice(0, 10);
    const dateTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      const response = await api.doctorAvailability(doctor.id, { dateFrom, dateTo });
      setSlots((response.data?.slots || []).filter((slot: any) => slot.isAvailable).slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar disponibilidad.');
    }
  }

  async function schedule(slot: any) {
    if (!profile?.id) {
      setMessage('Tu perfil de paciente no está disponible en sesión.');
      return;
    }

    setIsScheduling(true);
    setMessage('');

    try {
      await api.createAppointment({
        patientId: profile.id,
        doctorId: slot.doctorId,
        scheduledStartAt: slot.startAt,
        scheduledEndAt: slot.endAt,
        timeZone: slot.timeZone || 'America/Bogota',
        reason,
        appointmentType: 'primera_vez',
        careChannel: selectedDoctor?.careMode === 'presencial' ? 'presencial' : 'virtual',
        cancellationPenalty: 50000,
        cancellationDeadline: new Date(new Date(slot.startAt).getTime() - 6 * 60 * 60 * 1000).toISOString()
      });
      setMessage('Cita creada correctamente. Queda pendiente de confirmación médica.');
      await loadAvailability(selectedDoctor!);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible agendar la cita.');
    } finally {
      setIsScheduling(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  if (isLoading) return <LoadingState label="Buscando médicos activos..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query.specialty}
            onChange={(event) => setQuery((value) => ({ ...value, specialty: event.target.value }))}
            placeholder="Buscar por especialidad..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={query.city}
            onChange={(event) => setQuery((value) => ({ ...value, city: event.target.value }))}
            placeholder="Ciudad"
            className="rounded-lg border border-gray-300 px-4 py-2"
          />
          <button onClick={loadDoctors} className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700">
            Aplicar filtros
          </button>
        </div>
      </div>

      {doctors.length === 0 ? (
        <EmptyState title="No hay médicos activos" description="Aún no hay resultados aprobados con estos filtros." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                  {doctor.nombres?.charAt(0) || 'M'}
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Dr(a). {doctor.nombres} {doctor.apellidos}
                </h3>
                <p className="font-medium text-blue-600">{doctor.specialties?.join(', ') || 'Medicina general'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900">{Number(doctor.ratingAverage || 0).toFixed(1)}</span>
                </div>
              </div>

              <div className="my-5 space-y-3 text-sm">
                <Info icon={MapPin} label="Ciudad" value={doctor.ciudad || 'No registrada'} />
                <Info icon={Stethoscope} label="Modalidad" value={doctor.careMode || 'virtual'} />
                <Info icon={DollarSign} label="Consulta" value={`$${Number(doctor.consultationFee || 0).toLocaleString('es-CO')}`} />
              </div>

              <button
                onClick={() => loadAvailability(doctor)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4" />
                Ver disponibilidad
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900">
            Slots disponibles con Dr(a). {selectedDoctor.nombres} {selectedDoctor.apellidos}
          </h3>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2"
            placeholder="Motivo de consulta"
          />
          {message && <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {slots.length === 0 ? (
              <p className="text-sm text-gray-600">Este médico no tiene slots disponibles en los próximos días.</p>
            ) : (
              slots.map((slot) => (
                <button
                  key={slot.startAt}
                  disabled={isScheduling}
                  onClick={() => schedule(slot)}
                  className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left text-blue-800 hover:border-blue-300 disabled:opacity-60"
                >
                  <p className="font-bold">{new Date(slot.startAt).toLocaleDateString('es-CO')}</p>
                  <p className="text-sm">
                    {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="font-medium capitalize text-gray-900">{value}</span>
    </div>
  );
}
