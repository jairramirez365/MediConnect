import { Mail, Phone, Calendar, Award, Star, Edit, MapPin } from 'lucide-react';
import { doctors } from '../data/mockData';

export function DoctorProfile() {
  const doctor = doctors[0]; // Dr. Carlos Ramírez

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="flex items-end gap-6 -mt-16">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {doctor.name.split(' ')[1].charAt(0)}
            </div>
            <div className="flex-1 pt-20">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
                  <p className="text-xl text-blue-600 mt-1">{doctor.specialty}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(doctor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{doctor.rating}</span>
                  <span className="text-gray-600">({doctor.reviewCount} reseñas)</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="text-gray-600">
                  <span className="font-medium">{doctor.experience} años</span> de experiencia
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre mí</h2>
            <p className="text-gray-700 leading-relaxed">{doctor.description}</p>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Certificaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctor.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reseñas Recientes</h2>
            <div className="space-y-4">
              {[
                { name: 'María González', rating: 5, comment: 'Excelente profesional, muy atento y dedicado. Resolvió todas mis dudas.', date: '2026-03-20' },
                { name: 'Juan Martínez', rating: 5, comment: 'Gran doctor, me ayudó mucho con mi problema cardíaco.', date: '2026-03-18' },
                { name: 'Laura Pérez', rating: 4, comment: 'Muy buen servicio, aunque la espera fue un poco larga.', date: '2026-03-15' }
              ].map((review, index) => (
                <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{review.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Disponibilidad</h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Horario de atención</p>
                <p className="text-sm font-medium text-gray-900">{doctor.availability}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-lg font-bold mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div>
                <p className="text-blue-100 text-sm">Pacientes Activos</p>
                <p className="text-3xl font-bold">{doctor.patientsCount}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Consulta</p>
                <p className="text-3xl font-bold">€{doctor.consultationFee}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Ingresos Mensuales</p>
                <p className="text-3xl font-bold">€{doctor.monthlyIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
