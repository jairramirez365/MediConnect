import { Users, DollarSign, Calendar, TrendingUp, Code } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { commissions, referralCodes } from '../data/mockData';

export function CommissionerDashboard() {
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalReferrals = referralCodes.reduce((sum, code) => sum + code.usageCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Comisiones"
          value={`€${totalCommissions}`}
          icon={DollarSign}
          color="green"
          trend={{ value: '+15.3%', isPositive: true }}
        />
        <StatCard
          title="Pacientes Referidos"
          value={totalReferrals}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Comisiones Pagadas"
          value={`€${paidCommissions}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Códigos Activos"
          value={referralCodes.length}
          icon={Code}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Commissions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Comisiones Recientes</h3>
            <span className="text-sm text-gray-500">{commissions.length} total</span>
          </div>
          <div className="space-y-3">
            {commissions.map(commission => (
              <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Paciente #{commission.patientId}</p>
                  <p className="text-sm text-gray-600">{commission.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">€{commission.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {commission.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Codes Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Rendimiento de Códigos</h3>
          </div>
          <div className="space-y-4">
            {referralCodes.map(code => (
              <div key={code.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-blue-600">{code.code}</span>
                  <span className="text-sm text-gray-600">Tasa: {code.commissionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{code.usageCount}</p>
                    <p className="text-sm text-gray-600">Usos totales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Creado</p>
                    <p className="font-medium text-gray-900">{code.createdDate}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(code.usageCount * 5, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Resumen del Mes</h3>
            <p className="text-green-100 mb-6">Marzo 2026</p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Generado</p>
                <p className="text-3xl font-bold">€{totalCommissions}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Nuevos Pacientes</p>
                <p className="text-3xl font-bold">{totalReferrals}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Tasa Promedio</p>
                <p className="text-3xl font-bold">10%</p>
              </div>
            </div>
          </div>
          <TrendingUp className="w-32 h-32 text-white opacity-20" />
        </div>
      </div>
    </div>
  );
}
