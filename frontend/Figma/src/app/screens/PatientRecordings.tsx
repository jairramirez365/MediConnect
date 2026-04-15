import { Video, Calendar, Clock, Download, Play } from 'lucide-react';
import { appointments, getAppointmentsByPatientId, getDoctorById } from '../data/mockData';

export function PatientRecordings() {
  const currentPatient = 'p1';
  const completedTeleconsults = getAppointmentsByPatientId(currentPatient).filter(
    apt => apt.status === 'completed' && apt.type === 'teleconsulta'
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Teleconsultas</h2>
        <p className="text-gray-600 mt-1">Accede a las grabaciones de tus consultas virtuales</p>
      </div>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedTeleconsults.map(apt => {
          const doctor = getDoctorById(apt.doctorId);
          return (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-gray-900 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-75 rounded text-white text-xs font-mono">
                  28:45
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {doctor?.name.split(' ')[1].charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{doctor?.name}</p>
                    <p className="text-sm text-blue-600">{doctor?.specialty}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{apt.time}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    <span className="font-medium text-gray-900">Diagnóstico:</span> {apt.diagnosis || apt.reason}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Play className="w-4 h-4" />
                    Reproducir
                  </button>
                  <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {completedTeleconsults.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tienes teleconsultas grabadas aún</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Sobre las grabaciones</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Las teleconsultas se graban automáticamente para tu referencia médica.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Puedes acceder a las grabaciones en cualquier momento durante 12 meses.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Las grabaciones están protegidas y solo tú y tu médico tienen acceso.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
