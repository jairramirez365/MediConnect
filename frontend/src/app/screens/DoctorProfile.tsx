import { FormEvent, useState } from 'react';
import { FileUp, Save } from 'lucide-react';
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
        careMode: String(form.get('careMode') || 'virtual'),
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
      setMessage('Documento cargado. Tu perfil pasa a revisión documental si aplica.');
      event.currentTarget.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No fue posible cargar el documento.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mi Perfil Médico</h2>
            <p className="mt-1 text-gray-600">Completa tu información y documentos para quedar activo.</p>
          </div>
          <StatusBadge status={profile?.estado_validacion || profile?.validationStatus} />
        </div>
      </div>

      {message && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

      <form onSubmit={updateProfile} className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Datos profesionales</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="firstName" label="Nombres" defaultValue={profile?.nombres || ''} />
          <Field name="lastName" label="Apellidos" defaultValue={profile?.apellidos || ''} />
          <Field name="city" label="Ciudad" defaultValue={profile?.ciudad || ''} />
          <Field name="consultationFee" label="Valor consulta" type="number" defaultValue={profile?.valor_consulta || profile?.consultationFee || 0} />
          <Field name="yearsOfExperience" label="Años de experiencia" type="number" defaultValue={profile?.anos_experiencia || 0} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Modalidad</span>
            <select name="careMode" defaultValue={profile?.modalidad_atencion || profile?.careMode || 'virtual'} className="w-full rounded-xl border border-gray-300 px-4 py-3">
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-700">Biografía profesional</span>
            <textarea name="professionalBio" defaultValue={profile?.biografia_profesional || ''} className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
        </div>
        <button className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Guardar perfil
        </button>
      </form>

      <form onSubmit={uploadDocument} className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Carga de documentos</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="documentType" label="Tipo de documento" placeholder="tarjeta_profesional" required />
          <Field name="fileName" label="Nombre archivo" placeholder="tarjeta-profesional.pdf" required />
          <Field name="fileUrl" label="URL archivo" placeholder="https://..." required />
        </div>
        <button className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          <FileUp className="h-4 w-4" />
          Enviar a revisión
        </button>
      </form>
    </div>
  );
}

export function Field(props: any) {
  const { label, ...inputProps } = props;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <input {...inputProps} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}
