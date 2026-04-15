import { Search, Star, Calendar, Award, DollarSign } from 'lucide-react';
import { doctors } from '../data/mockData';

export function PatientSearchDoctors() {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar médico por nombre o especialidad..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Todas las especialidades</option>
              <option>Cardiología</option>
              <option>Dermatología</option>
              <option>Endocrinología</option>
              <option>Medicina General</option>
              <option>Neumología</option>
            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Calificación mínima</option>
              <option>4.5+ estrellas</option>
              <option>4.0+ estrellas</option>
              <option>3.5+ estrellas</option>
            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Disponibilidad</option>
              <option>Hoy</option>
              <option>Esta semana</option>
              <option>Este mes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Mostrando <span className="font-bold text-gray-900">{doctors.length}</span> médicos
        </p>
        <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Más relevantes</option>
          <option>Mejor calificados</option>
          <option>Menor precio</option>
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all hover:border-blue-300">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                {doctor.name.split(' ')[1].charAt(0)}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{doctor.name}</h3>
              <p className="text-blue-600 font-medium">{doctor.specialty}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-900">{doctor.rating}</span>
                <span className="text-sm text-gray-500">({doctor.reviewCount})</span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>Experiencia</span>
                </div>
                <span className="font-medium text-gray-900">{doctor.experience} años</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Disponibilidad</span>
                </div>
                <span className="font-medium text-gray-900 text-xs">{doctor.availability.split(' ')[0]}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Consulta</span>
                </div>
                <span className="font-medium text-gray-900">€{doctor.consultationFee}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doctor.description}</p>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                Agendar Cita
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                Ver Perfil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
