import { Plus, FileText, Download, Calendar, User, Pill } from 'lucide-react';
import { useState } from 'react';
import { prescriptions, getPatientById, getDoctorById } from '../data/mockData';

export function DoctorPrescriptions() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recetario Digital</h2>
          <p className="text-gray-600 mt-1">Gestiona y genera recetas médicas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nueva Receta
        </button>
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map(prescription => {
          const patient = getPatientById(prescription.patientId);
          const doctor = getDoctorById(prescription.doctorId);

          return (
            <div key={prescription.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">Receta #{prescription.id}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Activa</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{patient?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{prescription.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>

              {/* Medications */}
              <div className="space-y-3">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Pill className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{med.name}</h4>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Dosificación:</span>
                            <p className="font-medium text-gray-900">{med.dosage}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Frecuencia:</span>
                            <p className="font-medium text-gray-900">{med.frequency}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Duración:</span>
                            <p className="font-medium text-gray-900">{med.duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {prescription.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Indicaciones:</span> {prescription.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nueva Receta Médica</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Seleccionar paciente...</option>
                  <option>María González</option>
                  <option>Juan Martínez</option>
                  <option>Carmen Rodríguez</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicamento</label>
                <input
                  type="text"
                  placeholder="Nombre del medicamento"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosificación</label>
                  <input
                    type="text"
                    placeholder="ej: 10mg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
                  <input
                    type="text"
                    placeholder="ej: Cada 8 horas"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
                <input
                  type="text"
                  placeholder="ej: 7 días"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Indicaciones adicionales</label>
                <textarea
                  rows={3}
                  placeholder="Instrucciones especiales para el paciente..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generar Receta
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
