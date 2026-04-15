import { Calendar, Clock, Video, MapPin, Phone, FileText, Check, X } from 'lucide-react';
import { appointments, getAppointmentsByDoctorId, getPatientById, doctors } from '../data/mockData';

export function DoctorAppointments() {
  const currentDoctor = doctors[0];
  const doctorAppointments = getAppointmentsByDoctorId(currentDoctor.id);

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
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Todas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Pendientes</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Confirmadas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Completadas</button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Canceladas</button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 gap-4">
        {doctorAppointments.map(apt => {
          const patient = getPatientById(apt.patientId);
          if (!patient) return null;

          return (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Patient Info */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {patient.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{patient.phone}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {apt.status === 'confirmed' && apt.type === 'teleconsulta' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Video className="w-4 h-4" />
                      Iniciar Consulta
                    </button>
                  )}
                  {apt.status === 'pending' && (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Check className="w-4 h-4" />
                        Confirmar
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                      <FileText className="w-4 h-4" />
                      Ver Historia
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
