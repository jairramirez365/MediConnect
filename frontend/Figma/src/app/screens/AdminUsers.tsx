import { Users, UserCircle, Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { doctors, patients } from '../data/mockData';

export function AdminUsers() {
  const [selectedTab, setSelectedTab] = useState<'doctors' | 'patients' | 'commissioners'>('doctors');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600 mt-1">Administra médicos, pacientes y comisionistas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('doctors')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'doctors'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Médicos ({doctors.length})
          </button>
          <button
            onClick={() => setSelectedTab('patients')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'patients'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pacientes ({patients.length})
          </button>
          <button
            onClick={() => setSelectedTab('commissioners')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'commissioners'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Comisionistas (2)
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Doctors Table */}
        {selectedTab === 'doctors' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experiencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacientes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map(doctor => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {doctor.name.split(' ')[1].charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doctor.name}</p>
                          <p className="text-sm text-gray-600">{doctor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doctor.specialty}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doctor.experience} años</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doctor.patientsCount}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Patients Table */}
        {selectedTab === 'patients' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Género</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map(patient => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{patient.age} años</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{patient.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{patient.phone}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Commissioners Placeholder */}
        {selectedTab === 'commissioners' && (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Lista de comisionistas disponible próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
