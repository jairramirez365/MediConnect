import { FormEvent, useState } from 'react';
import { Activity, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

type RegisterProps = {
  onGoLogin: () => void;
};

export function Register({ onGoLogin }: RegisterProps) {
  const { register } = useAuth();
  const [role, setRole] = useState<'paciente' | 'medico' | 'comisionista'>('paciente');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setIsSubmitting(true);

    const baseProfile = {
      firstName: String(form.get('firstName') || ''),
      lastName: String(form.get('lastName') || ''),
      documentType: String(form.get('documentType') || 'CC'),
      documentNumber: String(form.get('documentNumber') || '')
    };

    const profileByRole = {
      paciente: {
        ...baseProfile,
        birthDate: String(form.get('birthDate') || '1990-01-01'),
        gender: String(form.get('gender') || 'no_especificado')
      },
      medico: {
        ...baseProfile,
        medicalLicenseNumber: String(form.get('medicalLicenseNumber') || ''),
        consultationFee: Number(form.get('consultationFee') || 0),
        careMode: String(form.get('careMode') || 'virtual'),
        city: String(form.get('city') || ''),
        yearsOfExperience: Number(form.get('yearsOfExperience') || 0),
        professionalBio: String(form.get('professionalBio') || '')
      },
      comisionista: {
        ...baseProfile,
        mainReferralCode: String(form.get('mainReferralCode') || ''),
        baseCommissionPercentage: Number(form.get('baseCommissionPercentage') || 5)
      }
    };

    try {
      await register({
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
        phone: String(form.get('phone') || ''),
        role,
        profile: profileByRole[role],
        currency: 'COP'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl shadow-blue-900/10 md:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
              <p className="mt-2 text-sm text-gray-600">
                Registro conectado al backend. Los médicos quedan pendientes de documentación.
              </p>
            </div>
            <button onClick={onGoLogin} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              Login
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['paciente', 'Paciente'],
                ['medico', 'Médico'],
                ['comisionista', 'Comisionista']
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value as any)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <p className="font-bold">{label}</p>
                  <p className="mt-1 text-xs text-gray-500">Registro inicial</p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field name="firstName" label="Nombres" required />
              <Field name="lastName" label="Apellidos" required />
              <Field name="email" label="Correo electrónico" type="email" required />
              <Field name="password" label="Contraseña" type="password" required placeholder="Mínimo 8 caracteres" />
              <Field name="phone" label="Teléfono" />
              <Field name="documentNumber" label="Número de documento" required />
              <Field name="documentType" label="Tipo de documento" defaultValue="CC" required />

              {role === 'paciente' && (
                <>
                  <Field name="birthDate" label="Fecha de nacimiento" type="date" required />
                  <Field name="gender" label="Sexo" placeholder="femenino, masculino..." />
                </>
              )}

              {role === 'medico' && (
                <>
                  <Field name="medicalLicenseNumber" label="Registro médico" required />
                  <Field name="city" label="Ciudad" required />
                  <Field name="consultationFee" label="Valor consulta" type="number" required />
                  <Field name="yearsOfExperience" label="Años de experiencia" type="number" />
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Modalidad</span>
                    <select name="careMode" className="w-full rounded-xl border border-gray-300 px-4 py-3">
                      <option value="virtual">Virtual</option>
                      <option value="presencial">Presencial</option>
                      <option value="hibrida">Híbrida</option>
                    </select>
                  </label>
                  <Field name="professionalBio" label="Biografía profesional" />
                </>
              )}

              {role === 'comisionista' && (
                <>
                  <Field name="mainReferralCode" label="Código referido principal" required />
                  <Field name="baseCommissionPercentage" label="Porcentaje comisión base" type="number" defaultValue="5" required />
                </>
              )}
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field(props: any) {
  const { label, ...inputProps } = props;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...inputProps}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
