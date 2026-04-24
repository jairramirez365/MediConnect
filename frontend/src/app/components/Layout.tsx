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
    { id: 'doctor-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'doctor-profile', label: 'Mi Perfil', icon: UserCircle },
    { id: 'doctor-schedule', label: 'Agenda', icon: Calendar },
    { id: 'doctor-appointments', label: 'Gestion de Citas', icon: ClipboardList }
  ],
  patient: [
    { id: 'patient-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'patient-search-doctors', label: 'Buscar Medicos', icon: Stethoscope },
    { id: 'patient-book-appointment', label: 'Agendar Cita', icon: Calendar },
    { id: 'patient-appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'patient-history', label: 'Historia Clinica', icon: FileText },
    { id: 'patient-profile', label: 'Mi Perfil', icon: UserCircle }
  ],
  commissioner: [
    { id: 'commissioner-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'commissioner-codes', label: 'Codigos Referencia', icon: Code },
    { id: 'commissioner-patients', label: 'Pacientes Vinculados', icon: Users },
    { id: 'commissioner-schedule', label: 'Agendar Citas', icon: Calendar }
  ],
  admin: [
    { id: 'admin-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Gestion Usuarios', icon: Users },
    { id: 'admin-doctor-review', label: 'Revision Medica', icon: ClipboardList },
    { id: 'admin-settings', label: 'Configuracion', icon: Settings }
  ]
};

const roleLabels = {
  doctor: 'Medico',
  patient: 'Paciente',
  commissioner: 'Comisionista',
  admin: 'Administrador'
};

export function Layout({ children, userRole, currentScreen, onNavigate, userName, onLogout }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentMenu = menuItems[userRole];
  const currentTitle = currentMenu.find((item) => item.id === currentScreen)?.label || 'Inicio';

  const navigate = (screen: string) => {
    onNavigate(screen);
    setIsMobileOpen(false);
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/70 bg-white/78 backdrop-blur">
      <div className="border-b border-slate-100/80 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-2 shadow-lg shadow-blue-600/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MediConnect</h1>
            <p className="text-xs text-gray-500">Plataforma de salud</p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100/80 p-4">
        <div className="rounded-2xl bg-[linear-gradient(180deg,_rgba(239,246,255,0.95),_rgba(255,255,255,0.9))] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabels[userRole]}</p>
            </div>
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
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                  isActive ? 'bg-[linear-gradient(180deg,_#eff6ff,_#ffffff)] font-medium text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onLogout} className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Cerrar sesion</span>
        </button>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.12),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#f1f7ff_100%)] lg:flex">
      <div className="hidden lg:block">{sidebar}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button className="flex-1 bg-gray-900/30" onClick={() => setIsMobileOpen(false)} />
          {sidebar}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/70 bg-white/72 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-gray-700 hover:bg-gray-50 lg:hidden" onClick={() => setIsMobileOpen((value) => !value)}>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
