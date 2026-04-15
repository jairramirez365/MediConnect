import { Code, Plus, Copy, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { referralCodes } from '../data/mockData';

export function CommissionerCodes() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Códigos de Referencia</h2>
          <p className="text-gray-600 mt-1">Gestiona tus códigos y rastrea su uso</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Generar Código
        </button>
      </div>

      {/* Codes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {referralCodes.map(code => {
          const totalEarned = code.usageCount * code.commissionRate;

          return (
            <div key={code.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Code Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-blue-600">{code.code}</p>
                    <p className="text-sm text-gray-600">Creado: {code.createdDate}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Copiar código">
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{code.usageCount}</p>
                  <p className="text-xs text-gray-600">Usos</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{code.commissionRate}%</p>
                  <p className="text-xs text-gray-600">Comisión</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">€{totalEarned}</p>
                  <p className="text-xs text-gray-600">Generado</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Rendimiento</span>
                  <span className="text-sm font-medium text-gray-900">{code.usageCount} / 50 meta</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                    style={{ width: `${Math.min((code.usageCount / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  Ver Detalles
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Compartir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-2">¿Cómo funcionan los códigos de referencia?</h3>
        <ul className="space-y-2 text-sm text-blue-100">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Genera un código único para compartir con potenciales pacientes</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Cuando un paciente usa tu código, se vincula automáticamente a ti</span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>Ganas una comisión por cada consulta que realice el paciente</span>
          </li>
        </ul>
      </div>

      {/* Generate Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generar Nuevo Código</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del código (opcional)</label>
                <input
                  type="text"
                  placeholder="ej: Campaña Marzo 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasa de comisión (%)</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Vista previa del código:</span>
                  <span className="block font-mono text-lg text-blue-600 mt-2">COM-2026-003</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generar Código
              </button>
              <button
                onClick={() => setShowModal(false)}
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
