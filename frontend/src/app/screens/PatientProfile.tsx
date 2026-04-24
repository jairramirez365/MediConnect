import { Save, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Field } from './DoctorProfile';

export function PatientProfile() {
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
        birthDate: String(form.get('birthDate') || ''),
        gender: String(form.get('gender') || ''),
        bloodType: String(form.get('bloodType') || ''),
        address: String(form.get('address') || ''),
        emergencyContactName: String(form.get('emergencyContactName') || ''),
        emergencyContactPhone: String(form.get('emergencyContactPhone') || ''),
        authorizesCommissionAgentChat: form.get('authorizesCommissionAgentChat') === 'on'
      });
      await refreshProfile();
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible actualizar el perfil.');
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
              <UserRound className="h-4 w-4" />
              Perfil del paciente
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Mantén tu informacion personal y de soporte siempre actualizada.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Esta vista concentra tus datos esenciales, contactos de emergencia y autorizaciones para que la atencion fluya sin fricciones.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/80 px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.1)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cuenta activa</p>
            <p className="mt-3 text-lg font-bold text-slate-900">{profile?.email || 'Paciente MediConnect'}</p>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <form onSubmit={updateProfile} className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="firstName" label="Nombres" defaultValue={profile?.nombres || ''} />
          <Field name="lastName" label="Apellidos" defaultValue={profile?.apellidos || ''} />
          <Field name="birthDate" label="Fecha de nacimiento" type="date" defaultValue={profile?.fecha_nacimiento?.slice?.(0, 10) || ''} />
          <Field name="gender" label="Genero" defaultValue={profile?.sexo || ''} />
          <Field name="bloodType" label="Tipo de sangre" defaultValue={profile?.tipo_sangre || ''} />
          <Field name="address" label="Direccion" defaultValue={profile?.direccion || ''} />
          <Field name="emergencyContactName" label="Contacto de emergencia" defaultValue={profile?.nombre_contacto_emergencia || ''} />
          <Field name="emergencyContactPhone" label="Telefono de emergencia" defaultValue={profile?.telefono_contacto_emergencia || ''} />
          <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 md:col-span-2">
            <input
              name="authorizesCommissionAgentChat"
              type="checkbox"
              defaultChecked={Boolean(profile?.autorizo_participacion_comisionista_chat)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm leading-6 text-slate-600">
              Autorizo la participacion del comisionista o agente de servicio dentro del chat cuando necesite acompanamiento adicional.
            </span>
          </label>
        </div>

        <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] transition hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
