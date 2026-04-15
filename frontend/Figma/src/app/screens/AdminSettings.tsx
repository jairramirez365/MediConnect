import { Settings, Save, Plus, Trash2, Edit } from 'lucide-react';

export function AdminSettings() {
  const specialties = [
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Medicina General',
    'Neumología',
    'Pediatría',
    'Psiquiatría',
    'Traumatología'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        <p className="text-gray-600 mt-1">Administra parámetros generales de la plataforma</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Configuración General</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Plataforma</label>
              <input
                type="text"
                defaultValue="MediConnect"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
              <input
                type="email"
                defaultValue="contacto@mediconnect.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Soporte</label>
              <input
                type="tel"
                defaultValue="+34 900 123 456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Europe/Madrid (GMT+1)</option>
                <option>Europe/London (GMT+0)</option>
                <option>America/New_York (GMT-5)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Configuración de Citas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración Predeterminada (minutos)</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>30</option>
              <option>45</option>
              <option selected>60</option>
              <option>90</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de Anticipación (días)</label>
            <input
              type="number"
              defaultValue="7"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Inicio Atención</label>
            <input
              type="time"
              defaultValue="08:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora Fin Atención</label>
            <input
              type="time"
              defaultValue="20:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Permitir cancelación de citas con menos de 24h de anticipación</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Enviar recordatorios automáticos 24h antes de la cita</span>
            </label>
          </div>
        </div>
      </div>

      {/* Specialties Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Gestión de Especialidades</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" />
            Nueva Especialidad
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {specialties.map((specialty, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-900">{specialty}</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Configuración de Comisiones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comisión Predeterminada (%)</label>
            <input
              type="number"
              defaultValue="10"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comisión Mínima (€)</label>
            <input
              type="number"
              defaultValue="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Aplicar comisión solo en primera cita del paciente</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
