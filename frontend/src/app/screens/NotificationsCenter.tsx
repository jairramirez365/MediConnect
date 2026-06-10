import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2, RefreshCw, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const eventOptions = [
  { value: '', label: 'Todos los eventos' },
  { value: 'verificacion_cuenta', label: 'Verificacion de cuenta' },
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
      <section className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(37,99,235,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Centro de notificaciones
            </span>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{isAdmin ? 'Auditoria y entregas multicanal' : 'Mensajes, alertas y recordatorios'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isAdmin
                ? 'Supervisa el historial de envios, filtra incidencias, revisa estados de entrega y reprocesa notificaciones fallidas sin salir de MediConnect.'
                : 'Consulta confirmaciones, cambios de agenda y recordatorios de tus citas desde un solo panel con trazabilidad por canal.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="No leidas" value={String(unreadCount)} />
            <MetricCard label="Total visibles" value={String(notifications.length)} />
            <button
              onClick={isAdmin ? handleRunJobs : loadNotifications}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {busyId === 'run-jobs' ? 'Ejecutando...' : isAdmin ? 'Ejecutar recordatorios' : 'Actualizar'}
            </button>
          </div>
        </div>
      </section>

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
                  { value: 'unread', label: 'No leidas' },
                  { value: 'read', label: 'Leidas' }
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          {notification.channel}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          {notification.eventType || notification.type}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        {notification.deliveredAt || notification.sentAt || notification.scheduledAt
                          ? new Date(notification.deliveredAt || notification.sentAt || notification.scheduledAt).toLocaleString('es-CO')
                          : 'Sin fecha'}
                      </p>
                    </div>
                    {!notification.readAt && !isAdmin && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
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
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{selected.eventType || selected.type}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selected.channel}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{selected.status}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900">Detalle de notificacion</h2>
                </div>

                <div className="flex gap-2">
                  {!isAdmin && !selected.readAt && (
                    <button
                      onClick={() => handleMarkRead(selected.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {busyId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                      Marcar leida
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
                <InfoRow label="Ultimo envio" value={formatDate(selected.sentAt)} />
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
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
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{detail ? 'Selecciona una notificacion' : 'Aun no hay notificaciones'}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {detail
          ? 'Cuando elijas un elemento del listado, aqui veras su trazabilidad, canal, contenido y estado de entrega.'
          : 'Cuando se generen verificaciones, pagos, cambios de agenda o recordatorios, apareceran aqui con su detalle.'}
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
