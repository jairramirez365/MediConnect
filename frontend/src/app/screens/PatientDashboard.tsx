import { Calendar, FileText, CreditCard, Users, Clock, Video } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { appointments, getAppointmentsByPatientId, getDoctorById, payments } from '../data/mockData';

export function PatientDashboard() {
  const currentPatient = 'p1'; // María González
  const patientAppointments = getAppointmentsByPatientId(currentPatient);
  const upcomingAppointments = patientAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
  const completedAppointments = patientAppointments.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenida, María!</h1>
        <p className="text-blue-100">Tu salud es nuestra prioridad. Aquí está un resumen de tu actividad médica.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Próximas Citas"
          value={upcomingAppointments.length}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Citas Completadas"
          value={completedAppointments.length}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Médicos Consultados"
          value={new Set(patientAppointments.map(a => a.doctorId)).size}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pagos Realizados"
          value={`€${payments.filter(p => p.patientId === currentPatient).reduce((sum, p) => sum + p.amount, 0)}`}
          icon={CreditCard}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Próximas Citas</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver todas</button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(apt => {
                const doctor = getDoctorById(apt.doctorId);
                return (
                  <div key={apt.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {doctor?.name.charAt(3)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doctor?.name}</p>
                        <p className="text-sm text-gray-600">{doctor?.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                    {apt.type === 'teleconsulta' && (
                      <div className="mt-3">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          <Video className="w-4 h-4" />
                          Unirse a Teleconsulta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tienes citas programadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="space-y-4">
            {completedAppointments.slice(0, 3).map(apt => {
              const doctor = getDoctorById(apt.doctorId);
              return (
                <div key={apt.id} className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Consulta con {doctor?.name}</p>
                    <p className="text-sm text-gray-600">{apt.diagnosis}</p>
                    <p className="text-xs text-gray-500 mt-1">{apt.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-6 h-6" />
            <span className="font-medium text-sm">Buscar Médicos</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <Calendar className="w-6 h-6" />
            <span className="font-medium text-sm">Agendar Cita</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <FileText className="w-6 h-6" />
            <span className="font-medium text-sm">Mi Historial</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <CreditCard className="w-6 h-6" />
            <span className="font-medium text-sm">Mis Pagos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
