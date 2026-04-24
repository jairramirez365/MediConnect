import { useEffect, useState } from 'react';
import { Activity, Calendar, CreditCard, FileText, Stethoscope, Users } from 'lucide-react';
import { Layout } from './components/Layout';
import { LoadingState } from './components/AsyncState';
import { StatCard } from './components/StatCard';
import { useAuth, UiRole } from '../store/AuthContext';
import { Login } from './screens/Login';
import { PublicSite } from './screens/PublicSite';
import { Register } from './screens/Register';
import { PatientSearchDoctors } from './screens/PatientSearchDoctors';
import { PatientAppointments } from './screens/PatientAppointments';
import { PatientHistory } from './screens/PatientHistory';
import { PatientProfile } from './screens/PatientProfile';
import { PatientBookAppointment } from './screens/PatientBookAppointment';
import { PatientDoctorProfile } from './screens/PatientDoctorProfile';
import { DoctorDashboard } from './screens/DoctorDashboard';
import { DoctorSchedule } from './screens/DoctorSchedule';
import { DoctorProfile } from './screens/DoctorProfile';
import { DoctorAppointments } from './screens/DoctorAppointments';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsers } from './screens/AdminUsers';
import { AdminDoctorReview } from './screens/AdminDoctorReview';
import { PatientDashboard } from './screens/PatientDashboard';
import { CommissionerDashboard } from './screens/CommissionerDashboard';
import { CommissionerCodes } from './screens/CommissionerCodes';
import { CommissionerPatients } from './screens/CommissionerPatients';
import { CommissionerSchedule } from './screens/CommissionerSchedule';

const defaultScreens: Record<UiRole, string> = {
  doctor: 'doctor-dashboard',
  patient: 'patient-dashboard',
  commissioner: 'commissioner-dashboard',
  admin: 'admin-dashboard'
};

export default function App() {
  const { user, profile, role, isAuthenticated, isLoading, logout } = useAuth();
  const [publicScreen, setPublicScreen] = useState<'landing' | 'login' | 'register'>('landing');
  const [currentScreen, setCurrentScreen] = useState('patient-dashboard');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedCommissionerPatientId, setSelectedCommissionerPatientId] = useState<string | null>(null);

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
    if (publicScreen === 'login') {
      return <Login onGoRegister={() => setPublicScreen('register')} onBackHome={() => setPublicScreen('landing')} />;
    }

    if (publicScreen === 'register') {
      return <Register onGoLogin={() => setPublicScreen('login')} onBackHome={() => setPublicScreen('landing')} />;
    }

    return <PublicSite onLogin={() => setPublicScreen('login')} onRegister={() => setPublicScreen('register')} />;
  }

  const userName = buildDisplayName(profile, user?.email || 'Usuario MediConnect');

  const patientNavigation = {
    goToSearchDoctors: () => setCurrentScreen('patient-search-doctors'),
    goToBookAppointment: (doctorId?: string | null) => {
      setSelectedDoctorId(doctorId || null);
      setCurrentScreen('patient-book-appointment');
    },
    goToDoctorProfile: (doctorId: string) => {
      setSelectedDoctorId(doctorId);
      setCurrentScreen('patient-doctor-profile');
    },
    goToAppointments: () => setCurrentScreen('patient-appointments'),
    goToHistory: (appointmentId?: string | null) => {
      setSelectedAppointmentId(appointmentId || null);
      setCurrentScreen('patient-history');
    }
  };

  const doctorNavigation = {
    goToProfile: () => setCurrentScreen('doctor-profile'),
    goToSchedule: () => setCurrentScreen('doctor-schedule'),
    goToAppointments: () => setCurrentScreen('doctor-appointments')
  };

  const adminNavigation = {
    goToUsers: () => setCurrentScreen('admin-users'),
    goToDoctorReview: () => setCurrentScreen('admin-doctor-review')
  };

  const commissionerNavigation = {
    goToCodes: () => setCurrentScreen('commissioner-codes'),
    goToPatients: () => setCurrentScreen('commissioner-patients'),
    goToSchedule: (patientId?: string | null) => {
      setSelectedCommissionerPatientId(patientId || null);
      setCurrentScreen('commissioner-schedule');
    }
  };

  return (
    <Layout userRole={role} currentScreen={currentScreen} onNavigate={setCurrentScreen} userName={userName} onLogout={logout}>
      {renderScreen(
        currentScreen,
        role,
        {
          selectedDoctorId,
          selectedAppointmentId,
          ...patientNavigation
        },
        {
          ...doctorNavigation
        },
        {
          ...adminNavigation
        },
        {
          selectedCommissionerPatientId,
          ...commissionerNavigation
        }
      )}
    </Layout>
  );
}

