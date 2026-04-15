import { Users, Mail, Phone, Calendar, DollarSign, Plus } from 'lucide-react';
import { patients, commissions } from '../data/mockData';

export function CommissionerPatients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Pacientes Referidos</h2>
          <p className="text-gray-600 mt-1">Gestiona los pacientes que has referido</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.slice(0, 3).map(patient => {
          const patientCommissions = commissions.filter(c => c.patientId === patient.id);
          const totalEarned = patientCommissions.reduce((sum, c) => sum + c.amount, 0);

          return (
            <div key={patient.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.age} años • {patient.gender}</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                    Activo
                  </span>
                </div>
              </div>

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

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Comisiones generadas</span>
                  <span className="text-lg font-bold text-green-600">€{totalEarned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total citas</span>
                  <span className="font-medium text-gray-900">{patientCommissions.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
