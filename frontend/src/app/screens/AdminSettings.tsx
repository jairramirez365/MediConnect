import { motion, useReducedMotion } from 'framer-motion';
import { Settings, Save, Plus, Trash2, Edit } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

export function AdminSettings() {
  const reduce = useReducedMotion();

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
      {/* Hero / Header */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,_#1e293b_0%,_#4338ca_45%,_#7c3aed_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(79,70,229,0.30)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Settings className="w-4 h-4" />
            Configuración del sistema
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-black tracking-[-0.03em] md:text-4xl">
            Configuración del Sistema
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-indigo-50 md:text-base">
            Administra parámetros generales de la plataforma
          </p>
        </div>
      </motion.section>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
              <input
                type="email"
                defaultValue="contacto@mediconnect.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Soporte</label>
              <input
                type="tel"
                defaultValue="+34 900 123 456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">Permitir cancelación de citas con menos de 24h de anticipación</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">Enviar recordatorios automáticos 24h antes de la cita</span>
            </label>
          </div>
        </div>
      </div>

      {/* Specialties Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Gestión de Especialidades</h3>
          <button className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comisión Mínima (€)</label>
            <input
              type="number"
              defaultValue="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">Aplicar comisión solo en primera cita del paciente</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center gap-3">
        <button className="px-6 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-all">
          Cancelar
        </button>
        <button className="flex items-center gap-2 px-6 py-2 min-h-[44px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
