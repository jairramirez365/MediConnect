import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="mt-1 text-gray-600">Actualiza datos personales y autorizaciones de soporte.</p>
      </div>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      <form onSubmit={updateProfile} className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="firstName" label="Nombres" defaultValue={profile?.nombres || ''} />
          <Field name="lastName" label="Apellidos" defaultValue={profile?.apellidos || ''} />
          <Field name="birthDate" label="Fecha nacimiento" type="date" defaultValue={profile?.fecha_nacimiento?.slice?.(0, 10) || ''} />
          <Field name="gender" label="Sexo" defaultValue={profile?.sexo || ''} />
          <Field name="bloodType" label="Tipo de sangre" defaultValue={profile?.tipo_sangre || ''} />
          <Field name="address" label="Dirección" defaultValue={profile?.direccion || ''} />
          <Field name="emergencyContactName" label="Contacto emergencia" defaultValue={profile?.nombre_contacto_emergencia || ''} />
          <Field name="emergencyContactPhone" label="Teléfono emergencia" defaultValue={profile?.telefono_contacto_emergencia || ''} />
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 md:col-span-2">
            <input name="authorizesCommissionAgentChat" type="checkbox" defaultChecked={Boolean(profile?.autorizo_participacion_comisionista_chat)} />
            <span className="text-sm text-gray-700">Autorizo participación del comisionista/agente de servicio en el chat si lo requiero.</span>
          </label>
        </div>
        <button className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
