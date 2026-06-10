import { FormEvent, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, Lock, Mail } from 'lucide-react';
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
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppBackdrop>
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <AuthShowcase
          title="Gestion clinica, citas y pacientes en una experiencia mas humana."
          description="El acceso a MediConnect tambien debe sentirse parte del mismo recorrido visual: claro, confiable y con continuidad hacia el producto real."
        />

        <section className="flex items-center justify-center p-5 lg:p-8">
          <div className="w-full max-w-md rounded-[34px] border border-white/80 bg-white/92 p-8 shadow-[0_28px_90px_rgba(37,99,235,0.12)] backdrop-blur">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 lg:hidden">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Iniciar sesion</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Ingresa con tu cuenta para continuar con tu experiencia en MediConnect.
                </p>
              </div>
              <button onClick={onBackHome} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Correo electronico</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Contrasena</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Tu contrasena"
                  />
                </div>
              </label>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Validando...' : 'Entrar a MediConnect'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              No tienes cuenta?{' '}
              <button className="font-medium text-blue-600 hover:text-blue-700" onClick={onGoRegister}>
                Crear registro
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppBackdrop>
  );
}
