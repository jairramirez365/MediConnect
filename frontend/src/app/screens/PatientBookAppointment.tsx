import { Calendar, ChevronRight, Clock3, FileText, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

type Doctor = {
  id: string;
  nombres: string;
  apellidos: string;
  ciudad: string;
  careMode: string;
  consultationFee: string;
  ratingAverage: string;
  yearsOfExperience: number;
  specialties: string[];
};

type PatientBookAppointmentProps = {
  selectedDoctorId: string | null;
  onViewDoctor: (doctorId: string) => void;
  onOpenAppointments: () => void;
};

export function PatientBookAppointment({
  selectedDoctorId,
  onViewDoctor,
  onOpenAppointments
}: PatientBookAppointmentProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [reason, setReason] = useState('Consulta general');
  const [appointmentType, setAppointmentType] = useState('primera_vez');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<any | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const response = await api.doctors({ limit: 100 });
        setDoctors(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar medicos activos.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDoctors();
  }, []);

  useEffect(() => {
    if (!doctors.length) return;

    const doctor = doctors.find((item) => item.id === selectedDoctorId) || doctors[0] || null;
    setSelectedDoctor(doctor);
  }, [doctors, selectedDoctorId]);

  useEffect(() => {
    async function loadAvailability() {
      if (!selectedDoctor) {
        setSlots([]);
        return;
      }

      setMessage('');
      setError('');

      try {
        const today = new Date();
        const dateFrom = today.toISOString().slice(0, 10);
        const dateTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const response = await api.doctorAvailability(selectedDoctor.id, { dateFrom, dateTo });
        setSlots((response.data?.slots || []).filter((slot: any) => slot.isAvailable).slice(0, 12));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar disponibilidad.');
      }
    }

    loadAvailability();
  }, [selectedDoctor]);

  async function confirmSchedule() {
    if (!selectedDoctor || !pendingSlot) return;

    if (!selectedDoctor) return;

    setIsScheduling(true);
    setMessage('');

    try {
      await api.createAppointment({
        doctorId: selectedDoctor.id,
        scheduledStartAt: pendingSlot.startAt,
        scheduledEndAt: pendingSlot.endAt,
        timeZone: pendingSlot.timeZone || 'America/Bogota',
        reason,
        appointmentType,
        careChannel: 'virtual',
        cancellationPenalty: 50000
      });
      setMessage('Cita creada correctamente. Ahora puedes verla dentro de Mis Citas.');
      setPendingSlot(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible agendar la cita.');
    } finally {
      setIsScheduling(false);
    }
  }

  const nextSlots = useMemo(() => slots.slice(0, 6), [slots]);

  if (isLoading) return <LoadingState label="Preparando agenda de citas..." />;
  if (error && !selectedDoctor) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <Calendar className="h-4 w-4" />
              Agenda tu consulta
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              Reserva tu cita con informacion clara y slots reales
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Selecciona un especialista activo, revisa su disponibilidad real y confirma el horario que mejor se ajuste a tu necesidad.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/18 bg-white/16 p-5 backdrop-blur">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/90">Especialista</span>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(event) => setSelectedDoctor(doctors.find((doctor) => doctor.id === event.target.value) || null)}
                className="w-full rounded-2xl border border-white/30 bg-white/18 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/40"
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id} className="text-slate-900">
                    {doctor.nombres} {doctor.apellidos} - {doctor.specialties?.[0] || 'Especialidad'}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {selectedDoctor ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Dr(a). {selectedDoctor.nombres} {selectedDoctor.apellidos}
                </h2>
                <p className="mt-1 text-sm font-medium text-blue-600">
                  {selectedDoctor.specialties?.join(', ') || 'Especialidad activa'}
                </p>
              </div>
              <button
                onClick={() => onViewDoctor(selectedDoctor.id)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Ver perfil
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Experiencia</span>
                <strong className="text-slate-900">{selectedDoctor.yearsOfExperience} años</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" /> Consulta</span>
                <strong className="text-slate-900">${Number(selectedDoctor.consultationFee || 0).toLocaleString('es-CO')}</strong>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Motivo de consulta</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Tipo de consulta</span>
                <select
                  value={appointmentType}
                  onChange={(event) => setAppointmentType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="primera_vez">Primera vez</option>
                  <option value="control">Control</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Horarios disponibles</h2>
                <p className="mt-1 text-sm text-slate-500">Selecciona un slot exacto y la cita se creara con las reglas reales del backend.</p>
              </div>
              <button
                onClick={onOpenAppointments}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Ver mis citas
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

            {nextSlots.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Sin disponibilidad cercana" description="Prueba con otro medico activo o vuelve mas tarde para revisar nuevos espacios." />
              </div>
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nextSlots.map((slot) => (
                  <button
                    key={slot.startAt}
                    disabled={isScheduling}
                    onClick={() => setPendingSlot(slot)}
                    className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#eff6ff,_#ffffff)] p-4 text-left text-blue-800 transition hover:border-blue-300 disabled:opacity-60"
                  >
                    <p className="font-bold">{new Date(slot.startAt).toLocaleDateString('es-CO')}</p>
                    <p className="text-sm">
                      {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Confirmacion medica posterior y recordatorios automaticos.</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <EmptyState title="No hay medicos activos" description="Necesitamos al menos un especialista activo para habilitar el agendamiento." />
      )}

      {pendingSlot && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]">
            <h3 className="text-2xl font-bold text-slate-950">Confirma tu cita antes de agendar</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Revisa cuidadosamente la informacion. La cita se creara en cuanto confirmes este resumen.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Medico" value={`Dr(a). ${selectedDoctor.nombres} ${selectedDoctor.apellidos}`} />
              <SummaryItem label="Especialidades" value={selectedDoctor.specialties?.join(', ') || 'Especialidad activa'} />
              <SummaryItem label="Fecha" value={new Date(pendingSlot.startAt).toLocaleDateString('es-CO')} />
              <SummaryItem label="Hora" value={new Date(pendingSlot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
              <SummaryItem label="Tipo de consulta" value={appointmentType.replace('_', ' ')} />
              <SummaryItem label="Canal" value="virtual" />
              <SummaryItem label="Valor" value={`$${Number(selectedDoctor.consultationFee || 0).toLocaleString('es-CO')}`} />
              <SummaryItem label="Motivo" value={reason} />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setPendingSlot(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Volver
              </button>
              <button
                disabled={isScheduling}
                onClick={confirmSchedule}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isScheduling ? 'Agendando...' : 'Confirmar y agendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{value}</p>
    </div>
  );
}
