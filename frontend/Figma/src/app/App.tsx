import { useState } from 'react';
import { Layout } from './components/Layout';

// Doctor Screens
import { DoctorDashboard } from './screens/DoctorDashboard';
import { DoctorProfile } from './screens/DoctorProfile';
import { DoctorSchedule } from './screens/DoctorSchedule';
import { DoctorAppointments } from './screens/DoctorAppointments';
import { DoctorPatients } from './screens/DoctorPatients';
import { DoctorPrescriptions } from './screens/DoctorPrescriptions';

// Patient Screens
import { PatientDashboard } from './screens/PatientDashboard';
import { PatientProfile } from './screens/PatientProfile';
import { PatientSearchDoctors } from './screens/PatientSearchDoctors';
import { PatientAppointments } from './screens/PatientAppointments';
import { PatientTeleconsult } from './screens/PatientTeleconsult';
import { PatientHistory } from './screens/PatientHistory';
import { PatientPayments } from './screens/PatientPayments';
import { PatientRecordings } from './screens/PatientRecordings';

// Commissioner Screens
import { CommissionerDashboard } from './screens/CommissionerDashboard';
import { CommissionerPatients } from './screens/CommissionerPatients';
import { CommissionerSchedule } from './screens/CommissionerSchedule';
import { CommissionerCodes } from './screens/CommissionerCodes';

// Admin Screens
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsers } from './screens/AdminUsers';
import { AdminReports } from './screens/AdminReports';
import { AdminSettings } from './screens/AdminSettings';

export default function App() {
  const [userRole, setUserRole] = useState<'doctor' | 'patient' | 'commissioner' | 'admin'>('doctor');
  const [currentScreen, setCurrentScreen] = useState('doctor-dashboard');

  const userNames = {
    doctor: 'Dr. Carlos Ramírez',
    patient: 'María González',
    commissioner: 'Luis Moreno',
    admin: 'Admin Sistema'
  };

  const handleRoleChange = (newRole: 'doctor' | 'patient' | 'commissioner' | 'admin') => {
    setUserRole(newRole);
    // Set default screen for each role
    const defaultScreens = {
      doctor: 'doctor-dashboard',
      patient: 'patient-dashboard',
      commissioner: 'commissioner-dashboard',
      admin: 'admin-dashboard'
    };
    setCurrentScreen(defaultScreens[newRole]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      // Doctor Screens
      case 'doctor-dashboard':
        return <DoctorDashboard />;
      case 'doctor-profile':
        return <DoctorProfile />;
      case 'doctor-schedule':
        return <DoctorSchedule />;
      case 'doctor-appointments':
        return <DoctorAppointments />;
      case 'doctor-patients':
        return <DoctorPatients />;
      case 'doctor-prescriptions':
        return <DoctorPrescriptions />;

      // Patient Screens
      case 'patient-dashboard':
        return <PatientDashboard />;
      case 'patient-profile':
        return <PatientProfile />;
      case 'patient-search-doctors':
        return <PatientSearchDoctors />;
      case 'patient-appointments':
        return <PatientAppointments />;
      case 'patient-teleconsult':
        return <PatientTeleconsult />;
      case 'patient-history':
        return <PatientHistory />;
      case 'patient-payments':
        return <PatientPayments />;
      case 'patient-recordings':
        return <PatientRecordings />;

      // Commissioner Screens
      case 'commissioner-dashboard':
        return <CommissionerDashboard />;
      case 'commissioner-patients':
        return <CommissionerPatients />;
      case 'commissioner-schedule':
        return <CommissionerSchedule />;
      case 'commissioner-codes':
        return <CommissionerCodes />;

      // Admin Screens
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-reports':
        return <AdminReports />;
      case 'admin-settings':
        return <AdminSettings />;

      default:
        return <DoctorDashboard />;
    }
  };

  return (
    <Layout
      userRole={userRole}
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      userName={userNames[userRole]}
      onRoleChange={handleRoleChange}
    >
      {renderScreen()}
    </Layout>
  );
}
