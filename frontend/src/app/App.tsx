import { useEffect, useState } from 'react';
import { Activity, Calendar, CreditCard, FileText, Stethoscope, Users } from 'lucide-react';
import { Layout } from './components/Layout';
import { LoadingState } from './components/AsyncState';
import { StatCard } from './components/StatCard';
import { useAuth, UiRole } from '../store/AuthContext';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { PatientSearchDoctors } from './screens/PatientSearchDoctors';
import { PatientAppointments } from './screens/PatientAppointments';
import { PatientHistory } from './screens/PatientHistory';
import { PatientProfile } from './screens/PatientProfile';
import { DoctorSchedule } from './screens/DoctorSchedule';
import { DoctorProfile } from './screens/DoctorProfile';
import { DoctorAppointments } from './screens/DoctorAppointments';
import { AdminUsers } from './screens/AdminUsers';
import { AdminDoctorReview } from './screens/AdminDoctorReview';

const defaultScreens: Record<UiRole, string> = {
  doctor: 'doctor-dashboard',
  patient: 'patient-dashboard',
  commissioner: 'commissioner-dashboard',
  admin: 'admin-dashboard'
};

export default function App() {
  const { user, profile, role, isAuthenticated, isLoading, logout } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [currentScreen, setCurrentScreen] = useState('patient-dashboard');

  useEffect(() => {
    if (role) {
      setCurrentScreen(defaultScreens[role]);
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <LoadingState label="Preparando MediConnect..." />
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return authScreen === 'login'
      ? <Login onGoRegister={() => setAuthScreen('register')} />
      : <Register onGoLogin={() => setAuthScreen('login')} />;
  }

  const userName = buildDisplayName(profile, user?.email || 'Usuario MediConnect');

  return (
    <Layout
      userRole={role}
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      userName={userName}
      onLogout={logout}
    >
      {renderScreen(currentScreen, role)}
    </Layout>
  );
}

function renderScreen(currentScreen: string, role: UiRole) {
  switch (currentScreen) {
    case 'patient-search-doctors':
      return <PatientSearchDoctors />;
    case 'patient-appointments':
      return <PatientAppointments />;
    case 'patient-history':
      return <PatientHistory />;
    case 'patient-profile':
      return <PatientProfile />;
    case 'doctor-profile':
      return <DoctorProfile />;
    case 'doctor-schedule':
      return <DoctorSchedule />;
    case 'doctor-appointments':
      return <DoctorAppointments />;
    case 'admin-users':
      return <AdminUsers />;
    case 'admin-doctor-review':
      return <AdminDoctorReview />;
    case 'admin-settings':
      return <ComingSoon title="Configuración" description="Aquí centralizaremos reglas operativas, catálogos y parámetros de plataforma." />;
    case 'commissioner-codes':
      return <ComingSoon title="Códigos de referencia" description="El backend de referidos existe en modelo; la pantalla quedará conectada en el siguiente bloque funcional." />;
    default:
      return <RoleDashboard role={role} />;
  }
}

function RoleDashboard({ role }: { role: UiRole }) {
  const labels = {
    doctor: {
      title: 'Panel médico',
      description: 'Gestiona tu perfil, agenda y citas desde un flujo conectado al backend.'
    },
    patient: {
      title: 'Panel paciente',
      description: 'Busca médicos activos, agenda consultas y revisa tu historia clínica.'
    },
    commissioner: {
      title: 'Panel comisionista',
      description: 'Base visual lista para conectar referidos, comisiones y soporte de consulta.'
    },
    admin: {
      title: 'Panel administrador',
      description: 'Administra usuarios, revisa médicos y controla estados críticos del sistema.'
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{labels[role].title}</h2>
            <p className="mt-1 text-gray-600">{labels[role].description}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
            <Activity className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Módulos conectados" value="6" icon={Stethoscope} color="blue" />
        <StatCard title="Autenticación" value="JWT" icon={Users} color="green" />
        <StatCard title="Citas" value="API real" icon={Calendar} color="orange" />
        <StatCard title="Clínica y pagos" value="MVP" icon={CreditCard} color="purple" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="font-bold text-gray-900">Siguiente foco operativo</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Esta base ya usa sesión real. Ahora cada pantalla debe ir reemplazando el prototipo de Figma por
          datos reales del backend, manteniendo el mismo sistema visual.
        </p>
      </div>
    </div>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h2 className="mt-4 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-gray-600">{description}</p>
    </div>
  );
}

function buildDisplayName(profile: any, fallback: string) {
  if (!profile) return fallback;
  const firstName = profile.nombres || profile.firstName;
  const lastName = profile.apellidos || profile.lastName;

  return [firstName, lastName].filter(Boolean).join(' ') || fallback;
}
