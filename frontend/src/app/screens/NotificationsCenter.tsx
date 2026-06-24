import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2, Send } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const EASE = [0.16, 1, 0.3, 1] as const;

const formatTag = (value?: string) => String(value || '').replaceAll('_', ' ');

const eventOptions = [
  { value: '', label: 'Todos los eventos' },
  { value: 'verificacion_cuenta', label: 'Verificación de cuenta' },
  { value: 'cita_agendada', label: 'Cita agendada' },
  { value: 'cita_modificada', label: 'Cita modificada' },
  { value: 'cita_cancelada', label: 'Cita cancelada' },
  { value: 'cita_recordatorio_5_minutos', label: 'Recordatorio 5 minutos' }
];

export function NotificationsCenter() {
  const { role } = useAuth();
  const [readState, setReadState] = useState('');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const isAdmin = role === 'admin';
  const reduce = useReducedMotion();

  async function loadNotifications() {
    setLoading(true);
    setMessage('');
    try {
      const response = isAdmin
        ? await api.adminNotifications({ eventType, status, search, limit: 100 })
        : await api.notifications({ eventType, readState, limit: 100 });
      setNotifications(response.data || []);
      setSelected((current: any) => response.data?.find((item: any) => item.id === current?.id) || response.data?.[0] || null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [eventType, readState, status, search, isAdmin]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  async function handleMarkRead(notificationId: string) {
    setBusyId(notificationId);
    try {
      await api.markNotificationRead(notificationId);
      await loadNotifications();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRetry(notificationId: string) {
    setBusyId(notificationId);
    try {
      await api.retryNotification(notificationId);
      await loadNotifications();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRunJobs() {
    setBusyId('run-jobs');
    try {
      await api.runNotificationJobs();
      setMessage('Se ejecutaron los recordatorios y reprocesos pendientes.');
      await loadNotifications();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#4338ca_0%,_#7c3aed_45%,_#c026d3_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Bell className="h-4 w-4" />
            Centro de notificaciones
          </span>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">
            {isAdmin ? 'Auditoría y entregas multicanal' : 'Mensajes, alertas y recordatorios'}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-indigo-50 md:text-base">
            {isAdmin
              ? 'Supervisa el historial de envíos, filtra incidencias, revisa estados de entrega y reprocesa notificaciones fallidas sin salir de MediConnect.'
              : 'Consulta confirmaciones, cambios de agenda y recordatorios de tus citas desde un solo panel con trazabilidad por canal.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <MetricCard label="No leídas" value={String(unreadCount)} />
            <MetricCard label="Total visibles" value={String(notifications.length)} />
            <motion.button
              onClick={isAdmin ? handleRunJobs : loadNotifications}
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-violet-700 shadow-lg shadow-violet-950/20 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {busyId === 'run-jobs' ? 'Ejecutando...' : isAdmin ? 'Ejecutar recordatorios' : 'Actualizar'}
            </motion.button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {!isAdmin && (
              <SelectField
                label="Estado"
                value={readState}
                onChange={setReadState}
                options={[
                  { value: '', label: 'Todas' },
                  { value: 'unread', label: 'No leídas' },
                  { value: 'read', label: 'Leídas' }
                ]}
              />
            )}
            <SelectField label="Evento" value={eventType} onChange={setEventType} options={eventOptions} />
            {isAdmin && (
              <>
                <SelectField
                  label="Entrega"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: '', label: 'Todos los estados' },
                    { value: 'entregada', label: 'Entregada' },
                    { value: 'programada', label: 'Programada' },
                    { value: 'fallida', label: 'Fallida' }
                  ]}
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="correo, mensaje..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </>
            )}
          </div>

          {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 px-6 py-12 text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState />
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => setSelected(notification)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selected?.id === notification.id ? 'border-blue-500 bg-blue-50/70' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20">
                        <Bell className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                            {formatTag(notification.channel)}
                          </span>
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                            {formatTag(notification.eventType || notification.type)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-700">{notification.message}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {notification.deliveredAt || notification.sentAt || notification.scheduledAt
                            ? new Date(notification.deliveredAt || notification.sentAt || notification.scheduledAt).toLocaleString('es-CO')
                            : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                    {!notification.readAt && !isAdmin && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-500" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">{formatTag(selected.eventType || selected.type)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">{formatTag(selected.channel)}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{formatTag(selected.status)}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900">Detalle de notificación</h2>
                </div>

                <div className="flex gap-2">
                  {!isAdmin && !selected.readAt && (
                    <button
                      onClick={() => handleMarkRead(selected.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {busyId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                      Marcar leída
                    </button>
                  )}
                  {isAdmin && selected.status === 'fallida' && (
                    <button
                      onClick={() => handleRetry(selected.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      {busyId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Reintentar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoRow label="Destinatario" value={selected.destination || selected.email || 'Interno'} />
                <InfoRow label="Fecha programada" value={formatDate(selected.scheduledAt)} />
                <InfoRow label="Último envío" value={formatDate(selected.sentAt)} />
                <InfoRow label="Entregada" value={formatDate(selected.deliveredAt)} />
                {isAdmin && <InfoRow label="Intentos" value={String(selected.attemptsCount || 0)} />}
                {isAdmin && <InfoRow label="Proveedor" value={selected.provider || 'mock'} />}
              </div>

              <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mensaje</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.message}</p>
              </div>

              {(selected.payload || selected.metadata || selected.deliveryError) && (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {selected.deliveryError && (
                    <div className="rounded-3xl bg-red-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Error de entrega</p>
                      <p className="mt-3 text-sm leading-6 text-red-700">{selected.deliveryError}</p>
                    </div>
                  )}
                  {selected.metadata && (
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Metadata</p>
                      <pre className="mt-3 overflow-auto text-xs leading-6 text-slate-700">{JSON.stringify(selected.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState detail />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[108px] flex-col items-center rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-center backdrop-blur">
      <p className="text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-indigo-50">{label}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ detail = false }: { detail?: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <Bell className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{detail ? 'Selecciona una notificación' : 'Aún no hay notificaciones'}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {detail
          ? 'Cuando elijas un elemento del listado, aquí verás su trazabilidad, canal, contenido y estado de entrega.'
          : 'Cuando se generen verificaciones, pagos, cambios de agenda o recordatorios, aparecerán aquí con su detalle.'}
      </p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'No disponible';
  }

  return new Date(value).toLocaleString('es-CO');
}
