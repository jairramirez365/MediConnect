import { Calendar, Users, DollarSign, Star, Clock, Video } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { appointments, patients, doctors, getAppointmentsByDoctorId, getPatientById } from '../data/mockData';

export function DoctorDashboard() {
  const currentDoctor = doctors[0]; // Dr. Carlos Ramírez
  const doctorAppointments = getAppointmentsByDoctorId(currentDoctor.id);
  const todayAppointments = doctorAppointments.filter(a => a.date === '2026-03-26');
  const upcomingAppointments = doctorAppointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Citas Hoy"
          value={todayAppointments.length}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pacientes Activos"
          value={currentDoctor.patientsCount}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Calificación"
          value={currentDoctor.rating}
          icon={Star}
          color="orange"
          trend={{ value: `${currentDoctor.reviewCount} reseñas`, isPositive: true }}
        />
        <StatCard
          title="Ingresos del Mes"
          value={`€${currentDoctor.monthlyIncome.toLocaleString()}`}
          icon={DollarSign}
          color="purple"
          trend={{ value: '+12.5%', isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Citas de Hoy</h3>
            <span className="text-sm text-gray-500">{todayAppointments.length} citas</span>
          </div>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map(apt => {
                const patient = getPatientById(apt.patientId);
                return (
                  <div key={apt.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {patient?.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{patient?.name}</p>
                      <p className="text-sm text-gray-600">{apt.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{apt.time}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        {apt.type === 'teleconsulta' ? (
                          <>
                            <Video className="w-3 h-3" />
                            <span>Virtual</span>
                          </>
                        ) : (
                          <span>Presencial</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay citas programadas para hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Próximas Consultas</h3>
            <span className="text-sm text-gray-500">{upcomingAppointments.length} pendientes</span>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 4).map(apt => {
              const patient = getPatientById(apt.patientId);
              return (
                <div key={apt.id} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient?.name}</p>
                    <p className="text-sm text-gray-600">{apt.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{apt.date}</p>
                    <p className="text-xs text-gray-500">{apt.time}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Ver Agenda Completa</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium">Gestionar Pacientes</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Configurar Disponibilidad</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Notificaciones</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
            <p className="text-gray-700">Nueva cita agendada con María González para mañana a las 10:00</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
            <p className="text-gray-700">Recibiste una nueva reseña de 5 estrellas de Juan Martínez</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5"></div>
            <p className="text-gray-700">Recordatorio: Actualiza tu disponibilidad para la próxima semana</p>
          </div>
        </div>
      </div>
    </div>
  );
}
