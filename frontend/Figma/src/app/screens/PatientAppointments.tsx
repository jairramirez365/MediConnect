import { Calendar, Clock, Video, MapPin, Star, Plus } from 'lucide-react';
import { useState } from 'react';
import { appointments, getAppointmentsByPatientId, getDoctorById } from '../data/mockData';

export function PatientAppointments() {
  const currentPatient = 'p1';
  const patientAppointments = getAppointmentsByPatientId(currentPatient);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [showRating, setShowRating] = useState(false);

  const getStatusBadge = (status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes[status as keyof typeof classes]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Citas</h2>
          <p className="text-gray-600 mt-1">Gestiona tus citas médicas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Todas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Próximas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Completadas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Canceladas</button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 gap-4">
        {patientAppointments.map(apt => {
          const doctor = getDoctorById(apt.doctorId);
          if (!doctor) return null;

          return (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {doctor.name.split(' ')[1].charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                      {getStatusBadge(apt.status)}
                    </div>
                    <p className="text-blue-600 font-medium mb-3">{doctor.specialty}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        {apt.type === 'teleconsulta' ? (
                          <>
                            <Video className="w-4 h-4" />
                            <span>Teleconsulta</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>Presencial</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Motivo:</span> {apt.reason}
                      </p>
                    </div>

                    {apt.diagnosis && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Diagnóstico:</span> {apt.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {apt.status === 'confirmed' && apt.type === 'teleconsulta' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Unirse
                    </button>
                  )}
                  {apt.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedDoctor(doctor.name);
                        setShowRating(true);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Calificar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Calificar Consulta</h3>
            <p className="text-gray-600 mb-4">¿Cómo fue tu experiencia con {selectedDoctor}?</p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(rating => (
                <button key={rating} className="w-12 h-12 hover:scale-110 transition-transform">
                  <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Cuéntanos sobre tu experiencia (opcional)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
            />

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Enviar Calificación
              </button>
              <button
                onClick={() => setShowRating(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
