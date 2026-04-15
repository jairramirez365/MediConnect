import { FileText, Download, Calendar, User, Pill, File } from 'lucide-react';
import { medicalRecords, prescriptions, getMedicalRecordsByPatientId, getPrescriptionsByPatientId, getDoctorById } from '../data/mockData';

export function PatientHistory() {
  const currentPatient = 'p1';
  const records = getMedicalRecordsByPatientId(currentPatient);
  const patientPrescriptions = getPrescriptionsByPatientId(currentPatient);

  return (
    <div className="space-y-6">
      {/* Medical Records */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Historial Clínico</h3>
        <div className="space-y-4">
          {records.map(record => {
            const doctor = getDoctorById(record.doctorId);
            return (
              <div key={record.id} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{doctor?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">Diagnóstico:</p>
                    <p className="text-sm text-gray-700">{record.diagnosis}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">Tratamiento:</p>
                    <p className="text-sm text-gray-700">{record.treatment}</p>
                  </div>

                  {record.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">Notas:</p>
                      <p className="text-sm text-gray-700">{record.notes}</p>
                    </div>
                  )}

                  {record.attachments && record.attachments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Archivos adjuntos:</p>
                      <div className="flex flex-wrap gap-2">
                        {record.attachments.map((file, idx) => (
                          <button key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                            <File className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">{file}</span>
                            <Download className="w-4 h-4 text-gray-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prescriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recetas Médicas</h3>
        <div className="space-y-4">
          {patientPrescriptions.map(prescription => {
            const doctor = getDoctorById(prescription.doctorId);
            return (
              <div key={prescription.id} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Receta del {prescription.date}</p>
                      <p className="text-sm text-gray-600">Dr. {doctor?.name}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Descargar</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-bold text-gray-900 mb-2">{med.name} - {med.dosage}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>
                          <span className="text-gray-600">Frecuencia:</span> {med.frequency}
                        </div>
                        <div>
                          <span className="text-gray-600">Duración:</span> {med.duration}
                        </div>
                      </div>
                    </div>
                  ))}

                  {prescription.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Indicaciones:</span> {prescription.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
