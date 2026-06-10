import { FormEvent, useEffect, useState } from 'react';
import { Activity, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { api } from '../../services/api';
import { AppBackdrop } from '../components/AppBackdrop';
import { AuthShowcase } from '../components/AuthShowcase';
import { ColombiaLocationFields } from '../components/ColombiaLocationFields';

type RegisterProps = {
  onGoLogin: () => void;
  onBackHome: () => void;
};

export function Register({ onGoLogin, onBackHome }: RegisterProps) {
  const { register } = useAuth();
  const [role, setRole] = useState<'paciente' | 'medico' | 'comisionista'>('paciente');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [municipality, setMunicipality] = useState('');

  useEffect(() => {
    api.specialties()
      .then((response) => setSpecialties(response.data || []))
      .catch(() => setSpecialties([]));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setIsSubmitting(true);

    const baseProfile = {
      firstName: String(form.get('firstName') || ''),
      lastName: String(form.get('lastName') || ''),
      documentType: String(form.get('documentType') || 'CC'),
      documentNumber: String(form.get('documentNumber') || ''),
      department: departmentName,
      municipality
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
        yearsOfExperience: Number(form.get('yearsOfExperience') || 0),
        professionalBio: String(form.get('professionalBio') || ''),
        specialtyIds: [String(form.get('primarySpecialtyId') || ''), String(form.get('secondarySpecialtyId') || '')].filter(Boolean)
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
    <AppBackdrop>
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.08fr]">
        <AuthShowcase
          title="Crea tu cuenta y continua dentro de una experiencia consistente."
          description="Registro, descubrimiento y producto interno deben sentirse como una sola aplicacion. Esta pantalla ya forma parte de ese mismo ecosistema."
        />

        <div className="flex items-center justify-center p-5 lg:p-8">
          <div className="w-full max-w-3xl rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.12)] backdrop-blur md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Registro conectado al backend. Los medicos quedan pendientes de documentacion.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={onBackHome} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
                  <ArrowLeft className="h-4 w-4" />
                  Inicio
                </button>
                <button onClick={onGoLogin} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
                  <ArrowLeft className="h-4 w-4" />
                  Login
                </button>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['paciente', 'Paciente'],
                  ['medico', 'Medico'],
                  ['comisionista', 'Gestor']
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
                <Field name="email" label="Correo electronico" type="email" required />
                <Field name="password" label="Contrasena" type="password" required placeholder="Minimo 8 caracteres" />
                <Field name="phone" label="Telefono" />
                <Field name="documentNumber" label="Numero de documento" required />
                <Field name="documentType" label="Tipo de documento" defaultValue="CC" required />
                <ColombiaLocationFields
                  departmentCode={departmentCode}
                  departmentName={departmentName}
                  municipality={municipality}
                  onDepartmentChange={({ code, name }) => {
                    const departmentChanged = name !== departmentName;
                    setDepartmentCode(code);
                    setDepartmentName(name);
                    if (departmentChanged) {
                      setMunicipality('');
                    }
                  }}
                  onMunicipalityChange={setMunicipality}
                  required
                />

                {role === 'paciente' && (
                  <>
                    <Field name="birthDate" label="Fecha de nacimiento" type="date" required />
                    <Field name="gender" label="Sexo" placeholder="femenino, masculino..." />
                  </>
                )}

                {role === 'medico' && (
                  <>
                    <Field name="medicalLicenseNumber" label="Registro medico" required />
                    <Field name="consultationFee" label="Valor consulta" type="number" required />
                    <Field name="yearsOfExperience" label="Anos de experiencia" type="number" />
                    <SelectField name="primarySpecialtyId" label="Especialidad principal" options={specialties} required />
                    <SelectField name="secondarySpecialtyId" label="Segunda especialidad" options={specialties} />
                    <Field name="professionalBio" label="Biografia profesional" />
                  </>
                )}

                {role === 'comisionista' && (
                  <>
                    <Field name="mainReferralCode" label="Codigo referido principal" required />
                    <Field name="baseCommissionPercentage" label="Porcentaje comision base" type="number" defaultValue="5" required />
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
    </AppBackdrop>
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

function SelectField({ label, options, ...props }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Selecciona una opcion</option>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}
