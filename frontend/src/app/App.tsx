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
import { PatientPayments } from './screens/PatientPayments';
import { DoctorDashboard } from './screens/DoctorDashboard';
import { DoctorSchedule } from './screens/DoctorSchedule';
import { DoctorProfile } from './screens/DoctorProfile';
import { DoctorAppointments } from './screens/DoctorAppointments';
import { DoctorPayments } from './screens/DoctorPayments';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsers } from './screens/AdminUsers';
import { AdminDoctorReview } from './screens/AdminDoctorReview';
import { AdminPayments } from './screens/AdminPayments';
import { PatientDashboard } from './screens/PatientDashboard';
import { CommissionerDashboard } from './screens/CommissionerDashboard';
import { CommissionerCodes } from './screens/CommissionerCodes';
import { CommissionerPatients } from './screens/CommissionerPatients';
import { CommissionerSchedule } from './screens/CommissionerSchedule';
import { CommissionerPayments } from './screens/CommissionerPayments';
import { VerifyAccount } from './screens/VerifyAccount';
import { NotificationsCenter } from './screens/NotificationsCenter';
import { ChatCenter } from './screens/ChatCenter';
import { VideoConsultationRoom } from './screens/PatientTeleconsult';
import { AdminVideoConsultations } from './screens/AdminVideoConsultations';

const defaultScreens: Record<UiRole, string> = {
  doctor: 'doctor-dashboard',
  patient: 'patient-dashboard',
  commissioner: 'commissioner-dashboard',
  admin: 'admin-dashboard'
};

const roleScreens: Record<UiRole, string[]> = {
  doctor: ['doctor-dashboard', 'doctor-profile', 'doctor-schedule', 'doctor-appointments', 'doctor-payments', 'doctor-video-consultation', 'notifications-center', 'chat-center'],
  patient: [
    'patient-dashboard',
    'patient-search-doctors',
    'patient-book-appointment',
    'patient-doctor-profile',
    'patient-appointments',
    'patient-history',
    'patient-payments',
    'patient-profile',
    'patient-video-consultation',
    'notifications-center',
    'chat-center'
  ],
  commissioner: [
    'commissioner-dashboard',
    'commissioner-codes',
    'commissioner-patients',
    'commissioner-schedule',
    'commissioner-payments',
    'notifications-center',
    'chat-center'
  ],
  admin: ['admin-dashboard', 'admin-users', 'admin-doctor-review', 'admin-payments', 'admin-video-consultations', 'admin-settings', 'notifications-center', 'chat-center']
};

