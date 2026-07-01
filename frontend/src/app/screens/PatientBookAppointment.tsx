import { AlertCircle, Calendar, ChevronRight, Clock3, ExternalLink, Landmark } from 'lucide-react';
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

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getAvailabilityRange() {
  const today = new Date();
  const dateFrom = today.toISOString().slice(0, 10);
  const dateToDate = new Date(today);
  dateToDate.setDate(today.getDate() + 30);
  const dateTo = dateToDate.toISOString().slice(0, 10);
  return { dateFrom, dateTo };
}

function getFilteredSlotsByJourney(slots: any[], journey: string) {
  if (!journey) return slots;

  return slots.filter((slot) => {
    const hour = new Date(slot.startAt).getHours();

    if (journey === 'manana') {
      return hour < 12;
    }

    if (journey === 'tarde') {
      return hour >= 12;
    }

    return true;
  });
}

function formatAppointmentType(value: string) {
  const labels: Record<string, string> = {
    primera_vez: 'Primera vez',
    control: 'Control',
    seguimiento: 'Seguimiento'
  };

  return labels[value] || value;
}

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
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [journey, setJourney] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<any | null>(null);
  const [checkout, setCheckout] = useState<any | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function loadDoctors() {
      try {
        const response = await api.doctors({ limit: 100 });
        setDoctors(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar médicos activos.');
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
        setAvailableDates([]);
        setSelectedDate('');
        return;
      }

      setMessage('');
      setError('');

      try {
        const { dateFrom, dateTo } = getAvailabilityRange();
        const response = await api.doctorAvailability(selectedDoctor.id, { dateFrom, dateTo });
        const availableSlots = (response.data?.slots || []).filter((slot: any) => slot.isAvailable);
        const dates = Array.from(new Set(availableSlots.map((slot: any) => slot.date)));
        const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] || '';

        setAvailableDates(dates);
        setSelectedDate(activeDate);
        setSlots(availableSlots.filter((slot: any) => !activeDate || slot.date === activeDate));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar disponibilidad.');
      }
    }

    loadAvailability();
  }, [selectedDoctor]);

  useEffect(() => {
    async function filterExistingSlots() {
      if (!selectedDoctor || !selectedDate) {
        setSlots([]);
        return;
      }

      setError('');

      try {
        const { dateFrom, dateTo } = getAvailabilityRange();
        const response = await api.doctorAvailability(selectedDoctor.id, { dateFrom, dateTo });
        const availableSlots = (response.data?.slots || []).filter(
          (slot: any) => slot.isAvailable && slot.date === selectedDate
        );
        setSlots(availableSlots);

        if (!availableSlots.some((slot: any) => slot.startAt === pendingSlot?.startAt)) {
          setPendingSlot(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible filtrar la disponibilidad.');
      }
    }

    filterExistingSlots();
  }, [selectedDate]);

  const visibleSlots = useMemo(() => getFilteredSlotsByJourney(slots, journey), [journey, slots]);

  async function confirmSchedule() {
    if (!selectedDoctor || !pendingSlot) return;

    setIsScheduling(true);
    setMessage('');

    try {
      const appointmentResponse = await api.createAppointment({
        doctorId: selectedDoctor.id,
        scheduledStartAt: pendingSlot.startAt,
        scheduledEndAt: pendingSlot.endAt,
        timeZone: pendingSlot.timeZone || 'America/Bogota',
        reason,
        appointmentType,
        careChannel: 'virtual',
        cancellationPenalty: 50000
      });

      const appointment = appointmentResponse.data;
      setPendingSlot(null);

      if (appointment.requiresPayment) {
        const checkoutResponse = await api.createPseCheckout(appointment.id, { currency: 'COP' });
        setCheckout({
          appointment,
          checkout: checkoutResponse.data
        });
        setMessage('Tu slot quedó reservado temporalmente. Completa el pago PSE para confirmar la cita.');
        return;
      }

      setMessage(
        appointment.isFreeFollowUp
          ? 'Cita de seguimiento confirmada sin cobro. Cumpliste la regla del mes calendario con el mismo médico.'
          : 'Cita creada correctamente.'
      );
      await refreshSlots();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible agendar la cita.');
    } finally {
      setIsScheduling(false);
    }
  }

  async function refreshSlots() {
    if (!selectedDoctor) return;
    const { dateFrom, dateTo } = getAvailabilityRange();
    const response = await api.doctorAvailability(selectedDoctor.id, { dateFrom, dateTo });
    const availableSlots = (response.data?.slots || []).filter((slot: any) => slot.isAvailable);
    const dates = Array.from(new Set(availableSlots.map((slot: any) => slot.date)));
    const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] || '';

    setAvailableDates(dates);
    setSelectedDate(activeDate);
    setSlots(availableSlots.filter((slot: any) => !activeDate || slot.date === activeDate));
  }

  async function simulateSuccess() {
    if (!checkout?.checkout?.payment?.id) {
      return;
    }

    try {
      const response = await api.simulatePaymentSuccess(checkout.checkout.payment.id, {
        providerReference: checkout.checkout.checkout?.reference
      });
      setMessage(`Pago confirmado correctamente. La cita ya quedó ${response.data.payment.appointmentStatus || 'confirmada'}.`);
      setCheckout(null);
      await refreshSlots();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible confirmar el pago.');
    }
  }

  if (isLoading) return <LoadingState label="Preparando agenda de citas..." />;
  if (error && !selectedDoctor) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#4338ca_0%,_#2563eb_45%,_#06b6d4_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(37,99,235,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Calendar className="h-4 w-4" />
            Agenda tu consulta
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Reserva tu cita con disponibilidad real y pago integrado
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Elige el especialista, define fecha y jornada, reserva tu slot y completa el pago PSE para confirmar la consulta.
          </p>

          <div className="mt-6 w-full max-w-xl rounded-[28px] border border-white/20 bg-white/15 p-5 text-left backdrop-blur">
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
      </motion.section>

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
                <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" /> Consulta</span>
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
                <p className="mt-1 text-sm text-slate-500">Filtra por fecha y jornada para ver solo los horarios exactos que puedes reservar.</p>
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

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Jornada</span>
                <select
                  value={journey}
                  onChange={(event) => setJourney(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Todas</option>
                  <option value="manana">Mañana</option>
                  <option value="tarde">Tarde</option>
                </select>
              </label>
            </div>

            {availableDates.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[44px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      selectedDate === date
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-600/25'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'
                    }`}
                  >
                    {new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </button>
                ))}
              </div>
            )}

            {visibleSlots.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Sin horarios disponibles" description="Selecciona una fecha disponible del siguiente mes o cambia de jornada para encontrar espacios libres." />
              </div>
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleSlots.map((slot) => (
                  <button
                    key={slot.startAt}
                    disabled={isScheduling}
                    onClick={() => setPendingSlot(slot)}
                    className="flex flex-col items-center rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#eff6ff,_#ffffff)] p-4 text-center text-blue-800 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <p className="text-lg font-black tracking-[-0.02em] text-blue-700">
                      {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-blue-600/80">
                      {journey === 'manana' ? 'Jornada mañana' : journey === 'tarde' ? 'Jornada tarde' : 'Horario disponible'}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Si requiere pago, el slot quedará reservado por 30 minutos.</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <EmptyState title="No hay médicos activos" description="Necesitamos al menos un especialista activo para habilitar el agendamiento." />
      )}

      {pendingSlot && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]">
            <h3 className="text-2xl font-bold text-slate-950">Confirma tu cita antes de continuar</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Si esta consulta requiere pago, el sistema hará un preagendamiento y te llevará directo al flujo PSE.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Médico" value={`Dr(a). ${selectedDoctor.nombres} ${selectedDoctor.apellidos}`} />
              <SummaryItem label="Especialidades" value={selectedDoctor.specialties?.join(', ') || 'Especialidad activa'} />
              <SummaryItem label="Fecha" value={new Date(pendingSlot.startAt).toLocaleDateString('es-CO')} />
              <SummaryItem label="Hora" value={new Date(pendingSlot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
              <SummaryItem label="Tipo de consulta" value={formatAppointmentType(appointmentType)} />
              <SummaryItem label="Canal" value="virtual" />
              <SummaryItem label="Valor base" value={`$${Number(selectedDoctor.consultationFee || 0).toLocaleString('es-CO')}`} />
              <SummaryItem label="Motivo" value={reason} />
            </div>

            {appointmentType === 'seguimiento' && (
              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Si tuviste una cita completada con este mismo médico dentro del último mes calendario, el seguimiento se confirmará sin pago.
              </div>
            )}

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
                className="min-h-[44px] rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isScheduling ? 'Reservando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Pago PSE</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Completa el pago para confirmar la cita</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  El horario quedó bloqueado temporalmente. Si el pago no se completa en 30 minutos, el espacio volverá a estar disponible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckout(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Estado de la cita" value={String(checkout.appointment.status || '').replaceAll('_', ' ')} />
              <SummaryItem label="Referencia" value={checkout.checkout.checkout?.reference || 'Sin referencia'} />
              <SummaryItem label="Valor" value={`$${Number(checkout.checkout.payment?.amount || 0).toLocaleString('es-CO')}`} />
              <SummaryItem label="Expira" value={checkout.appointment.paymentExpiresAt ? new Date(checkout.appointment.paymentExpiresAt).toLocaleString('es-CO') : 'Sin vencimiento'} />
            </div>

            <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Esta simulación mantiene el contrato real de PSE. En producción, el siguiente paso redirigirá a la pasarela sin cambiar la lógica de reserva temporal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckout(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={simulateSuccess}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Simular pago PSE exitoso
                <ExternalLink className="h-4 w-4" />
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
