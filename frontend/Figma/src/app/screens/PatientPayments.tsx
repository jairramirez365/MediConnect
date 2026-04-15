import { CreditCard, Download, Calendar, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { payments, getAppointmentsByPatientId, getDoctorById } from '../data/mockData';

export function PatientPayments() {
  const currentPatient = 'p1';
  const patientPayments = payments.filter(p => p.patientId === currentPatient);

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    const labels = {
      completed: 'Completado',
      pending: 'Pendiente',
      failed: 'Fallido'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${classes[status as keyof typeof classes]}`}>
        {status === 'completed' && <CheckCircle className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {status === 'failed' && <XCircle className="w-3 h-3" />}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const totalPaid = patientPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = patientPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pagado</p>
              <p className="text-3xl font-bold text-green-600">€{totalPaid}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendiente de Pago</p>
              <p className="text-3xl font-bold text-yellow-600">€{totalPending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transacciones</p>
              <p className="text-3xl font-bold text-blue-600">{patientPayments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Métodos de Pago</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Agregar Método
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-900">Visa •••• 4242</span>
              </div>
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Principal</span>
            </div>
            <p className="text-sm text-gray-600">Expira: 12/2027</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="font-bold text-gray-900">Mastercard •••• 8888</span>
            </div>
            <p className="text-sm text-gray-600">Expira: 06/2026</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de Transacciones</h3>
        <div className="space-y-3">
          {patientPayments.map(payment => {
            const appointments = getAppointmentsByPatientId(currentPatient);
            const appointment = appointments.find(a => a.id === payment.appointmentId);
            const doctor = appointment ? getDoctorById(appointment.doctorId) : null;

            return (
              <div key={payment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-gray-900">Consulta con {doctor?.name}</h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{payment.date}</span>
                        </div>
                        <span>•</span>
                        <span>{payment.method}</span>
                        {payment.invoice && (
                          <>
                            <span>•</span>
                            <span>Factura: {payment.invoice}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-bold text-gray-900">€{payment.amount}</p>
                    {payment.invoice && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Download className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Pay */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-2">¿Tienes un pago pendiente?</h3>
        <p className="text-blue-100 mb-4">Realiza tus pagos de forma rápida y segura</p>
        <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50">
          Pagar Ahora
        </button>
      </div>
    </div>
  );
}
