import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Clock3, Loader2, MessageCircle, Mic, Paperclip, Phone, Send, ShieldCheck, Video } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

type VideoConsultationRoomProps = {
  appointmentId?: string | null;
  roleMode: 'patient' | 'doctor';
  onBackToAppointments: () => void;
};

export function VideoConsultationRoom({ appointmentId, roleMode, onBackToAppointments }: VideoConsultationRoomProps) {
  const [session, setSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState<'prepare' | 'start' | 'end' | null>(null);
  const [error, setError] = useState('');

  async function loadSession(preferPrepare = false) {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setError('');

    try {
      let response;

      if (preferPrepare) {
        response = await api.prepareVideoSession(appointmentId);
      } else {
        try {
          response = await api.videoSessionByAppointment(appointmentId);
        } catch {
          response = await api.prepareVideoSession(appointmentId);
        }
      }

      setSession(response.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible preparar la videoconsulta.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(videoConsultationId: string) {
    try {
      const response = await api.videoMessages(videoConsultationId);
      setMessages(response.data || []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadSession();
  }, [appointmentId]);

  useEffect(() => {
    if (!session?.id) {
      return;
    }

    loadMessages(session.id);
    const interval = window.setInterval(() => loadMessages(session.id), 8000);
    return () => window.clearInterval(interval);
  }, [session?.id]);

  const accessWindowText = useMemo(() => {
    if (!session?.accessWindow?.startsAt || !session?.accessWindow?.endsAt) {
      return 'Ventana de acceso no disponible';
    }

    return `${new Date(session.accessWindow.startsAt).toLocaleString('es-CO')} · ${new Date(session.accessWindow.endsAt).toLocaleString('es-CO')}`;
  }, [session]);

  async function handlePrepare() {
    if (!appointmentId) {
      return;
    }

    setActionBusy('prepare');
    await loadSession(true);
    setActionBusy(null);
  }

  async function handleStart() {
    if (!session?.id) {
      return;
    }

    setActionBusy('start');
    setError('');

    try {
      const response = await api.startVideoSession(session.id);
      setSession(response.data || null);
      await loadMessages(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar la videoconsulta.');
    } finally {
      setActionBusy(null);
    }
  }

  async function handleEnd() {
    if (!session?.id) {
      return;
    }

    setActionBusy('end');
    setError('');

    try {
      const response = await api.endVideoSession(session.id);
      setSession(response.data || null);
      await loadMessages(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible finalizar la videoconsulta.');
    } finally {
      setActionBusy(null);
    }
  }

  async function handleSendMessage() {
    if (!session?.id || !newMessage.trim()) {
      return;
    }

    setSending(true);

    try {
      await api.sendVideoMessage(session.id, { content: newMessage.trim() });
      setNewMessage('');
      await loadMessages(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <LoadingState label="Preparando videoconsulta..." />;
  }

  if (!appointmentId) {
    return <EmptyState title="Sin cita seleccionada" description="Vuelve al listado y elige una consulta virtual para continuar." />;
  }

  if (error && !session) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#0f4fcf_0%,_#60a5fa_60%,_#dbeafe_100%)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.18)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold text-white/95">
              <ShieldCheck className="h-4 w-4" />
              Sala segura de teleconsulta
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              {roleMode === 'doctor' ? 'Videoconsulta medica' : 'Tu videoconsulta'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
              Accede a la consulta virtual dentro de la ventana permitida, con trazabilidad de inicio, cierre y mensajeria clinica asociada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBackToAppointments}
              className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Volver a citas
            </button>
            <button
              onClick={handlePrepare}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {actionBusy === 'prepare' ? 'Preparando...' : 'Preparar sala'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {session ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[30px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
              <div className="relative min-h-[520px] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_30%),linear-gradient(180deg,_#0f172a,_#1e293b)] p-6">
                <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                  <StatusBadge status={session.status} />
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                    {session.provider}
                  </span>
                </div>

                <div className="flex h-full min-h-[440px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-500/30 text-white shadow-[0_0_0_12px_rgba(255,255,255,0.06)]">
                      <Video className="h-14 w-14" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-white">
                      {roleMode === 'doctor' ? session.appointment.patient : session.appointment.doctor}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {session.appointment.specialty || 'Consulta virtual MediConnect'}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Ventana activa
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{accessWindowText}</p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                    <Mic className="h-5 w-5" />
                  </button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                    <Video className="h-5 w-5" />
                  </button>
                  {roleMode === 'doctor' ? (
                    <button
                      onClick={handleEnd}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
                    >
                      {actionBusy === 'end' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5 rotate-[135deg]" />}
                    </button>
                  ) : (
                    <button
                      onClick={onBackToAppointments}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg shadow-slate-800/30 transition hover:bg-slate-800"
                    >
                      <Phone className="h-5 w-5 rotate-[135deg]" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <InfoCard label="Paciente" value={session.appointment.patient} icon={Calendar} />
              <InfoCard label="Medico" value={session.appointment.doctor} icon={Video} />
              <InfoCard label="Horario" value={new Date(session.appointment.scheduledStartAt).toLocaleString('es-CO')} icon={Clock3} />
            </section>

            <section className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Estado de acceso</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    El token de acceso expira en {session.access?.expiresAt ? new Date(session.access.expiresAt).toLocaleString('es-CO') : 'la ventana vigente'}.
                  </p>
                </div>
                <div className="flex gap-3">
                  {session.status !== 'in_progress' && session.status !== 'completed' && (
                    <button
                      onClick={handleStart}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      {actionBusy === 'start'
                        ? 'Iniciando...'
                        : roleMode === 'doctor'
                          ? 'Iniciar videoconsulta'
                          : 'Ingresar a videoconsulta'}
                    </button>
                  )}
                  {session.status === 'completed' && (
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      Consulta finalizada
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                <p className="text-sm leading-7 text-slate-600">
                  {session.status === 'ready' && 'La sala esta preparada. Cuando uno de los participantes ingrese, se registrara el inicio real de la consulta.'}
                  {session.status === 'in_progress' && 'La consulta esta en curso y su trazabilidad ya registra la fecha real de inicio.'}
                  {session.status === 'completed' && 'La sesion termino y la cita puede continuar hacia su cierre clinico, formula o seguimiento.'}
                </p>
                {session.access?.joinUrl && (
                  <p className="mt-3 text-xs text-slate-500">
                    URL simulada del proveedor: {session.access.joinUrl}
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="flex min-h-[720px] flex-col rounded-[30px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-950">Chat de la consulta</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Toda la conversacion queda ligada a la videoconsulta para facilitar seguimiento y trazabilidad.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-4 text-sm text-slate-500">Aun no hay mensajes para esta videoconsulta.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[88%] rounded-3xl px-4 py-3 ${
                      message.senderRole === 'sistema'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-50 text-slate-800'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {message.senderRole}
                    </p>
                    <p className="mt-2 text-sm leading-6">{message.content}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {new Date(message.createdAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 p-5">
              <div className="flex items-end gap-3">
                <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Escribe un mensaje para esta consulta..."
                  className="min-h-[104px] flex-1 rounded-3xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <EmptyState title="Sin sala disponible" description="Prepara la videoconsulta para generar el acceso temporal y habilitar el chat de la sesion." />
      )}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-[26px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
