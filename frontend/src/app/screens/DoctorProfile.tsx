import { FileUp, Save, ShieldCheck, Stethoscope } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export function DoctorProfile() {
  const { profile, refreshProfile } = useAuth();
  const [message, setMessage] = useState('');

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('');

    try {
      await api.updateProfile({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        city: String(form.get('city') || ''),
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
      setMessage('Documento cargado. Tu perfil pasa a revision documental cuando aplica.');
      event.currentTarget.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible cargar el documento.');
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
        <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
              <Stethoscope className="h-4 w-4" />
              Perfil profesional
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Completa tu perfil y documentos para quedar listo dentro de MediConnect.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Esta vista concentra tus datos medicos y soporte documental para que el proceso de aprobacion sea claro.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.1)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado actual</p>
            <div className="mt-4">
              <StatusBadge status={profile?.estado_validacion || profile?.validationStatus} />
            </div>
          </div>
        </div>
      </section>

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
            <h3 className="text-xl font-bold text-slate-900">Datos profesionales</h3>
            <p className="text-sm text-slate-500">Informacion visible para operacion, aprobacion y agenda medica.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field name="firstName" label="Nombres" defaultValue={profile?.nombres || ''} />
          <Field name="lastName" label="Apellidos" defaultValue={profile?.apellidos || ''} />
          <Field name="city" label="Ciudad" defaultValue={profile?.ciudad || ''} />
          <Field
            name="consultationFee"
            label="Valor consulta"
            type="number"
            defaultValue={profile?.valor_consulta || profile?.consultationFee || 0}
          />
          <Field
            name="yearsOfExperience"
            label="Anos de experiencia"
            type="number"
            defaultValue={profile?.anos_experiencia || 0}
          />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Biografia profesional</span>
            <textarea
              name="professionalBio"
              defaultValue={profile?.biografia_profesional || ''}
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] transition hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Guardar perfil
        </button>
      </form>

      <form onSubmit={uploadDocument} className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <h3 className="text-xl font-bold text-slate-900">Carga de documentos</h3>
        <p className="mt-1 text-sm text-slate-500">
          Cuando cargues la documentacion requerida, el equipo administrador podra revisarla y aprobar tu activacion.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field name="documentType" label="Tipo de documento" placeholder="tarjeta_profesional" required />
          <Field name="fileName" label="Nombre archivo" placeholder="tarjeta-profesional.pdf" required />
          <Field name="fileUrl" label="URL archivo" placeholder="https://..." required />
        </div>

        <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition hover:bg-slate-800">
          <FileUp className="h-4 w-4" />
          Enviar a revision
        </button>
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
