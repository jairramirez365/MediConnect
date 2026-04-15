export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
  photo?: string;
  email: string;
  phone: string;
  description: string;
  certifications: string[];
  availability: string;
  consultationFee: number;
  patientsCount: number;
  monthlyIncome: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  bloodType: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  type: 'presencial' | 'teleconsulta';
  reason: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  amount: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  attachments: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  notes: string;
}

export interface Commission {
  id: string;
  commissionerId: string;
  patientId: string;
  amount: number;
  status: 'pending' | 'paid';
  date: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  commissionerId: string;
  usageCount: number;
  commissionRate: number;
  createdDate: string;
}

export interface Payment {
  id: string;
  patientId: string;
  appointmentId: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  invoice?: string;
}

// Mock Data
export const doctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Carlos Ramírez',
    specialty: 'Cardiología',
    experience: 15,
    rating: 4.8,
    reviewCount: 156,
    email: 'carlos.ramirez@mediconnect.com',
    phone: '+34 611 222 333',
    description: 'Especialista en cardiología con enfoque en prevención y tratamiento de enfermedades cardiovasculares.',
    certifications: ['Cardiología Clínica', 'Ecocardiografía', 'Medicina Interna'],
    availability: 'Lun-Vie 9:00-17:00',
    consultationFee: 80,
    patientsCount: 45,
    monthlyIncome: 12500
  },
  {
    id: 'd2',
    name: 'Dra. Ana López',
    specialty: 'Endocrinología',
    experience: 12,
    rating: 4.9,
    reviewCount: 203,
    email: 'ana.lopez@mediconnect.com',
    phone: '+34 622 333 444',
    description: 'Experta en diabetes, tiroides y trastornos hormonales con enfoque integral.',
    certifications: ['Endocrinología', 'Diabetología', 'Nutrición Clínica'],
    availability: 'Lun-Vie 10:00-18:00',
    consultationFee: 75,
    patientsCount: 38,
    monthlyIncome: 9800
  },
  {
    id: 'd3',
    name: 'Dr. Miguel Torres',
    specialty: 'Neumología',
    experience: 10,
    rating: 4.7,
    reviewCount: 89,
    email: 'miguel.torres@mediconnect.com',
    phone: '+34 633 444 555',
    description: 'Especialista en enfermedades respiratorias y asma con amplia experiencia en teleconsulta.',
    certifications: ['Neumología', 'Medicina Respiratoria', 'Alergología'],
    availability: 'Mar-Sáb 8:00-16:00',
    consultationFee: 70,
    patientsCount: 32,
    monthlyIncome: 7200
  },
  {
    id: 'd4',
    name: 'Dra. Laura Fernández',
    specialty: 'Medicina General',
    experience: 8,
    rating: 4.6,
    reviewCount: 134,
    email: 'laura.fernandez@mediconnect.com',
    phone: '+34 644 555 666',
    description: 'Médico general con enfoque preventivo y atención integral a pacientes de todas las edades.',
    certifications: ['Medicina General', 'Medicina Familiar', 'Atención Primaria'],
    availability: 'Lun-Vie 9:00-19:00',
    consultationFee: 60,
    patientsCount: 52,
    monthlyIncome: 8900
  },
  {
    id: 'd5',
    name: 'Dr. Roberto Silva',
    specialty: 'Dermatología',
    experience: 14,
    rating: 4.9,
    reviewCount: 178,
    email: 'roberto.silva@mediconnect.com',
    phone: '+34 655 666 777',
    description: 'Dermatólogo especializado en tratamientos estéticos y enfermedades de la piel.',
    certifications: ['Dermatología', 'Dermatología Estética', 'Tricología'],
    availability: 'Lun-Jue 11:00-19:00',
    consultationFee: 85,
    patientsCount: 41,
    monthlyIncome: 11200
  }
];

