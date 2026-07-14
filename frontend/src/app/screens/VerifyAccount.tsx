import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquare, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { AppBackdrop } from '../components/AppBackdrop';
import { AuthShowcase } from '../components/AuthShowcase';
import { api } from '../../services/api';

type VerifyAccountProps = {
  onBackHome: () => void;
  userId?: string | null;
  standalone?: boolean;
};

const channelIcons = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageSquare
};

export function VerifyAccount({ onBackHome, userId, standalone = false }: VerifyAccountProps) {
  const { user, verificationStatus, verifyContact, resendVerification, logout } = useAuth();
  const reduce = useReducedMotion();
  const [fallbackStatus, setFallbackStatus] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyAction, setBusyAction] = useState<'verify' | 'resend' | null>(null);

  const effectiveUserId = user?.id || userId || null;
  const effectiveStatus = verificationStatus || fallbackStatus;

  const channels = useMemo(() => {
    const rawChannels = effectiveStatus?.channels || [];
    return rawChannels.map((channel: any) => ({
      ...channel,
      icon: channelIcons[channel.channel as keyof typeof channelIcons] || Mail
    }));
  }, [effectiveStatus]);

  useEffect(() => {
    if (!standalone || !effectiveUserId) {
      return;
    }

    api.verificationStatus(effectiveUserId)
      .then((response) => setFallbackStatus(response.data || null))
      .catch(() => setFallbackStatus(null));
  }, [standalone, effectiveUserId]);

  useEffect(() => {
    if (channels.length > 0 && !channels.some((channel: any) => channel.channel === selectedChannel)) {
      setSelectedChannel(channels[0].channel);
    }
  }, [channels, selectedChannel]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveUserId) return;
    setError('');
    setSuccess('');
    setBusyAction('verify');

    try {
      const result = await verifyContact({
        userId: effectiveUserId,
        channel: selectedChannel,
        code
      });

      if (result?.accessToken) {
        setSuccess('Tu cuenta ya quedó verificada y activa. Ya puedes continuar dentro de MediConnect.');
      } else {
        setSuccess('Canal verificado correctamente. Si aún falta otro canal, puedes completarlo desde aquí.');
        if (standalone) {
          setFallbackStatus(result?.status || null);
        }
      }
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible verificar el código.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleResend(channel: 'email' | 'sms' | 'whatsapp') {
    if (!effectiveUserId) return;
    setError('');
    setSuccess('');
    setBusyAction('resend');

    try {
      const status = await resendVerification({ userId: effectiveUserId, channel });
      setSelectedChannel(channel);
      if (standalone) {
        setFallbackStatus(status);
      }
      setSuccess(`Reenviamos un nuevo código por ${channel === 'email' ? 'correo' : channel === 'sms' ? 'SMS' : 'WhatsApp'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible reenviar el código.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AppBackdrop>
      <div className="mx-auto grid min-h-screen w-full max-w-[1320px] lg:grid-cols-[1fr_1.02fr]">
        <AuthShowcase
          title="Verifica tu cuenta y activa un acceso seguro a todo tu recorrido clínico."
          description="MediConnect protege cada ingreso con validación de correo y teléfono para asegurar la comunicación transaccional y el acompañamiento de tus citas."
        />

        <section className="flex items-center justify-center p-5 lg:p-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.14)] ring-1 ring-black/[0.04] backdrop-blur sm:p-8 md:p-9"
          >
            <div className="mb-5 flex">
              <button onClick={onBackHome} className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.30)]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-gray-900">Activa tu Cuenta</h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-gray-600">
                Antes de continuar, necesitamos validar tus canales de contacto para recordatorios, pagos y soporte.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                  <p className="text-sm font-medium text-blue-700">Estado general</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {effectiveStatus?.allVerified ? 'Cuenta verificada' : 'Verificación pendiente'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {effectiveStatus?.allVerified
                      ? 'Tus canales están completos. Ya puedes usar MediConnect con total normalidad.'
                      : 'Completa los canales pendientes para activar login completo, recordatorios y comunicaciones transaccionales.'}
                  </p>
                </div>

                <div className="grid gap-3">
                  {channels.length === 0 && (
                    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      Cargando tus canales de contacto...
                    </div>
                  )}
                  {channels.map((channel: any) => {
                    const Icon = channel.icon;
                    const isVerified = Boolean(channel.verifiedAt);
                    const isSelected = selectedChannel === channel.channel;

                    return (
                      <button
                        key={channel.channel}
                        type="button"
                        onClick={() => setSelectedChannel(channel.channel)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={`shrink-0 rounded-2xl p-3 ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                {channel.channel === 'email' ? 'Correo electrónico' : channel.channel === 'sms' ? 'Teléfono SMS' : 'WhatsApp'}
                              </p>
                              <p className="mt-1 break-all text-xs text-slate-500">{channel.destination}</p>
                              <p className="mt-2 text-xs text-slate-500">
                                Intentos: {channel.attemptsCount}/{channel.maxAttempts} · Reenvios: {channel.resendCount}/{channel.maxResends}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 pl-14 sm:pl-0">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verificado
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyAction !== null}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleResend(channel.channel);
                                }}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${busyAction === 'resend' ? 'animate-spin' : ''}`} />
                                Reenviar
                              </button>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Ingresar Código</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Selecciona un canal, ingresa el código OTP y valida tu acceso.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleVerify}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Canal a validar</span>
                    <select
                      value={selectedChannel}
                      onChange={(event) => setSelectedChannel(event.target.value as 'email' | 'sms' | 'whatsapp')}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-gray-900 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      {channels.map((channel: any) => (
                        <option key={channel.channel} value={channel.channel}>
                          {channel.channel === 'email' ? 'Correo electrónico' : channel.channel === 'sms' ? 'SMS' : 'WhatsApp'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Código OTP</span>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-center text-lg tracking-[0.4em] text-gray-900 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </label>

                  {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  {success && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

                  <button
                    disabled={busyAction === 'verify'}
                    aria-busy={busyAction === 'verify'}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.30)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === 'verify' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      'Validar código'
                    )}
                  </button>
                </form>

                {!standalone && (
                  <button
                    onClick={logout}
                    className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Salir y volver más tarde
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </AppBackdrop>
  );
}