function renderScreen(currentScreen: string, role: UiRole, patientFlow: any, doctorFlow: any, adminFlow: any, commissionerFlow: any) {
  switch (currentScreen) {
    case 'patient-dashboard':
      return (
        <PatientDashboard
          onGoToSearchDoctors={patientFlow.goToSearchDoctors}
          onGoToBookAppointment={() => patientFlow.goToBookAppointment(null)}
          onGoToHistory={patientFlow.goToHistory}
          onGoToAppointments={patientFlow.goToAppointments}
        />
      );
    case 'patient-search-doctors':
      return (
        <PatientSearchDoctors
          onViewDoctor={patientFlow.goToDoctorProfile}
          onBookAppointment={patientFlow.goToBookAppointment}
        />
      );
    case 'patient-book-appointment':
      return (
        <PatientBookAppointment
          selectedDoctorId={patientFlow.selectedDoctorId}
          onViewDoctor={patientFlow.goToDoctorProfile}
          onOpenAppointments={patientFlow.goToAppointments}
        />
      );
    case 'patient-doctor-profile':
      return (
        <PatientDoctorProfile
          doctorId={patientFlow.selectedDoctorId}
          onBackToSearch={patientFlow.goToSearchDoctors}
          onBookAppointment={patientFlow.goToBookAppointment}
        />
      );
    case 'patient-appointments':
      return (
        <PatientAppointments
          onBookAppointment={() => patientFlow.goToBookAppointment(null)}
          onOpenHistory={patientFlow.goToHistory}
        />
      );
    case 'patient-history':
      return <PatientHistory selectedAppointmentId={patientFlow.selectedAppointmentId} />;
    case 'patient-profile':
      return <PatientProfile />;
    case 'doctor-dashboard':
      return (
        <DoctorDashboard
          onGoToSchedule={doctorFlow.goToSchedule}
          onGoToAppointments={doctorFlow.goToAppointments}
          onGoToProfile={doctorFlow.goToProfile}
        />
      );
    case 'doctor-profile':
      return <DoctorProfile />;
    case 'doctor-schedule':
      return <DoctorSchedule />;
    case 'doctor-appointments':
      return <DoctorAppointments />;
    case 'admin-dashboard':
      return <AdminDashboard onGoToUsers={adminFlow.goToUsers} onGoToDoctorReview={adminFlow.goToDoctorReview} />;
    case 'admin-users':
      return <AdminUsers />;
    case 'admin-doctor-review':
      return <AdminDoctorReview />;
    case 'commissioner-dashboard':
      return (
        <CommissionerDashboard
          onGoToCodes={commissionerFlow.goToCodes}
          onGoToPatients={commissionerFlow.goToPatients}
          onGoToSchedule={() => commissionerFlow.goToSchedule(null)}
        />
      );
    case 'commissioner-codes':
      return <CommissionerCodes onGoToPatients={commissionerFlow.goToPatients} />;
    case 'commissioner-patients':
      return <CommissionerPatients onSchedulePatient={(patientId: string) => commissionerFlow.goToSchedule(patientId)} />;
    case 'commissioner-schedule':
      return (
        <CommissionerSchedule
          selectedPatientId={commissionerFlow.selectedCommissionerPatientId}
          onGoToPatients={commissionerFlow.goToPatients}
        />
      );
    case 'admin-settings':
      return <ComingSoon title="Configuracion" description="Aqui podras administrar parametros clave del sistema y mantener la operacion ordenada." />;
    default:
      return <RoleDashboard role={role} />;
  }
}

function RoleDashboard({ role }: { role: UiRole }) {
  const labels = {
    doctor: {
      title: 'Inicio medico',
      description: 'Consulta tu jornada, organiza tu agenda y mantente al dia con tus pacientes.'
    },
    patient: {
      title: 'Inicio paciente',
      description: 'Accede rapido a tus proximas citas, especialistas y seguimiento medico.'
    },
    commissioner: {
      title: 'Inicio comisionista',
      description: 'Mantente cerca de tus referidos, oportunidades y flujos de acompanamiento.'
    },
    admin: {
      title: 'Inicio administrador',
      description: 'Supervisa usuarios, validaciones medicas y los puntos criticos de la operacion.'
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
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
        <StatCard title="Modulos conectados" value="6" icon={Stethoscope} color="blue" />
        <StatCard title="Autenticacion" value="JWT" icon={Users} color="green" />
        <StatCard title="Citas" value="API real" icon={Calendar} color="orange" />
        <StatCard title="Clinica y pagos" value="MVP" icon={CreditCard} color="purple" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(37,99,235,0.06)]">
        <h3 className="font-bold text-gray-900">Base del producto</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Ya cuentas con autenticacion, citas y gestion de usuarios conectadas. El siguiente paso es seguir refinando cada experiencia clave con la misma calidad visual.
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