export default function App() {
  const { user, profile, role, isAuthenticated, isLoading, logout } = useAuth();
  const [publicScreen, setPublicScreen] = useState<'landing' | 'login' | 'register' | 'verify'>('landing');
  const [currentScreen, setCurrentScreen] = useState('patient-dashboard');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedCommissionerPatientId, setSelectedCommissionerPatientId] = useState<string | null>(null);
  const [pendingVerificationUserId, setPendingVerificationUserId] = useState<string | null>(null);
  const [selectedVideoAppointmentId, setSelectedVideoAppointmentId] = useState<string | null>(null);

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
      return (
        <Login
          onGoRegister={() => setPublicScreen('register')}
          onBackHome={() => setPublicScreen('landing')}
          onRequireVerification={(userId) => {
            setPendingVerificationUserId(userId);
            setPublicScreen('verify');
          }}
        />
      );
    }

    if (publicScreen === 'register') {
      return <Register onGoLogin={() => setPublicScreen('login')} onBackHome={() => setPublicScreen('landing')} />;
    }

    if (publicScreen === 'verify') {
      return <VerifyAccount userId={pendingVerificationUserId} standalone onBackHome={() => setPublicScreen('landing')} />;
    }

    return <PublicSite onLogin={() => setPublicScreen('login')} onRegister={() => setPublicScreen('register')} />;
  }

  if (user?.status === 'pendiente_verificacion') {
    return <VerifyAccount onBackHome={() => setPublicScreen('landing')} />;
  }

  const userName = buildDisplayName(profile, user?.email || 'Usuario MediConnect');
  const safeCurrentScreen = roleScreens[role].includes(currentScreen) ? currentScreen : defaultScreens[role];

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
    goToPayments: () => setCurrentScreen('patient-payments'),
    goToVideoConsultation: (appointmentId: string) => {
      setSelectedVideoAppointmentId(appointmentId);
      setCurrentScreen('patient-video-consultation');
    },
    goToHistory: (appointmentId?: string | null) => {
      setSelectedAppointmentId(appointmentId || null);
      setCurrentScreen('patient-history');
    }
  };

  const doctorNavigation = {
    goToProfile: () => setCurrentScreen('doctor-profile'),
    goToSchedule: () => setCurrentScreen('doctor-schedule'),
    goToAppointments: () => setCurrentScreen('doctor-appointments'),
    goToPayments: () => setCurrentScreen('doctor-payments'),
    goToVideoConsultation: (appointmentId: string) => {
      setSelectedVideoAppointmentId(appointmentId);
      setCurrentScreen('doctor-video-consultation');
    }
  };

  const adminNavigation = {
    goToUsers: () => setCurrentScreen('admin-users'),
    goToDoctorReview: () => setCurrentScreen('admin-doctor-review'),
    goToPayments: () => setCurrentScreen('admin-payments'),
    goToVideoConsultations: () => setCurrentScreen('admin-video-consultations')
  };

  const commissionerNavigation = {
    goToCodes: () => setCurrentScreen('commissioner-codes'),
    goToPatients: () => setCurrentScreen('commissioner-patients'),
    goToPayments: () => setCurrentScreen('commissioner-payments'),
    goToSchedule: (patientId?: string | null) => {
      setSelectedCommissionerPatientId(patientId || null);
      setCurrentScreen('commissioner-schedule');
    }
  };

  return (
    <Layout userRole={role} currentScreen={safeCurrentScreen} onNavigate={setCurrentScreen} userName={userName} onLogout={logout}>
      {renderScreen(
        safeCurrentScreen,
        role,
        {
          selectedDoctorId,
          selectedAppointmentId,
          selectedVideoAppointmentId,
          ...patientNavigation
        },
        {
          selectedVideoAppointmentId,
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
          onGoToPayments={patientFlow.goToPayments}
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
          onOpenVideoConsultation={patientFlow.goToVideoConsultation}
        />
      );
    case 'patient-history':
      return <PatientHistory selectedAppointmentId={patientFlow.selectedAppointmentId} />;
    case 'patient-payments':
      return <PatientPayments />;
    case 'patient-video-consultation':
      return (
        <VideoConsultationRoom
          appointmentId={patientFlow.selectedVideoAppointmentId}
          roleMode="patient"
          onBackToAppointments={patientFlow.goToAppointments}
        />
      );
    case 'patient-profile':
      return <PatientProfile />;
    case 'doctor-dashboard':
      return (
        <DoctorDashboard
          onGoToSchedule={doctorFlow.goToSchedule}
          onGoToAppointments={doctorFlow.goToAppointments}
          onGoToProfile={doctorFlow.goToProfile}
          onGoToPayments={doctorFlow.goToPayments}
        />
      );
    case 'doctor-profile':
      return <DoctorProfile />;
    case 'doctor-schedule':
      return <DoctorSchedule />;
    case 'doctor-appointments':
      return <DoctorAppointments onOpenVideoConsultation={doctorFlow.goToVideoConsultation} />;
    case 'doctor-payments':
      return <DoctorPayments />;
    case 'admin-dashboard':
      return <AdminDashboard onGoToUsers={adminFlow.goToUsers} onGoToDoctorReview={adminFlow.goToDoctorReview} onGoToPayments={adminFlow.goToPayments} onGoToVideoConsultations={adminFlow.goToVideoConsultations} />;
    case 'admin-users':
      return <AdminUsers />;
    case 'admin-doctor-review':
      return <AdminDoctorReview />;
    case 'admin-payments':
      return <AdminPayments />;
    case 'admin-video-consultations':
      return <AdminVideoConsultations />;
    case 'commissioner-dashboard':
      return (
        <CommissionerDashboard
          onGoToCodes={commissionerFlow.goToCodes}
          onGoToPatients={commissionerFlow.goToPatients}
          onGoToSchedule={() => commissionerFlow.goToSchedule(null)}
          onGoToPayments={commissionerFlow.goToPayments}
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
    case 'commissioner-payments':
      return <CommissionerPayments />;
    case 'doctor-video-consultation':
      return (
        <VideoConsultationRoom
          appointmentId={doctorFlow.selectedVideoAppointmentId}
          roleMode="doctor"
          onBackToAppointments={doctorFlow.goToAppointments}
        />
      );
    case 'admin-settings':
      return <ComingSoon title="Configuracion" description="Aqui podras administrar parametros clave del sistema y mantener la operacion ordenada." />;
    case 'notifications-center':
      return <NotificationsCenter />;
    case 'chat-center':
      return <ChatCenter />;
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
      title: 'Inicio gestor',
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
