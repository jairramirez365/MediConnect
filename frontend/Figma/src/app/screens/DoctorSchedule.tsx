import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { appointments, getAppointmentsByDoctorId, getPatientById, doctors } from '../data/mockData';

export function DoctorSchedule() {
  const [selectedDate, setSelectedDate] = useState('2026-03-26');
  const currentDoctor = doctors[0];
  const doctorAppointments = getAppointmentsByDoctorId(currentDoctor.id);

  const timeSlots = Array.from({ length: 9 }, (_, i) => `${9 + i}:00`);
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Agenda</h2>
          <p className="text-gray-600 mt-1">Gestiona tu disponibilidad y citas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Bloquear Horario
        </button>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold">Marzo 2026</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Semana</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Mes</button>
          </div>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-1">
            <div className="h-12"></div>
            {timeSlots.map(time => (
              <div key={time} className="h-20 flex items-center justify-center text-sm text-gray-600 font-medium">
                {time}
              </div>
            ))}
          </div>

          {weekDays.map((day, dayIndex) => {
            const date = `2026-03-${24 + dayIndex}`;
            const dayAppointments = doctorAppointments.filter(apt => apt.date === date);

            return (
              <div key={day} className="col-span-1">
                <div className="h-12 flex flex-col items-center justify-center mb-2">
                  <p className="text-xs text-gray-500">{day}</p>
                  <p className={`text-lg font-bold ${date === selectedDate ? 'text-blue-600' : 'text-gray-900'}`}>
                    {24 + dayIndex}
                  </p>
                </div>

                {timeSlots.map(time => {
                  const appointment = dayAppointments.find(apt => apt.time === time);
                  const patient = appointment ? getPatientById(appointment.patientId) : null;

                  return (
                    <div key={time} className="h-20 border border-gray-200 rounded-lg p-2 hover:bg-gray-50">
                      {appointment && patient ? (
                        <div className={`h-full rounded p-2 ${
                          appointment.status === 'confirmed' ? 'bg-blue-100 border border-blue-300' :
                          appointment.status === 'pending' ? 'bg-yellow-100 border border-yellow-300' :
                          'bg-green-100 border border-green-300'
                        }`}>
                          <p className="text-xs font-bold text-gray-900 truncate">{patient.name}</p>
                          <p className="text-xs text-gray-600 truncate">{appointment.reason}</p>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100">
                          <button className="text-xs text-blue-600 hover:text-blue-700">+ Agregar</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configuración de Disponibilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horario General</label>
            <div className="space-y-3">
              {weekDays.map(day => (
                <div key={day} className="flex items-center gap-4">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-900 w-20">{day}</span>
                  <input type="time" defaultValue="09:00" className="px-3 py-1.5 border border-gray-300 rounded text-sm" />
                  <span className="text-gray-500">-</span>
                  <input type="time" defaultValue="17:00" className="px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración de Consulta</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>30 minutos</option>
              <option>45 minutos</option>
              <option selected>60 minutos</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Descanso entre Consultas</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Sin descanso</option>
              <option selected>15 minutos</option>
              <option>30 minutos</option>
            </select>

            <button className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
