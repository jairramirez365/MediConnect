import { FileUp, Save, ShieldCheck, Stethoscope } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ColombiaLocationFields } from '../components/ColombiaLocationFields';

const EASE = [0.16, 1, 0.3, 1] as const;

export function DoctorProfile() {
  const { profile, refreshProfile } = useAuth();
  const reduce = useReducedMotion();
  const [message, setMessage] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [municipality, setMunicipality] = useState('');

  useEffect(() => {
    setDepartmentName(String(profile?.departamento || ''));
    setDepartmentCode('');
    setMunicipality(String(profile?.municipio || ''));
  }, [profile?.departamento, profile?.municipio]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('');

    try {
      await api.updateProfile({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        department: departmentName,
        municipality,
        consultationFee: Number(form.get('consultationFee') || 0),
        yearsOfExperience: Number(form.get('yearsOfExperience') || 0),
        professionalBio: String(form.get('professionalBio') || '')
      });
      await refreshProfile();
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible actualizar el perfil.');
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('');

    try {
      await api.uploadDoctorDocument({
        documentType: String(form.get('documentType') || ''),
        fileName: String(form.get('fileName') || ''),
        fileUrl: String(form.get('fileUrl') || '')
      });
      await refreshProfile();
      setMessage('Documento cargado. Tu perfil pasa a revisión documental cuando aplica.');
      event.currentTarget.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible cargar el documento.');
    }
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#6d28d9_0%,_#9333ea_45%,_#c026d3_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(147,51,234,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Stethoscope className="h-4 w-4" />
            Perfil profesional
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Completa tu perfil y documentos para quedar listo dentro de MediConnect.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-fuchsia-50 md:text-base">
            Esta vista concentra tus datos médicos y soporte documental para que el proceso de aprobación sea claro.
          </p>
          <div className="mt-6 inline-flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-50/90">Estado actual</p>
            <StatusBadge status={profile?.estado_validacion || profile?.validationStatus} />
          </div>
        </div>
      </motion.section>

      {message && (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <form onSubmit={updateProfile} className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Datos Profesionales</h3>
            <p className="text-sm text-slate-500">Información visible para operación, aprobación y agenda médica.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field name="firstName" label="Nombres" defaultValue={profile?.nombres || ''} />
          <Field name="lastName" label="Apellidos" defaultValue={profile?.apellidos || ''} />
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
          />
          <Field
            name="consultationFee"
            label="Valor consulta"
            type="number"
            defaultValue={profile?.valor_consulta || profile?.consultationFee || 0}
          />
          <Field
            name="yearsOfExperience"
            label="Años de experiencia"
            type="number"
            defaultValue={profile?.anos_experiencia || 0}
          />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Biografía profesional</span>
            <textarea
              name="professionalBio"
              defaultValue={profile?.biografia_profesional || ''}
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3 font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition hover:from-violet-700 hover:to-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2">
            <Save className="h-4 w-4" />
            Guardar perfil
          </button>
        </div>
      </form>

      <form onSubmit={uploadDocument} className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <h3 className="text-xl font-bold text-slate-900">Carga de Documentos</h3>
        <p className="mt-1 text-sm text-slate-500">
          Cuando cargues la documentación requerida, el equipo administrador podrá revisarla y aprobar tu activación.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field name="documentType" label="Tipo de documento" placeholder="tarjeta_profesional" required />
          <Field name="fileName" label="Nombre archivo" placeholder="tarjeta-profesional.pdf" required />
          <Field name="fileUrl" label="URL archivo" placeholder="https://..." required />
        </div>

        <div className="mt-6 flex justify-center">
          <button className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 px-7 py-3 font-semibold text-white shadow-lg shadow-violet-700/25 transition hover:from-indigo-700 hover:to-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
            <FileUp className="h-4 w-4" />
            Enviar a revisión
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field(props: any) {
  const { label, ...inputProps } = props;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...inputProps}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
