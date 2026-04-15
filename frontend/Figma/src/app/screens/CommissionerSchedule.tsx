import { Calendar, Plus, Users } from 'lucide-react';
import { doctors, patients } from '../data/mockData';

export function CommissionerSchedule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda de Médicos</h2>
          <p className="text-gray-600 mt-1">Visualiza la disponibilidad y agenda citas para tus pacientes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Agendar Cita
        </button>
      </div>

      {/* Quick Schedule Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Agendar Nueva Cita</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Seleccionar médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
            <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de consulta</label>
            <textarea
              rows={3}
              placeholder="Describe el motivo de la consulta..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Agendar Cita
        </button>
      </div>

      {/* Doctors Availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {doctor.name.split(' ')[1].charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                <p className="text-sm text-blue-600">{doctor.specialty}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Disponibilidad</span>
              </div>
              <p className="text-sm text-gray-600">{doctor.availability}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Tarifa</p>
                <p className="text-lg font-bold text-gray-900">€{doctor.consultationFee}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Ver Agenda
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
