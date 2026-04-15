import { Download, Calendar, FileText, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { appointments, payments, doctors, patients } from '../data/mockData';

export function AdminReports() {
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h2>
          <p className="text-gray-600 mt-1">Visualiza métricas y exporta datos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Exportar Todo
        </button>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Citas</h3>
          <p className="text-sm text-gray-600">Exportar historial de citas</p>
        </button>

        <button className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Pagos</h3>
          <p className="text-sm text-gray-600">Exportar transacciones</p>
        </button>

        <button className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-lg transition-all text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Usuarios</h3>
          <p className="text-sm text-gray-600">Exportar base de datos</p>
        </button>

        <button className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-orange-500 hover:shadow-lg transition-all text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Análisis</h3>
          <p className="text-sm text-gray-600">Exportar métricas</p>
        </button>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Reporte Financiero</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver detalle</button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ingresos Totales</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">€{totalRevenue.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pagos Completados</p>
                <p className="text-xl font-bold text-gray-900">{payments.filter(p => p.status === 'completed').length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pagos Pendientes</p>
                <p className="text-xl font-bold text-gray-900">{payments.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ingreso Promedio por Cita</span>
                <span className="font-bold text-gray-900">€{Math.round(totalRevenue / completedAppointments)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Reporte de Actividad</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver detalle</button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total de Citas</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-xl font-bold text-green-600">{completedAppointments}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-xl font-bold text-yellow-600">
                  {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tasa de Completitud</span>
                <span className="font-medium text-gray-900">
                  {Math.round((completedAppointments / appointments.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${(completedAppointments / appointments.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Métricas de Crecimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Total Usuarios</p>
            <p className="text-4xl font-bold text-blue-600">{doctors.length + patients.length}</p>
            <p className="text-xs text-green-600 mt-2">+12% vs mes anterior</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Médicos Activos</p>
            <p className="text-4xl font-bold text-green-600">{doctors.length}</p>
            <p className="text-xs text-green-600 mt-2">+8% vs mes anterior</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Pacientes Activos</p>
            <p className="text-4xl font-bold text-purple-600">{patients.length}</p>
            <p className="text-xs text-green-600 mt-2">+15% vs mes anterior</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Tasa Retención</p>
            <p className="text-4xl font-bold text-orange-600">94%</p>
            <p className="text-xs text-green-600 mt-2">+2% vs mes anterior</p>
          </div>
        </div>
      </div>
    </div>
  );
}
