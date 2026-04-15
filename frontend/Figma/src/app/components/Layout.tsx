import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  UserCircle,
  Video,
  CreditCard,
  Star,
  BookOpen,
  ClipboardList,
  Activity,
  PieChart,
  DollarSign,
  Code,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  userRole: 'doctor' | 'patient' | 'commissioner' | 'admin';
  currentScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  onRoleChange: (role: 'doctor' | 'patient' | 'commissioner' | 'admin') => void;
}

export function Layout({ children, userRole, currentScreen, onNavigate, userName, onRoleChange }: LayoutProps) {
  const menuItems = {
    doctor: [
      { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'doctor-profile', label: 'Mi Perfil', icon: UserCircle },
      { id: 'doctor-schedule', label: 'Agenda', icon: Calendar },
      { id: 'doctor-appointments', label: 'Gestión de Citas', icon: ClipboardList },
      { id: 'doctor-patients', label: 'Mis Pacientes', icon: Users },
      { id: 'doctor-prescriptions', label: 'Recetario', icon: FileText },
    ],
    patient: [
      { id: 'patient-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'patient-profile', label: 'Mi Perfil', icon: UserCircle },
      { id: 'patient-search-doctors', label: 'Buscar Médicos', icon: Users },
      { id: 'patient-appointments', label: 'Mis Citas', icon: Calendar },
      { id: 'patient-teleconsult', label: 'Teleconsulta', icon: Video },
      { id: 'patient-history', label: 'Historial Clínico', icon: FileText },
      { id: 'patient-payments', label: 'Pagos', icon: CreditCard },
      { id: 'patient-recordings', label: 'Mis Consultas', icon: BookOpen },
    ],
    commissioner: [
      { id: 'commissioner-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'commissioner-patients', label: 'Mis Pacientes', icon: Users },
      { id: 'commissioner-schedule', label: 'Agenda Médicos', icon: Calendar },
      { id: 'commissioner-codes', label: 'Códigos Referencia', icon: Code },
    ],
    admin: [
      { id: 'admin-dashboard', label: 'Dashboard', icon: PieChart },
      { id: 'admin-users', label: 'Gestión Usuarios', icon: Users },
      { id: 'admin-reports', label: 'Reportes', icon: Activity },
      { id: 'admin-settings', label: 'Configuración', icon: Settings },
    ],
  };

  const roleLabels = {
    doctor: 'Médico',
    patient: 'Paciente',
    commissioner: 'Comisionista',
    admin: 'Administrador',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">MediConnect</h1>
              <p className="text-xs text-gray-500">Plataforma de Salud</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabels[userRole]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems[userRole].map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Role Switcher (Demo) */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-2">Cambiar Rol (Demo):</p>
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="doctor">Médico</option>
              <option value="patient">Paciente</option>
              <option value="commissioner">Comisionista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {menuItems[userRole].find(item => item.id === currentScreen)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
