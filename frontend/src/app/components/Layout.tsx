import { ReactNode, useState } from 'react';
import {
  Activity,
  Calendar,
  ClipboardList,
  Code,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  UserCircle,
  Users,
  X
} from 'lucide-react';
import type { UiRole } from '../../store/AuthContext';

interface LayoutProps {
  children: ReactNode;
  userRole: UiRole;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  onLogout: () => void;
}

const menuItems = {
  doctor: [
    { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doctor-profile', label: 'Mi Perfil', icon: UserCircle },
    { id: 'doctor-schedule', label: 'Agenda', icon: Calendar },
    { id: 'doctor-appointments', label: 'Gestión de Citas', icon: ClipboardList }
  ],
  patient: [
    { id: 'patient-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patient-search-doctors', label: 'Buscar Médicos', icon: Stethoscope },
    { id: 'patient-appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'patient-history', label: 'Historia Clínica', icon: FileText },
    { id: 'patient-profile', label: 'Mi Perfil', icon: UserCircle }
  ],
  commissioner: [
    { id: 'commissioner-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'commissioner-codes', label: 'Códigos Referencia', icon: Code }
  ],
  admin: [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Gestión Usuarios', icon: Users },
    { id: 'admin-doctor-review', label: 'Revisión Médica', icon: ClipboardList },
    { id: 'admin-settings', label: 'Configuración', icon: Settings }
  ]
};

const roleLabels = {
  doctor: 'Médico',
  patient: 'Paciente',
  commissioner: 'Comisionista',
  admin: 'Administrador'
};

export function Layout({ children, userRole, currentScreen, onNavigate, userName, onLogout }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentMenu = menuItems[userRole];
  const currentTitle = currentMenu.find((item) => item.id === currentScreen)?.label || 'Dashboard';

  const navigate = (screen: string) => {
    onNavigate(screen);
    setIsMobileOpen(false);
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-600/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MediConnect</h1>
            <p className="text-xs text-gray-500">Plataforma de Salud</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabels[userRole]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <div className="hidden lg:block">{sidebar}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button className="flex-1 bg-gray-900/30" onClick={() => setIsMobileOpen(false)} />
          {sidebar}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg p-2 text-gray-700 hover:bg-gray-50 lg:hidden"
                onClick={() => setIsMobileOpen((value) => !value)}
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentTitle}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date().toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
