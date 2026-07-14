import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Calendar, Clock3, Loader2, MessageCircle, Mic, Paperclip, Phone, Send, ShieldCheck, Video } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { StatusBadge } from '../components/StatusBadge';

const EASE = [0.16, 1, 0.3, 1] as const;

const contentStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const sectionItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

type VideoConsultationRoomProps = {
  appointmentId?: string | null;
  roleMode: 'patient' | 'doctor';
  onBackToAppointments: () => void;
};

export function VideoConsultationRoom({ appointmentId, roleMode, onBackToAppointments }: VideoConsultationRoomProps) {
  const reduce = useReducedMotion();
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
      {/* HERO */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#5b21b6_0%,_#4f46e5_45%,_#2563eb_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(79,70,229,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Sala segura de teleconsulta
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            {roleMode === 'doctor' ? 'Videoconsulta Médica' : 'Tu Videoconsulta'}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-indigo-50 md:text-base">
            Accede a la consulta virtual dentro de la ventana permitida, con trazabilidad de inicio, cierre y mensajería clínica asociada.
          </p>
          <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBackToAppointments}
              className="min-h-[44px] rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Volver a citas
            </button>
            <button
              onClick={handlePrepare}
              className="min-h-[44px] rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {actionBusy === 'prepare' ? 'Preparando...' : 'Preparar sala'}
            </button>
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {session ? (
        <motion.div
          variants={contentStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="min-w-0 space-y-6">
            <motion.section variants={sectionItem} className="overflow-hidden rounded-[30px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
              <div className="relative min-h-[460px] bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_32%),linear-gradient(180deg,_#0f172a,_#1e1b4b)] p-6 md:min-h-[520px]">
                <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
                  <StatusBadge status={session.status} />
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                    {session.provider}
                  </span>
                </div>

                <div className="flex h-full min-h-[400px] items-center justify-center md:min-h-[440px]">
                  <div className="text-center">
                    <motion.div
                      animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
                      transition={reduce ? undefined : { duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
                      className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indigo-500/30 text-white shadow-[0_0_0_12px_rgba(255,255,255,0.06)] md:h-32 md:w-32"
                    >
                      <Video className="h-12 w-12 md:h-14 md:w-14" />
                    </motion.div>
                    <h2 className="mt-6 text-2xl font-bold text-white">
                      {roleMode === 'doctor' ? session.appointment.patient : session.appointment.doctor}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {session.appointment.specialty || 'Consulta virtual MediConnect'}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-indigo-200">
                      Ventana activa
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{accessWindowText}</p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
                  <button aria-label="Silenciar micrófono" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
                    <Mic className="h-5 w-5" />
                  </button>
                  <button aria-label="Apagar cámara" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
                    <Video className="h-5 w-5" />
                  </button>
                  {roleMode === 'doctor' ? (
                    <button
                      onClick={handleEnd}
                      aria-label="Finalizar videoconsulta"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-600/40 transition hover:from-rose-600 hover:to-red-700"
                    >
                      {actionBusy === 'end' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5 rotate-[135deg]" />}
                    </button>
                  ) : (
                    <button
                      onClick={onBackToAppointments}
                      aria-label="Salir de la sala"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg shadow-slate-900/40 transition hover:bg-slate-800"
                    >
                      <Phone className="h-5 w-5 rotate-[135deg]" />
                    </button>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={sectionItem} className="grid gap-4 sm:grid-cols-3">
              <InfoCard label="Paciente" value={session.appointment.patient} icon={Calendar} tone="blue" />
              <InfoCard label="Médico" value={session.appointment.doctor} icon={Video} tone="violet" />
              <InfoCard label="Horario" value={new Date(session.appointment.scheduledStartAt).toLocaleString('es-CO')} icon={Clock3} tone="cyan" />
            </motion.section>

            <motion.section variants={sectionItem} className="rounded-[28px] border border-white/80 bg-white/92 p-6 text-center shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
              <div className="flex flex-col items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Estado de Acceso</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    El token de acceso expira en {session.access?.expiresAt ? new Date(session.access.expiresAt).toLocaleString('es-CO') : 'la ventana vigente'}.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  {session.status !== 'in_progress' && session.status !== 'completed' && (
                    <button
                      onClick={handleStart}
                      className="min-h-[44px] rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                  {session.status === 'ready' && 'La sala está preparada. Cuando uno de los participantes ingrese, se registrará el inicio real de la consulta.'}
                  {session.status === 'in_progress' && 'La consulta está en curso y su trazabilidad ya registra la fecha real de inicio.'}
                  {session.status === 'completed' && 'La sesión terminó y la cita puede continuar hacia su cierre clínico, fórmula o seguimiento.'}
                </p>
                {session.access?.joinUrl && (
                  <p className="mt-3 break-all text-xs text-slate-500">
                    URL simulada del proveedor: {session.access.joinUrl}
                  </p>
                )}
              </div>
            </motion.section>
          </div>

          <motion.section variants={sectionItem} className="flex min-h-[560px] flex-col rounded-[30px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.06)] xl:min-h-[720px]">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-950">Chat de la Consulta</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Toda la conversación queda ligada a la videoconsulta para facilitar seguimiento y trazabilidad.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-4 text-sm text-slate-500">Aún no hay mensajes para esta videoconsulta.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[88%] rounded-3xl px-4 py-3 ${
                      message.senderRole === 'sistema'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-gradient-to-br from-indigo-50 to-blue-50 text-slate-800'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
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
                <button aria-label="Adjuntar archivo" className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Escribe un mensaje para esta consulta..."
                  className="min-h-[52px] flex-1 rounded-3xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  aria-label="Enviar mensaje"
                  className="shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-3 text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-70"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : (
        <EmptyState title="Sin sala disponible" description="Prepara la videoconsulta para generar el acceso temporal y habilitar el chat de la sesión." />
      )}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, tone = 'blue' }: any) {
  const tones: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    violet: 'from-violet-500 to-fuchsia-600',
    cyan: 'from-cyan-500 to-blue-600',
  };

  return (
    <div className="min-w-0 rounded-[26px] border border-white/80 bg-white/92 p-5 text-center shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
