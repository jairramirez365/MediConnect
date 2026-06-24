import { FormEvent, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowLeft, Handshake, HeartPulse, Loader2, Stethoscope, UserPlus } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { api } from '../../services/api';
import { AppBackdrop } from '../components/AppBackdrop';
import { AuthShowcase } from '../components/AuthShowcase';
import { ColombiaLocationFields } from '../components/ColombiaLocationFields';

type RegisterProps = {
  onGoLogin: () => void;
  onBackHome: () => void;
};

const roleOptions = [
  { value: 'paciente', label: 'Paciente', icon: HeartPulse },
  { value: 'medico', label: 'Medico', icon: Stethoscope },
  { value: 'comisionista', label: 'Gestor', icon: Handshake }
] as const;

export function Register({ onGoLogin, onBackHome }: RegisterProps) {
  const { register } = useAuth();
  const reduce = useReducedMotion();
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
      <div className="mx-auto grid min-h-screen w-full max-w-[1320px] lg:grid-cols-[1fr_1.08fr]">
        <AuthShowcase
          title="Crea tu cuenta y continua dentro de una experiencia consistente."
          description="Registro, descubrimiento y producto interno deben sentirse como una sola aplicacion. Esta pantalla ya forma parte de ese mismo ecosistema."
        />

        <div className="flex items-center justify-center p-5 lg:p-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.14)] ring-1 ring-black/[0.04] backdrop-blur sm:p-8 md:p-9"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <button onClick={onBackHome} className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </button>
              <button onClick={onGoLogin} className="inline-flex min-h-[44px] items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                Login
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_14px_30px_rgba(37,99,235,0.30)]">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-gray-900">Crear cuenta</h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-gray-600">
                Registro conectado al backend. Los medicos quedan pendientes de documentacion.
              </p>
            </div>

            <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-3">
                {roleOptions.map(({ value, label, icon: Icon }) => {
                  const active = role === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      aria-pressed={active}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        active
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className={`block font-bold ${active ? 'text-blue-700' : 'text-gray-900'}`}>{label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">Registro inicial</span>
                      </span>
                    </motion.button>
                  );
                })}
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

              {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <motion.button
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                whileHover={reduce || isSubmitting ? undefined : { scale: 1.01 }}
                whileTap={reduce || isSubmitting ? undefined : { scale: 0.99 }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.30)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Crear cuenta
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
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
        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Selecciona una opcion</option>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}
