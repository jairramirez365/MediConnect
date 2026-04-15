import { Search, FileText, Phone, Mail, AlertCircle } from 'lucide-react';
import { patients, getMedicalRecordsByPatientId, getAppointmentsByPatientId } from '../data/mockData';

export function DoctorPatients() {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente por nombre, email o teléfono..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map(patient => {
          const medicalRecords = getMedicalRecordsByPatientId(patient.id);
          const appointments = getAppointmentsByPatientId(patient.id);

          return (
            <div key={patient.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.age} años • {patient.gender}</p>
                  <p className="text-xs text-gray-500 mt-1">Tipo: {patient.bloodType}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone}</span>
                </div>
              </div>

              {/* Chronic Diseases */}
              {patient.chronicDiseases.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Enfermedades crónicas:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicDiseases.map((disease, idx) => (
                      <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {patient.allergies.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">Alergias:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                  <p className="text-xs text-gray-600">Citas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{medicalRecords.length}</p>
                  <p className="text-xs text-gray-600">Registros</p>
                </div>
              </div>

              {/* Action */}
              <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FileText className="w-4 h-4" />
                Ver Historia Clínica
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
