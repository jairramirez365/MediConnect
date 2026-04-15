import { FormEvent, useState } from 'react';
import { Activity, ArrowRight, Lock, Mail, Stethoscope } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

type LoginProps = {
  onGoRegister: () => void;
};

export function Login({ onGoRegister }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@mediconnect.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-3 shadow-xl shadow-blue-600/20">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MediConnect</h1>
              <p className="text-sm text-gray-500">Atención médica coordinada</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Stethoscope className="h-4 w-4" />
              Plataforma health-tech multirol
            </div>
            <h2 className="text-5xl font-bold leading-tight text-gray-950">
              Gestión clínica, citas y pacientes en un solo lugar.
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Conecta médicos, pacientes, administradores y comisionistas con flujos reales,
              seguros y listos para escalar.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['Agenda médica', 'Pagos básicos', 'Historia clínica'].map((item) => (
              <div key={item} className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-gray-900">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl shadow-blue-900/10">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 lg:hidden">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
              <p className="mt-2 text-sm text-gray-600">
                Ingresa con un usuario semilla o con una cuenta creada desde el registro.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Correo electrónico</span>
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
                <span className="mb-2 block text-sm font-medium text-gray-700">Contraseña</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Tu contraseña"
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
              ¿No tienes cuenta?{' '}
              <button className="font-medium text-blue-600 hover:text-blue-700" onClick={onGoRegister}>
                Crear registro
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
