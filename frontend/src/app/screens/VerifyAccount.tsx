import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail, MessageSquare, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
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
        setSuccess('Tu cuenta ya quedo verificada y activa. Ya puedes continuar dentro de MediConnect.');
      } else {
        setSuccess('Canal verificado correctamente. Si aun falta otro canal, puedes completarlo desde aqui.');
        if (standalone) {
          setFallbackStatus(result?.status || null);
        }
      }
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible verificar el codigo.');
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
      setSuccess(`Reenviamos un nuevo codigo por ${channel === 'email' ? 'correo' : channel === 'sms' ? 'SMS' : 'WhatsApp'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible reenviar el codigo.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AppBackdrop>
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.02fr]">
        <AuthShowcase
          title="Verifica tu cuenta y activa un acceso seguro a todo tu recorrido clinico."
          description="MediConnect protege cada ingreso con validacion de correo y telefono para asegurar la comunicacion transaccional y el acompanamiento de tus citas."
        />

        <section className="flex items-center justify-center p-5 lg:p-8">
          <div className="w-full max-w-3xl rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.12)] backdrop-blur md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Activa tu cuenta</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Antes de continuar, necesitamos validar tus canales de contacto para recordatorios, pagos y soporte.
                </p>
              </div>
              <button onClick={onBackHome} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                  <p className="text-sm font-medium text-blue-700">Estado general</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {effectiveStatus?.allVerified ? 'Cuenta verificada' : 'Verificacion pendiente'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {effectiveStatus?.allVerified
                      ? 'Tus canales estan completos. Ya puedes usar MediConnect con total normalidad.'
                      : 'Completa los canales pendientes para activar login completo, recordatorios y comunicaciones transaccionales.'}
                  </p>
                </div>

                <div className="grid gap-3">
                  {channels.map((channel: any) => {
                    const Icon = channel.icon;
                    const isVerified = Boolean(channel.verifiedAt);
                    const isSelected = selectedChannel === channel.channel;

                    return (
                      <button
                        key={channel.channel}
                        type="button"
                        onClick={() => setSelectedChannel(channel.channel)}
                        className={`rounded-3xl border p-4 text-left transition ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`rounded-2xl p-3 ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {channel.channel === 'email' ? 'Correo electronico' : channel.channel === 'sms' ? 'Telefono SMS' : 'WhatsApp'}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">{channel.destination}</p>
                              <p className="mt-2 text-xs text-slate-500">
                                Intentos: {channel.attemptsCount}/{channel.maxAttempts} · Reenvios: {channel.resendCount}/{channel.maxResends}
                              </p>
                            </div>
                          </div>
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verificado
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleResend(channel.channel);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Reenviar
                            </button>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Ingresar codigo</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Selecciona un canal, ingresa el codigo OTP y valida tu acceso.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleVerify}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Canal a validar</span>
                    <select
                      value={selectedChannel}
                      onChange={(event) => setSelectedChannel(event.target.value as 'email' | 'sms' | 'whatsapp')}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {channels.map((channel: any) => (
                        <option key={channel.channel} value={channel.channel}>
                          {channel.channel === 'email' ? 'Correo electronico' : channel.channel === 'sms' ? 'SMS' : 'WhatsApp'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Codigo OTP</span>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 tracking-[0.4em] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </label>

                  {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

                  <button
                    disabled={busyAction === 'verify'}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {busyAction === 'verify' ? 'Validando...' : 'Validar codigo'}
                  </button>
                </form>

                {!standalone && (
                  <button
                    onClick={logout}
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Salir y volver mas tarde
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppBackdrop>
  );
}
