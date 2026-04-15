import { Mail, Phone, MapPin, Edit, AlertCircle, User, Heart } from 'lucide-react';
import { patients } from '../data/mockData';

export function PatientProfile() {
  const patient = patients[0]; // María González

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600 mt-1">{patient.age} años • {patient.gender}</p>
              <p className="text-sm text-gray-500 mt-1">Tipo de sangre: {patient.bloodType}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Edit className="w-4 h-4" />
            Editar Perfil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{patient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{patient.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{patient.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información Médica</h2>

            {/* Chronic Diseases */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium text-gray-900">Enfermedades Crónicas</h3>
              </div>
              {patient.chronicDiseases.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.chronicDiseases.map((disease, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
                      {disease}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Ninguna registrada</p>
              )}
            </div>

            {/* Allergies */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-gray-900">Alergias</h3>
              </div>
              {patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Ninguna registrada</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contacto de Emergencia</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{patient.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Relación</p>
                <p className="font-medium text-gray-900">{patient.emergencyContact.relationship}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{patient.emergencyContact.phone}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-bold mb-4">Datos Básicos</h2>
            <div className="space-y-4">
              <div>
                <p className="text-blue-100 text-sm">Edad</p>
                <p className="text-2xl font-bold">{patient.age} años</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Tipo de Sangre</p>
                <p className="text-2xl font-bold">{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Género</p>
                <p className="text-2xl font-bold">{patient.gender}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
