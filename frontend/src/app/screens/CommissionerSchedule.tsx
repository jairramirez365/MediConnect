import { AlertCircle, Calendar, CheckCircle2, Clock3, Users } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const EASE = [0.16, 1, 0.3, 1] as const;

export function CommissionerSchedule({
  selectedPatientId,
  onGoToPatients
}: {
  selectedPatientId?: string | null;
  onGoToPatients: () => void;
}) {
  const [patients, setPatients] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(selectedPatientId || '');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [requiresAgentChat, setRequiresAgentChat] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);
  const reduce = useReducedMotion();

  function getAvailabilityRange() {
    const today = new Date();
    const dateFrom = today.toISOString().slice(0, 10);
    const dateToDate = new Date(today);
    dateToDate.setDate(today.getDate() + 30);
    const dateTo = dateToDate.toISOString().slice(0, 10);
    return { dateFrom, dateTo };
  }

  useEffect(() => {
    setSelectedPatient(selectedPatientId || '');
  }, [selectedPatientId]);

  useEffect(() => {
    async function loadBaseData() {
      try {
        const [patientsResponse, codesResponse, doctorsResponse] = await Promise.all([
          api.commissionerPatients(),
          api.commissionerCodes({ status: 'active' }),
          api.doctors()
        ]);
        setPatients(patientsResponse.data || []);
        setCodes(codesResponse.data || []);
        setSelectedCode(codesResponse.data?.[0]?.id || '');
        setDoctors(doctorsResponse.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar la agenda del gestor.');
      } finally {
        setIsLoading(false);
      }
    }

    loadBaseData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedDoctor) {
        setSlots([]);
        setAvailableDates([]);
        setSelectedSlot(null);
        return;
      }

      try {
        const { dateFrom, dateTo } = getAvailabilityRange();
        const response = await api.doctorAvailability(selectedDoctor, { dateFrom, dateTo });
        const availableSlots = (response.data?.slots || []).filter((slot: any) => slot.isAvailable);
        const dates = Array.from(new Set(availableSlots.map((slot: any) => slot.date)));
        setAvailableDates(dates);

        const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] || '';
        setSelectedDate(activeDate);
        setSlots(availableSlots.filter((slot: any) => !activeDate || slot.date === activeDate));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible consultar la disponibilidad.');
      }
    }

    loadSlots();
  }, [selectedDoctor]);

  useEffect(() => {
    async function filterExistingSlots() {
      if (!selectedDoctor || !selectedDate) {
        return;
      }

      try {
        const { dateFrom, dateTo } = getAvailabilityRange();
        const response = await api.doctorAvailability(selectedDoctor, { dateFrom, dateTo });
        const availableSlots = (response.data?.slots || []).filter((slot: any) => slot.isAvailable && slot.date === selectedDate);
        setSlots(availableSlots);
        if (!availableSlots.some((slot: any) => slot.startAt === selectedSlot?.startAt)) {
          setSelectedSlot(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible filtrar la disponibilidad.');
      }
    }

    filterExistingSlots();
  }, [selectedDate]);

  const selectedPatientData = useMemo(
    () => patients.find((patient) => patient.patientId === selectedPatient),
    [patients, selectedPatient]
  );

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPatient) {
      setMessage('Selecciona un paciente vinculado antes de continuar.');
      return;
    }

    if (!selectedDoctor) {
      setMessage('Selecciona un médico antes de continuar.');
      return;
    }

    if (!selectedSlot) {
      setMessage('Selecciona un horario disponible antes de continuar.');
      return;
    }

    const form = new FormData(formRef.current || undefined);
    const selectedDoctorData = doctors.find((doctor) => doctor.id === selectedDoctor);
    setMessage('');
    setPendingConfirmation({
      patientName: selectedPatientData?.patient || 'Paciente seleccionado',
      doctorName: selectedDoctorData ? `${selectedDoctorData.nombres} ${selectedDoctorData.apellidos}` : 'Médico seleccionado',
      codeLabel: codes.find((code) => code.id === selectedCode)?.code || 'Sin código',
      appointmentType: String(form.get('appointmentType') || 'primera_vez'),
      reason: String(form.get('reason') || ''),
      body: {
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        scheduledStartAt: selectedSlot.startAt,
        scheduledEndAt: selectedSlot.endAt,
        timeZone: selectedSlot.timeZone,
        reason: String(form.get('reason') || ''),
        appointmentType: String(form.get('appointmentType') || 'primera_vez'),
        careChannel: 'virtual',
        referralCodeId: selectedCode,
        requiresCommissionAgentInChat: requiresAgentChat
      }
    });
  }

  async function confirmAppointment() {
    if (!pendingConfirmation) {
      return;
    }

    try {
      await api.createAppointment(pendingConfirmation.body);
      setMessage(
        pendingConfirmation.body.requiresCommissionAgentInChat
          ? 'Preagendamiento creado. El paciente debe completar el pago PSE en 30 minutos y recibirá una solicitud para aceptar o rechazar tu acompañamiento en chat antes de iniciar.'
          : 'Preagendamiento creado. El paciente debe completar el pago PSE dentro de los próximos 30 minutos para confirmar la cita.'
      );
      formRef.current?.reset();
      setSelectedSlot(null);
      setSelectedDate('');
      setAvailableDates([]);
      setSelectedDoctor('');
      setRequiresAgentChat(false);
      setPendingConfirmation(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible crear la cita.');
      setPendingConfirmation(null);
    }
  }

  if (isLoading) return <LoadingState label="Cargando agenda del gestor..." />;
  if (error && !patients.length && !doctors.length) return <ErrorState message={error} />;

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
            <Users className="h-4 w-4" />
            Reserva asistida
          </div>
          <h1 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Agendar Citas</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-blue-50 md:text-base">
            Reserva una cita para pacientes vinculados a tus códigos y solicita acompañamiento en chat para que el paciente lo confirme antes de iniciar.
          </p>
          <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroMiniCard title="Pacientes disponibles" value={patients.length} icon={Users} />
            <HeroMiniCard title="Códigos activos" value={codes.length} icon={CheckCircle2} />
            <HeroMiniCard title="Médicos activos" value={doctors.length} icon={Calendar} />
            <HeroMiniCard title="Slots visibles" value={slots.length} icon={Clock3} />
          </div>
        </div>
      </motion.section>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

      <form ref={formRef} onSubmit={createAppointment} className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField label="Paciente" value={selectedPatient} onChange={setSelectedPatient} options={patients.map((patient) => ({ value: patient.patientId, label: patient.patient }))} />
          <SelectField label="Médico" value={selectedDoctor} onChange={setSelectedDoctor} options={doctors.map((doctor) => ({ value: doctor.id, label: `${doctor.nombres} ${doctor.apellidos}` }))} />
          <SelectField label="Código aplicado" value={selectedCode} onChange={setSelectedCode} options={codes.map((code) => ({ value: code.id, label: code.code }))} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de cita</span>
            <select name="appointmentType" className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              <option value="primera_vez">Primera vez</option>
              <option value="control">Control</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Acompañamiento en chat</span>
            <button
              type="button"
              onClick={() => setRequiresAgentChat((value) => !value)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium ${
                requiresAgentChat
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50/70 text-slate-600'
              }`}
            >
              <span>{requiresAgentChat ? 'Solicitado' : 'No solicitado'}</span>
              {requiresAgentChat ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </button>
            <p className="mt-2 text-xs text-amber-700">
              Si lo solicitas, el paciente recibirá una notificación para aceptar o rechazar esta participación antes de iniciar la consulta.
            </p>
          </label>
          <label className="block xl:col-span-3">
            <span className="mb-2 block text-sm font-medium text-slate-700">Motivo de consulta</span>
            <textarea name="reason" rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" required />
          </label>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-slate-950">Disponibilidad del Médico</h3>
          <p className="mt-1 text-sm text-slate-500">Al seleccionar el médico te mostramos las próximas fechas con agenda real del siguiente mes y luego sus horarios disponibles.</p>
          {availableDates.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {availableDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[44px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedDate === date ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-600/25' : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'}`}
                >
                  {new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}
                </button>
              ))}
            </div>
          )}
          {slots.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Sin slots disponibles" description="Selecciona un médico para consultar su agenda real de las próximas semanas." />
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {slots.map((slot: any) => (
                <button
                  key={slot.startAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`min-h-[44px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${selectedSlot?.startAt === slot.startAt ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-600/25' : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'}`}
                >
                  {new Date(slot.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatientData && (
          <div className="mt-6 rounded-[22px] bg-slate-50/80 p-4 text-sm text-slate-600">
            Paciente seleccionado: <span className="font-semibold text-slate-900">{selectedPatientData.patient}</span>
            {' - '}
            {requiresAgentChat
              ? 'Se generará una solicitud para que el paciente acepte o rechace tu acompañamiento en chat.'
              : 'Puedes reservar la cita sin acompañamiento adicional del gestor.'}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">Confirmar reserva</button>
          <button type="button" onClick={onGoToPatients} className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Ver pacientes vinculados
          </button>
        </div>
      </form>

      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Confirmación de cita</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Revisa los datos antes de reservar</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Este paso creará un preagendamiento con bloqueo temporal del slot. El paciente tendrá 30 minutos para completar el pago PSE y confirmar la cita.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryItem label="Paciente" value={pendingConfirmation.patientName} />
              <SummaryItem label="Médico" value={pendingConfirmation.doctorName} />
              <SummaryItem label="Fecha" value={new Date(pendingConfirmation.body.scheduledStartAt).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} />
              <SummaryItem label="Hora" value={`${new Date(pendingConfirmation.body.scheduledStartAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} a ${new Date(pendingConfirmation.body.scheduledEndAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`} />
              <SummaryItem label="Tipo de cita" value={formatAppointmentType(pendingConfirmation.appointmentType)} />
              <SummaryItem label="Código aplicado" value={pendingConfirmation.codeLabel} />
              <SummaryItem label="Canal" value="Virtual" />
              <SummaryItem label="Acompañamiento en chat" value={pendingConfirmation.body.requiresCommissionAgentInChat ? 'Solicitado' : 'No solicitado'} />
            </div>

            <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Motivo de consulta</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{pendingConfirmation.reason || 'Sin descripción adicional.'}</p>
            </div>

            {pendingConfirmation.body.requiresCommissionAgentInChat && (
              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                El paciente recibirá una solicitud de aprobación para el acompañamiento en chat, programada como recordatorio previo al inicio de la cita.
              </div>
            )}

            <div className="mt-4 rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-700">
              Si el pago no se confirma dentro del tiempo definido, el preagendamiento expirará y la agenda del médico volverá a quedar disponible.
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Volver a editar
              </button>
              <button
                type="button"
                onClick={confirmAppointment}
                className="min-h-[44px] rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              >
                Crear preagendamiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroMiniCard({ title, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-white/20 bg-white/15 p-4 text-center backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2.5 text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-xs text-blue-50">{title}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, options, name }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatAppointmentType(value: string) {
  const labels: Record<string, string> = {
    primera_vez: 'Primera vez',
    control: 'Control',
    seguimiento: 'Seguimiento'
  };

  return labels[value] || value;
}
