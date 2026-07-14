import { ReactNode, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Bell,
  Calendar,
  ClipboardList,
  Code,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleMore,
  Settings,
  Stethoscope,
  UserCircle,
  Users,
  X
} from 'lucide-react';
import type { UiRole } from '../../store/AuthContext';
import { api } from '../../services/api';

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
    { id: 'doctor-appointments', label: 'Gestión de Citas', icon: ClipboardList },
    { id: 'doctor-payments', label: 'Pagos', icon: CreditCard },
    { id: 'notifications-center', label: 'Notificaciones', icon: Bell },
    { id: 'chat-center', label: 'Chat', icon: MessageCircleMore }
  ],
  patient: [
    { id: 'patient-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'patient-search-doctors', label: 'Buscar Médicos', icon: Stethoscope },
    { id: 'patient-book-appointment', label: 'Agendar Cita', icon: Calendar },
    { id: 'patient-appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'patient-history', label: 'Historia Clínica', icon: FileText },
    { id: 'patient-payments', label: 'Pagos', icon: CreditCard },
    { id: 'notifications-center', label: 'Notificaciones', icon: Bell },
    { id: 'chat-center', label: 'Chat', icon: MessageCircleMore },
    { id: 'patient-profile', label: 'Mi Perfil', icon: UserCircle }
  ],
  commissioner: [
    { id: 'commissioner-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'commissioner-codes', label: 'Códigos Referencia', icon: Code },
    { id: 'commissioner-patients', label: 'Pacientes Vinculados', icon: Users },
    { id: 'commissioner-schedule', label: 'Agendar Citas', icon: Calendar },
    { id: 'commissioner-payments', label: 'Pagos', icon: CreditCard },
    { id: 'notifications-center', label: 'Notificaciones', icon: Bell },
    { id: 'chat-center', label: 'Chat', icon: MessageCircleMore }
  ],
  admin: [
    { id: 'admin-dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Gestión Usuarios', icon: Users },
    { id: 'admin-doctor-review', label: 'Revisión Médica', icon: ClipboardList },
    { id: 'admin-payments', label: 'Pagos', icon: CreditCard },
    { id: 'admin-video-consultations', label: 'Videoconsultas', icon: MessageCircleMore },
    { id: 'notifications-center', label: 'Notificaciones', icon: Bell },
    { id: 'chat-center', label: 'Chat', icon: MessageCircleMore },
    { id: 'admin-settings', label: 'Configuración', icon: Settings }
  ]
};

const roleLabels = {
  doctor: 'Médico',
  patient: 'Paciente',
  commissioner: 'Gestor',
  admin: 'Administrador'
};

export function Layout({ children, userRole, currentScreen, onNavigate, userName, onLogout }: LayoutProps) {
  const reduce = useReducedMotion();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const currentMenu = menuItems[userRole];
  const currentTitle = currentMenu.find((item) => item.id === currentScreen)?.label || 'Inicio';

  useEffect(() => {
    let mounted = true;

    async function loadHeaderSummary() {
      try {
        const [notificationsResponse, conversationsResponse] = await Promise.all([
          api.notificationUnreadSummary(),
          api.chatConversations()
        ]);

        if (!mounted) {
          return;
        }

        setUnreadNotifications(Number(notificationsResponse.data?.unreadCount || 0));
        setUnreadChats(
          (conversationsResponse.data || []).reduce((sum: number, conversation: any) => sum + Number(conversation.unreadCount || 0), 0)
        );
      } catch {
        if (!mounted) {
          return;
        }
        setUnreadNotifications(0);
        setUnreadChats(0);
      }
    }

    loadHeaderSummary();
    const interval = window.setInterval(loadHeaderSummary, 20000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [userRole, currentScreen]);

  const navigate = (screen: string) => {
    onNavigate(screen);
    setIsMobileOpen(false);
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/70 bg-white/78 backdrop-blur">
      <div className="border-b border-slate-100/80 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg shadow-indigo-600/25">
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
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
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
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.12),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#f1f7ff_100%)] lg:flex">
      <div className="hidden lg:block">{sidebar}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <motion.div
            initial={reduce ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="h-full shadow-2xl shadow-blue-950/20"
          >
            {sidebar}
          </motion.div>
          <button aria-label="Cerrar menú" className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('notifications-center')}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-1 text-[10px] font-semibold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('chat-center')}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <MessageCircleMore className="h-5 w-5" />
                {unreadChats > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-1 text-[10px] font-semibold text-white">
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </span>
                )}
              </button>
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
