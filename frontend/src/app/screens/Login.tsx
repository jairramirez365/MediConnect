import { FormEvent, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowLeft, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { AppBackdrop } from '../components/AppBackdrop';
import { AuthShowcase } from '../components/AuthShowcase';
import { ApiError } from '../../services/api';

type LoginProps = {
  onGoRegister: () => void;
  onBackHome: () => void;
  onRequireVerification: (userId: string) => void;
};

export function Login({ onGoRegister, onBackHome, onRequireVerification }: LoginProps) {
  const { login } = useAuth();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError && err.details?.requiresVerification && err.details?.userId) {
        onRequireVerification(err.details.userId);
        return;
      }
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppBackdrop>
      <div className="mx-auto grid min-h-screen w-full max-w-[1240px] lg:grid-cols-[1.05fr_0.95fr]">
        <AuthShowcase
          title="Gestión clínica, citas y pacientes en una experiencia más humana."
          description="El acceso a MediConnect también debe sentirse parte del mismo recorrido visual: claro, confiable y con continuidad hacia el producto real."
        />

        <section className="flex items-center justify-center p-5 lg:p-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-[34px] border border-white/80 bg-white/95 p-8 shadow-[0_28px_90px_rgba(37,99,235,0.14)] ring-1 ring-black/[0.04] backdrop-blur sm:p-9"
          >
            <div className="mb-5 flex">
              <button onClick={onBackHome} className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_14px_30px_rgba(37,99,235,0.30)]">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-gray-900">Iniciar Sesión</h2>
              <p className="mt-2 max-w-sm text-sm leading-7 text-gray-600">
                Ingresa con tu cuenta para continuar con tu experiencia en MediConnect.
              </p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Correo electrónico</span>
                <div className="group relative">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-600" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Contraseña</span>
                <div className="group relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-600" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Tu contraseña"
                  />
                </div>
              </label>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <motion.button
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                whileHover={reduce || isSubmitting ? undefined : { scale: 1.02 }}
                whileTap={reduce || isSubmitting ? undefined : { scale: 0.98 }}
                className="group mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.30)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    Entrar a MediConnect
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-7 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={onGoRegister}
                className="inline-flex items-center rounded-md px-1 py-0.5 font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                Crear registro
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </AppBackdrop>
  );
}