export const patients: Patient[] = [
  {
    id: 'p1',
    name: 'María González',
    age: 45,
    gender: 'Femenino',
    email: 'maria.gonzalez@email.com',
    phone: '+34 612 345 678',
    address: 'Calle Mayor 123, Madrid',
    bloodType: 'O+',
    allergies: ['Penicilina'],
    chronicDiseases: ['Hipertensión'],
    emergencyContact: {
      name: 'Juan González',
      phone: '+34 612 345 679',
      relationship: 'Esposo'
    }
  },
  {
    id: 'p2',
    name: 'Juan Martínez',
    age: 62,
    gender: 'Masculino',
    email: 'juan.martinez@email.com',
    phone: '+34 623 456 789',
    address: 'Avenida de la Paz 45, Barcelona',
    bloodType: 'A+',
    allergies: [],
    chronicDiseases: ['Diabetes tipo 2', 'Colesterol alto'],
    emergencyContact: {
      name: 'Carmen Martínez',
      phone: '+34 623 456 790',
      relationship: 'Esposa'
    }
  },
  {
    id: 'p3',
    name: 'Carmen Rodríguez',
    age: 38,
    gender: 'Femenino',
    email: 'carmen.rodriguez@email.com',
    phone: '+34 634 567 890',
    address: 'Plaza España 7, Valencia',
    bloodType: 'B+',
    allergies: ['Polen', 'Ácaros'],
    chronicDiseases: ['Asma'],
    emergencyContact: {
      name: 'Pedro Rodríguez',
      phone: '+34 634 567 891',
      relationship: 'Hermano'
    }
  },
  {
    id: 'p4',
    name: 'Pedro Sánchez',
    age: 55,
    gender: 'Masculino',
    email: 'pedro.sanchez@email.com',
    phone: '+34 645 678 901',
    address: 'Calle Sol 89, Sevilla',
    bloodType: 'AB+',
    allergies: ['Ibuprofeno'],
    chronicDiseases: ['Artritis'],
    emergencyContact: {
      name: 'Ana Sánchez',
      phone: '+34 645 678 902',
      relationship: 'Hija'
    }
  },
  {
    id: 'p5',
    name: 'Isabel Torres',
    age: 29,
    gender: 'Femenino',
    email: 'isabel.torres@email.com',
    phone: '+34 656 789 012',
    address: 'Calle Luna 34, Málaga',
    bloodType: 'O-',
    allergies: [],
    chronicDiseases: [],
    emergencyContact: {
      name: 'Luis Torres',
      phone: '+34 656 789 013',
      relationship: 'Padre'
    }
  }
];

export const appointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-03-26',
    time: '10:00',
    status: 'confirmed',
    type: 'teleconsulta',
    reason: 'Control de hipertensión',
    amount: 80
  },
  {
    id: 'a2',
    patientId: 'p2',
    doctorId: 'd2',
    date: '2026-03-26',
    time: '11:30',
    status: 'confirmed',
    type: 'presencial',
    reason: 'Seguimiento diabetes',
    amount: 75
  },
  {
    id: 'a3',
    patientId: 'p3',
    doctorId: 'd3',
    date: '2026-03-25',
    time: '15:00',
    status: 'completed',
    type: 'teleconsulta',
    reason: 'Crisis asmática',
    diagnosis: 'Asma controlada, ajuste de medicación',
    prescription: 'Salbutamol 100mcg',
    notes: 'Paciente responde bien al tratamiento',
    amount: 70
  },
  {
    id: 'a4',
    patientId: 'p4',
    doctorId: 'd2',
    date: '2026-03-27',
    time: '09:00',
    status: 'pending',
    type: 'presencial',
    reason: 'Dolor articular',
    amount: 75
  },
  {
    id: 'a5',
    patientId: 'p5',
    doctorId: 'd5',
    date: '2026-03-28',
    time: '14:00',
    status: 'confirmed',
    type: 'teleconsulta',
    reason: 'Consulta dermatológica',
    amount: 85
  },
  {
    id: 'a6',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-03-20',
    time: '10:00',
    status: 'completed',
    type: 'presencial',
    reason: 'Consulta general',
    diagnosis: 'Hipertensión controlada',
    amount: 80
  }
];

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'mr1',
    patientId: 'p1',
    doctorId: 'd1',
    appointmentId: 'a6',
    date: '2026-03-20',
    diagnosis: 'Hipertensión arterial controlada',
    treatment: 'Enalapril 10mg, cambios en estilo de vida',
    notes: 'Presión arterial 130/85. Continuar con medicación actual.',
    attachments: ['ecg_2026-03-20.pdf', 'analisis_sangre.pdf']
  },
  {
    id: 'mr2',
    patientId: 'p3',
    doctorId: 'd3',
    appointmentId: 'a3',
    date: '2026-03-25',
    diagnosis: 'Asma bronquial controlada',
    treatment: 'Salbutamol 100mcg según necesidad, Budesonida 200mcg/día',
    notes: 'Espirometría muestra mejoría. Continuar tratamiento.',
    attachments: ['espirometria.pdf']
  }
];

