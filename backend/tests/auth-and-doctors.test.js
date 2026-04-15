const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const app = require('../src/app');
const pool = require('../src/database/pool');

describe('Auth and public doctors API', () => {
  let server;
  let baseUrl;
  let accessToken;
  let doctorAccessToken;
  let adminAccessToken;
  let onboardedDoctorId;
  let onboardedDoctorToken;
  let bookedAppointmentId;

  function futureDateForDay(dayOfWeek) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().slice(0, 10);
  }

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  async function login(email, password) {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.data.accessToken);

    return body.data.accessToken;
  }

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    await pool.end();
  });

  it('logs in with a seeded patient user', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ana.paciente@mediconnect.local',
        password: 'Paciente123!'
      })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.user.role, 'paciente');
    assert.ok(body.data.accessToken);

    accessToken = body.data.accessToken;
  });

  it('logs in with seeded doctor and admin users', async () => {
    doctorAccessToken = await login('dr.lopez@mediconnect.local', 'Doctor123!');
    adminAccessToken = await login('admin@mediconnect.local', 'Admin123!');
  });

  it('returns the authenticated user with /auth/me', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.email, 'ana.paciente@mediconnect.local');
    assert.equal(body.data.role, 'paciente');
  });

  it('keeps doctors search public', async () => {
    const response = await fetch(`${baseUrl}/api/v1/doctors?specialty=Medicina`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
  });

  it('requires authentication for appointments', async () => {
    const response = await fetch(`${baseUrl}/api/v1/appointments`);

    assert.equal(response.status, 401);
  });

  it('scopes appointments by authenticated patient', async () => {
    const response = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 2);
    assert.ok(body.data.every((appointment) => appointment.patient === 'Ana María Ramírez'));
  });

  it('scopes appointments by authenticated doctor', async () => {
    const response = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: {
        Authorization: `Bearer ${doctorAccessToken}`
      }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 3);
    assert.ok(body.data.every((appointment) => appointment.doctor === 'Julián López'));
  });

  it('allows administrator to see all appointments', async () => {
    const response = await fetch(`${baseUrl}/api/v1/appointments`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 5);
  });

  it('prevents a patient from cancelling another patient appointment', async () => {
    const response = await fetch(`${baseUrl}/api/v1/appointments/70000000-0000-0000-0000-000000000002/cancel`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancellationReason: 'Intento no autorizado'
      })
    });

    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, 'You do not have permission to manage this appointment');
  });

  it('registers a new patient with profile and balance', async () => {
    const suffix = Date.now();
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `paciente.${suffix}@example.com`,
        password: 'Paciente123!',
        phone: '+573009990001',
        role: 'paciente',
        profile: {
          firstName: 'Paciente',
          lastName: 'Prueba',
          documentType: 'CC',
          documentNumber: `P${suffix}`,
          birthDate: '1991-05-20',
          gender: 'femenino',
          bloodType: 'O+',
          address: 'Bogotá, Colombia',
          authorizesCommissionAgentChat: true
        }
      })
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.user.role, 'paciente');
    assert.equal(body.data.user.status, 'activo');
    assert.ok(body.data.profile.id);
    assert.ok(body.data.balance.id);
    assert.ok(body.data.accessToken);
  });

  it('registers a new doctor as pending verification and not publicly searchable', async () => {
    const suffix = Date.now();
    const email = `doctor.${suffix}@example.com`;
    const firstName = `Doctor${suffix}`;

    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: 'Doctor123!',
        phone: '+573009990002',
        role: 'medico',
        profile: {
          firstName,
          lastName: 'Pendiente',
          documentType: 'CC',
          documentNumber: `M${suffix}`,
          medicalLicenseNumber: `RM-${suffix}`,
          professionalBio: 'Registro médico pendiente de documentos.',
          yearsOfExperience: 2,
          consultationFee: 140000,
          careMode: 'virtual',
          city: 'Bogotá'
        }
      })
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.user.role, 'medico');
    assert.equal(body.data.user.status, 'pendiente_verificacion');
    assert.equal(body.data.profile.validationStatus, 'pendiente_documentacion');
    assert.ok(body.data.balance.id);
    assert.ok(body.data.accessToken);

    const doctorsResponse = await fetch(`${baseUrl}/api/v1/doctors?city=Bogotá`);
    const doctorsBody = await doctorsResponse.json();
    const createdDoctorIsPublic = doctorsBody.data.some((doctor) => doctor.nombres === firstName);

    assert.equal(doctorsResponse.status, 200);
    assert.equal(createdDoctorIsPublic, false);
  });

  it('moves a new doctor from document upload to admin approval and public search', async () => {
    const suffix = Date.now();
    const email = `onboarding.doctor.${suffix}@example.com`;
    const firstName = `OnboardingDoctor${suffix}`;
    const city = 'Cartagena';

    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: 'Doctor123!',
        phone: '+573009990003',
        role: 'medico',
        profile: {
          firstName,
          lastName: 'Revision',
          documentType: 'CC',
          documentNumber: `OB${suffix}`,
          medicalLicenseNumber: `RM-OB-${suffix}`,
          professionalBio: 'Médico en flujo de onboarding.',
          yearsOfExperience: 3,
          consultationFee: 155000,
          careMode: 'virtual',
          city
        }
      })
    });

    const registerBody = await registerResponse.json();
    const newDoctorToken = registerBody.data.accessToken;
    onboardedDoctorToken = newDoctorToken;

    assert.equal(registerResponse.status, 201);
    assert.equal(registerBody.data.profile.validationStatus, 'pendiente_documentacion');

    const uploadResponse = await fetch(`${baseUrl}/api/v1/doctors/me/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${newDoctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentType: 'licencia_medica',
        fileName: `licencia-${suffix}.pdf`,
        fileUrl: `https://storage.local/licencia-${suffix}.pdf`
      })
    });

    const uploadBody = await uploadResponse.json();
    const doctorId = uploadBody.data.document.doctorId;
    onboardedDoctorId = doctorId;
    const documentId = uploadBody.data.document.id;

    assert.equal(uploadResponse.status, 201);
    assert.equal(uploadBody.data.document.reviewStatus, 'en_revision');
    assert.equal(uploadBody.data.doctor.validationStatus, 'documentacion_en_revision');

    const pendingResponse = await fetch(`${baseUrl}/api/v1/doctors/pending-review`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const pendingBody = await pendingResponse.json();
    const doctorIsPending = pendingBody.data.some((doctor) => doctor.id === doctorId);

    assert.equal(pendingResponse.status, 200);
    assert.equal(doctorIsPending, true);

    const reviewResponse = await fetch(`${baseUrl}/api/v1/doctors/${doctorId}/documents/${documentId}/review`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reviewStatus: 'aprobado',
        reviewObservation: 'Documento válido para el MVP.'
      })
    });

    const reviewBody = await reviewResponse.json();

    assert.equal(reviewResponse.status, 200);
    assert.equal(reviewBody.data.reviewStatus, 'aprobado');

    const approveResponse = await fetch(`${baseUrl}/api/v1/doctors/${doctorId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const approveBody = await approveResponse.json();

    assert.equal(approveResponse.status, 200);
    assert.equal(approveBody.data.validationStatus, 'activo');

    const doctorsResponse = await fetch(`${baseUrl}/api/v1/doctors?city=${city}`);
    const doctorsBody = await doctorsResponse.json();
    const approvedDoctorIsPublic = doctorsBody.data.some((doctor) => doctor.nombres === firstName);

    assert.equal(doctorsResponse.status, 200);
    assert.equal(approvedDoctorIsPublic, true);
  });

  it('creates doctor availability, exposes real slots and books an exact slot once', async () => {
    const doctorId = onboardedDoctorId;
    const date = futureDateForDay(1);
    const dayOfWeek = new Date(`${date}T00:00:00-05:00`).getDay();
    const scheduledStartAt = new Date(`${date}T06:00:00-05:00`).toISOString();
    const scheduledEndAt = new Date(`${date}T06:30:00-05:00`).toISOString();

    const createAvailabilityResponse = await fetch(`${baseUrl}/api/v1/availability/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dayOfWeek,
        startTime: '06:00',
        endTime: '07:00',
        slotDurationMinutes: 30,
        timeZone: 'America/Bogota',
        validFrom: date
      })
    });

    const createAvailabilityBody = await createAvailabilityResponse.json();

    assert.equal(createAvailabilityResponse.status, 201);
    assert.equal(createAvailabilityBody.data.dayOfWeek, dayOfWeek);

    const publicAvailabilityResponse = await fetch(`${baseUrl}/api/v1/doctors/${doctorId}/availability?date=${date}`);
    const publicAvailabilityBody = await publicAvailabilityResponse.json();
    const targetSlot = publicAvailabilityBody.data.slots.find((slot) => {
      const slotDate = new Date(slot.startAt);
      return slot.date === date && slotDate.getUTCHours() === 11 && slotDate.getUTCMinutes() === 0;
    });

    assert.equal(publicAvailabilityResponse.status, 200);
    assert.ok(targetSlot);
    assert.equal(targetSlot.isAvailable, true);

    const createAppointmentResponse = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId,
        scheduledStartAt,
        scheduledEndAt,
        timeZone: 'America/Bogota',
        reason: 'Prueba de slot real',
        appointmentType: 'primera_vez',
        careChannel: 'virtual',
        referralCodeId: '64000000-0000-0000-0000-000000000002'
      })
    });

    const createdAppointmentBody = await createAppointmentResponse.json();
    bookedAppointmentId = createdAppointmentBody.data.id;

    assert.equal(createAppointmentResponse.status, 201);

    const duplicateAppointmentResponse = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId,
        scheduledStartAt,
        scheduledEndAt,
        timeZone: 'America/Bogota',
        reason: 'Prueba de solapamiento',
        appointmentType: 'primera_vez',
        careChannel: 'virtual',
        referralCodeId: '64000000-0000-0000-0000-000000000002'
      })
    });

    assert.equal(duplicateAppointmentResponse.status, 409);
  });

  it('manages specialties and assigns one to the authenticated doctor', async () => {
    const suffix = Date.now();
    const specialtyResponse = await fetch(`${baseUrl}/api/v1/specialties`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Especialidad Test ${suffix}`,
        description: 'Especialidad creada durante prueba automatizada.'
      })
    });

    const specialtyBody = await specialtyResponse.json();
    const specialtyId = specialtyBody.data.id;

    assert.equal(specialtyResponse.status, 201);
    assert.ok(specialtyId);

    const assignResponse = await fetch(`${baseUrl}/api/v1/specialties/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${doctorAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        specialtyId,
        isPrimary: false
      })
    });

    const assignBody = await assignResponse.json();

    assert.equal(assignResponse.status, 201);
    assert.equal(assignBody.data.specialtyId, specialtyId);

    const listResponse = await fetch(`${baseUrl}/api/v1/specialties`);
    const listBody = await listResponse.json();
    const exists = listBody.data.some((specialty) => specialty.id === specialtyId);

    assert.equal(listResponse.status, 200);
    assert.equal(exists, true);
  });

  it('creates a dummy payment with commission and balance movement', async () => {
    const response = await fetch(`${baseUrl}/api/v1/payments/appointments/${bookedAppointmentId}/dummy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: 'dummy_card',
        providerReference: `TEST-PAY-${Date.now()}`
      })
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.payment.status, 'pagado');
    assert.ok(body.data.commission);
    assert.ok(body.data.balanceMovement);
  });

  it('updates patient and doctor profiles and lists users with pagination', async () => {
    const patientProfileResponse = await fetch(`${baseUrl}/api/v1/profiles/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: 'Dirección actualizada desde test',
        authorizesCommissionAgentChat: false
      })
    });

    const patientProfileBody = await patientProfileResponse.json();

    assert.equal(patientProfileResponse.status, 200);
    assert.equal(patientProfileBody.data.address || patientProfileBody.data.direccion, 'Dirección actualizada desde test');

    const doctorProfileResponse = await fetch(`${baseUrl}/api/v1/profiles/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        city: 'Santa Marta',
        consultationFee: 175000
      })
    });

    const doctorProfileBody = await doctorProfileResponse.json();

    assert.equal(doctorProfileResponse.status, 200);
    assert.equal(doctorProfileBody.data.city || doctorProfileBody.data.ciudad, 'Santa Marta');

    const usersResponse = await fetch(`${baseUrl}/api/v1/users?page=1&limit=5`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const usersBody = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.ok(Array.isArray(usersBody.data));
    assert.equal(usersBody.pagination.page, 1);
    assert.equal(usersBody.pagination.limit, 5);
  });

  it('allows admin to block and unblock a user', async () => {
    const suffix = Date.now();
    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `blockable.${suffix}@example.com`,
        password: 'Paciente123!',
        phone: '+573009990004',
        role: 'paciente',
        profile: {
          firstName: 'Usuario',
          lastName: 'Bloqueable',
          documentType: 'CC',
          documentNumber: `BL${suffix}`,
          birthDate: '1990-01-01'
        }
      })
    });

    const registerBody = await registerResponse.json();
    const userId = registerBody.data.user.id;

    const blockResponse = await fetch(`${baseUrl}/api/v1/users/${userId}/block`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const blockBody = await blockResponse.json();

    assert.equal(blockResponse.status, 200);
    assert.equal(blockBody.data.status, 'bloqueado');

    const unblockResponse = await fetch(`${baseUrl}/api/v1/users/${userId}/unblock`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`
      }
    });

    const unblockBody = await unblockResponse.json();

    assert.equal(unblockResponse.status, 200);
    assert.equal(unblockBody.data.status, 'activo');
  });

  it('completes an appointment and creates clinical note and prescription', async () => {
    const confirmResponse = await fetch(`${baseUrl}/api/v1/appointments/${bookedAppointmentId}/confirm`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`
      }
    });

    assert.equal(confirmResponse.status, 200);

    const completeResponse = await fetch(`${baseUrl}/api/v1/appointments/${bookedAppointmentId}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`
      }
    });

    assert.equal(completeResponse.status, 200);

    const noteResponse = await fetch(`${baseUrl}/api/v1/clinical/appointments/${bookedAppointmentId}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subjective: 'Paciente refiere mejoría parcial.',
        objective: 'Sin signos de alarma.',
        assessment: 'Cuadro estable.',
        plan: 'Control y receta simple.'
      })
    });

    const noteBody = await noteResponse.json();

    assert.equal(noteResponse.status, 201);
    assert.ok(noteBody.data.id);

    const prescriptionResponse = await fetch(`${baseUrl}/api/v1/clinical/appointments/${bookedAppointmentId}/prescriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${onboardedDoctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        generalInstructions: 'Tomar con alimentos.',
        items: [
          {
            medication: 'Acetaminofén',
            presentation: 'Tableta 500mg',
            dose: '1 tableta',
            frequency: 'Cada 8 horas',
            durationDays: 3,
            instructions: 'Suspender si hay reacción adversa.'
          }
        ]
      })
    });

    const prescriptionBody = await prescriptionResponse.json();

    assert.equal(prescriptionResponse.status, 201);
    assert.equal(prescriptionBody.data.items.length, 1);

    const myPrescriptionsResponse = await fetch(`${baseUrl}/api/v1/clinical/prescriptions/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const myPrescriptionsBody = await myPrescriptionsResponse.json();
    const prescriptionExists = myPrescriptionsBody.data.some((prescription) => prescription.id === prescriptionBody.data.id);

    assert.equal(myPrescriptionsResponse.status, 200);
    assert.equal(prescriptionExists, true);
  });
});
