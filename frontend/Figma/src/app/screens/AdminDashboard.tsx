import { Users, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { doctors, patients, appointments, payments } from '../data/mockData';

export function AdminDashboard() {
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const thisMonthAppointments = appointments.filter(a => a.date.startsWith('2026-03')).length;

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pacientes"
          value={patients.length}
          icon={Users}
          color="blue"
          trend={{ value: '+12.5%', isPositive: true }}
        />
        <StatCard
          title="Total Médicos"
          value={doctors.length}
          icon={Activity}
          color="green"
          trend={{ value: '+8.3%', isPositive: true }}
        />
        <StatCard
          title="Citas Este Mes"
          value={thisMonthAppointments}
          icon={Calendar}
          color="purple"
          trend={{ value: '+15.7%', isPositive: true }}
        />
        <StatCard
          title="Ingresos Totales"
          value={`€${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="orange"
          trend={{ value: '+23.1%', isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Specialty */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Citas por Especialidad</h3>
          <div className="space-y-4">
            {[
              { specialty: 'Cardiología', count: 45, color: 'bg-blue-600' },
              { specialty: 'Endocrinología', count: 38, color: 'bg-green-600' },
              { specialty: 'Dermatología', count: 41, color: 'bg-purple-600' },
              { specialty: 'Neumología', count: 32, color: 'bg-orange-600' },
              { specialty: 'Medicina General', count: 52, color: 'bg-pink-600' },
            ].map(item => (
              <div key={item.specialty}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{item.specialty}</span>
                  <span className="text-sm text-gray-600">{item.count} citas</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${(item.count / 60) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Period */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ingresos Mensuales</h3>
          <div className="space-y-3">
            {[
              { month: 'Enero', amount: 8500 },
              { month: 'Febrero', amount: 9200 },
              { month: 'Marzo', amount: 10500 },
            ].map(item => (
              <div key={item.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{item.month} 2026</span>
                <span className="text-xl font-bold text-green-600">€{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Trimestre</span>
              <span className="text-2xl font-bold text-blue-600">€28,200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {[
            { type: 'new_patient', message: 'Nuevo paciente registrado: Isabel Torres', time: '10 min' },
            { type: 'appointment', message: 'Cita completada: María González con Dr. Ramírez', time: '25 min' },
            { type: 'payment', message: 'Pago recibido: €80 de Juan Martínez', time: '1 hora' },
            { type: 'new_doctor', message: 'Nuevo médico registrado: Dr. Roberto Silva', time: '2 horas' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'payment' ? 'bg-green-500' :
                activity.type === 'new_patient' ? 'bg-blue-500' :
                activity.type === 'appointment' ? 'bg-purple-500' :
                'bg-orange-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">Hace {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Crecimiento de Usuarios</h3>
            <p className="text-blue-100 mb-6">Últimos 30 días</p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-blue-100 text-sm mb-1">Nuevos Pacientes</p>
                <p className="text-4xl font-bold">+24</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Nuevos Médicos</p>
                <p className="text-4xl font-bold">+3</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Tasa Crecimiento</p>
                <p className="text-4xl font-bold">+15%</p>
              </div>
            </div>
          </div>
          <TrendingUp className="w-32 h-32 text-white opacity-20" />
        </div>
      </div>
    </div>
  );
}