export const prescriptions: Prescription[] = [
  {
    id: 'pr1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-03-20',
    medications: [
      {
        name: 'Enalapril',
        dosage: '10mg',
        frequency: 'Una vez al día',
        duration: '30 días'
      }
    ],
    notes: 'Tomar en ayunas con un vaso de agua'
  },
  {
    id: 'pr2',
    patientId: 'p3',
    doctorId: 'd3',
    date: '2026-03-25',
    medications: [
      {
        name: 'Salbutamol',
        dosage: '100mcg',
        frequency: 'Según necesidad (máx. 4 veces/día)',
        duration: '30 días'
      },
      {
        name: 'Budesonida',
        dosage: '200mcg',
        frequency: 'Dos veces al día',
        duration: '30 días'
      }
    ],
    notes: 'Usar inhalador con espaciador. Enjuagar boca después de budesonida.'
  }
];

export const payments: Payment[] = [
  {
    id: 'pay1',
    patientId: 'p1',
    appointmentId: 'a6',
    amount: 80,
    method: 'Tarjeta de crédito',
    status: 'completed',
    date: '2026-03-20',
    invoice: 'INV-2026-001'
  },
  {
    id: 'pay2',
    patientId: 'p3',
    appointmentId: 'a3',
    amount: 70,
    method: 'PayPal',
    status: 'completed',
    date: '2026-03-25',
    invoice: 'INV-2026-002'
  },
  {
    id: 'pay3',
    patientId: 'p2',
    appointmentId: 'a2',
    amount: 75,
    method: 'Tarjeta de débito',
    status: 'pending',
    date: '2026-03-26'
  }
];

export const referralCodes: ReferralCode[] = [
  {
    id: 'rc1',
    code: 'COM-2026-001',
    commissionerId: 'c1',
    usageCount: 12,
    commissionRate: 10,
    createdDate: '2026-01-15'
  },
  {
    id: 'rc2',
    code: 'COM-2026-002',
    commissionerId: 'c1',
    usageCount: 8,
    commissionRate: 10,
    createdDate: '2026-02-01'
  }
];

export const commissions: Commission[] = [
  {
    id: 'com1',
    commissionerId: 'c1',
    patientId: 'p1',
    amount: 8,
    status: 'paid',
    date: '2026-03-20'
  },
  {
    id: 'com2',
    commissionerId: 'c1',
    patientId: 'p3',
    amount: 7,
    status: 'pending',
    date: '2026-03-25'
  }
];

// Helper functions
export const getDoctorById = (id: string) => doctors.find(d => d.id === id);
export const getPatientById = (id: string) => patients.find(p => p.id === id);
export const getAppointmentsByDoctorId = (doctorId: string) =>
  appointments.filter(a => a.doctorId === doctorId);
export const getAppointmentsByPatientId = (patientId: string) =>
  appointments.filter(a => a.patientId === patientId);
export const getMedicalRecordsByPatientId = (patientId: string) =>
  medicalRecords.filter(mr => mr.patientId === patientId);
export const getPrescriptionsByPatientId = (patientId: string) =>
  prescriptions.filter(pr => pr.patientId === patientId);
export const getPaymentsByPatientId = (patientId: string) =>
  payments.filter(p => p.patientId === patientId);
