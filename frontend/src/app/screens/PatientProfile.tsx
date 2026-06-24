import { Save, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { ColombiaLocationFields } from '../components/ColombiaLocationFields';
import { Field } from './DoctorProfile';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PatientProfile() {
  const { profile, refreshProfile } = useAuth();
  const reduce = useReducedMotion();
  const [message, setMessage] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [municipality, setMunicipality] = useState('');

  useEffect(() => {
    setDepartmentCode('');
    setDepartmentName(String(profile?.departamento || ''));
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
        birthDate: String(form.get('birthDate') || ''),
        gender: String(form.get('gender') || ''),
        bloodType: String(form.get('bloodType') || ''),
        department: departmentName,
        municipality,
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
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#be123c_0%,_#db2777_45%,_#9333ea_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(219,39,119,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <UserRound className="h-4 w-4" />
            Perfil del paciente
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Mantén tu información personal y de soporte siempre actualizada.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-rose-50 md:text-base">
            Esta vista concentra tus datos esenciales, contactos de emergencia y autorizaciones para que la atención fluya sin fricciones.
          </p>
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-white/20 bg-white/15 px-5 py-4 text-center backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-50/90">Cuenta activa</p>
            <p className="mt-1 break-words text-sm font-bold leading-6 text-white sm:text-base">{profile?.email || 'Paciente MediConnect'}</p>
          </div>
        </div>
      </motion.section>

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
          <Field name="gender" label="Género" defaultValue={profile?.sexo || ''} />
          <Field name="bloodType" label="Tipo de sangre" defaultValue={profile?.tipo_sangre || ''} />
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
          <Field name="address" label="Dirección" defaultValue={profile?.direccion || ''} />
          <Field name="emergencyContactName" label="Contacto de emergencia" defaultValue={profile?.nombre_contacto_emergencia || ''} />
          <Field name="emergencyContactPhone" label="Teléfono de emergencia" defaultValue={profile?.telefono_contacto_emergencia || ''} />
          <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 md:col-span-2">
            <input
              name="authorizesCommissionAgentChat"
              type="checkbox"
              defaultChecked={Boolean(profile?.autorizo_participacion_comisionista_chat)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm leading-6 text-slate-600">
              Autorizo la participación del gestor o agente de servicio dentro del chat cuando necesite acompañamiento adicional.
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-violet-600 px-7 py-3 font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition hover:from-rose-700 hover:via-fuchsia-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2">
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
