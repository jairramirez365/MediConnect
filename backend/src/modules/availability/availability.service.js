const AppError = require('../../utils/AppError');
const { isUuid } = require('../../utils/validators');
const availabilityRepository = require('./availability.repository');

function validateAvailabilityPayload(payload, partial = false) {
  const required = ['dayOfWeek', 'startTime', 'endTime', 'slotDurationMinutes', 'timeZone', 'validFrom'];

  if (!partial) {
    const missingFields = required.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
    if (missingFields.length > 0) throw new AppError('Validation error', 400, { missingFields });
  }

  if (payload.dayOfWeek !== undefined && (payload.dayOfWeek < 0 || payload.dayOfWeek > 6)) {
    throw new AppError('dayOfWeek must be between 0 and 6', 400);
  }

  if (payload.slotDurationMinutes !== undefined && payload.slotDurationMinutes <= 0) {
    throw new AppError('slotDurationMinutes must be greater than zero', 400);
  }

  if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
    throw new AppError('startTime must be less than endTime', 400);
  }
}

async function resolveDoctorProfile(user) {
  const doctorProfile = await availabilityRepository.findDoctorProfileByUserId(user.sub);

  if (!doctorProfile) {
    throw new AppError('Doctor profile not found for authenticated user', 403);
  }

  if (doctorProfile.validationStatus !== 'activo') {
    throw new AppError('Doctor must be active to manage availability', 409);
  }

  return doctorProfile;
}

function localDateTimeToDate(date, time) {
  return new Date(`${date}T${time}-05:00`);
}

function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDatesBetween(dateFrom, dateTo) {
  const dates = [];
  const current = new Date(`${dateFrom}T00:00:00-05:00`);
  const end = new Date(`${dateTo}T00:00:00-05:00`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function isSlotBooked(slotStart, slotEnd, appointments) {
  return appointments.some((appointment) => {
    const appointmentStart = new Date(appointment.scheduledStartAt);
    const appointmentEnd = new Date(appointment.scheduledEndAt);
    return slotStart < appointmentEnd && slotEnd > appointmentStart;
  });
}

function buildSlots(availabilityRows, appointments, dateFrom, dateTo) {
  const slots = [];

  for (const date of getDatesBetween(dateFrom, dateTo)) {
    const dayOfWeek = new Date(`${date}T00:00:00-05:00`).getDay();

    for (const availability of availabilityRows) {
      const validFrom = new Date(availability.validFrom).toISOString().slice(0, 10);
      const validTo = availability.validTo ? new Date(availability.validTo).toISOString().slice(0, 10) : null;

      if (!availability.isActive || availability.dayOfWeek !== dayOfWeek) continue;
      if (date < validFrom) continue;
      if (validTo && date > validTo) continue;

      const startMinutes = timeToMinutes(availability.startTime);
      const endMinutes = timeToMinutes(availability.endTime);

      for (let cursor = startMinutes; cursor + availability.slotDurationMinutes <= endMinutes; cursor += availability.slotDurationMinutes) {
        const startTime = minutesToTime(cursor);
        const endTime = minutesToTime(cursor + availability.slotDurationMinutes);
        const slotStart = localDateTimeToDate(date, startTime);
        const slotEnd = localDateTimeToDate(date, endTime);

        slots.push({
          doctorId: availability.doctorId,
          date,
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          timeZone: availability.timeZone,
          isAvailable: !isSlotBooked(slotStart, slotEnd, appointments)
        });
      }
    }
  }

  return slots;
}

async function createMyAvailability(payload, user) {
  validateAvailabilityPayload(payload);
  const doctorProfile = await resolveDoctorProfile(user);

  return availabilityRepository.createAvailability({
    ...payload,
    doctorId: doctorProfile.id
  });
}

async function listMyAvailability(user) {
  const doctorProfile = await resolveDoctorProfile(user);
  return availabilityRepository.listDoctorAvailability(doctorProfile.id);
}

async function updateMyAvailability(availabilityId, payload, user) {
  if (!isUuid(availabilityId)) throw new AppError('Invalid availabilityId', 400);
  validateAvailabilityPayload(payload, true);
  const doctorProfile = await resolveDoctorProfile(user);
  const availability = await availabilityRepository.updateAvailability(availabilityId, doctorProfile.id, payload);

  if (!availability) throw new AppError('Availability not found', 404);
  return availability;
}

async function deleteMyAvailability(availabilityId, user) {
  if (!isUuid(availabilityId)) throw new AppError('Invalid availabilityId', 400);
  const doctorProfile = await resolveDoctorProfile(user);
  const deleted = await availabilityRepository.deleteAvailability(availabilityId, doctorProfile.id);

  if (!deleted) throw new AppError('Availability not found', 404);
  return deleted;
}

async function getDoctorAvailability(doctorId, query) {
  if (!isUuid(doctorId)) throw new AppError('Invalid doctorId', 400);

  const today = new Date().toISOString().slice(0, 10);
  const dateFrom = query.dateFrom || query.date || today;
  const dateTo = query.dateTo || query.date || dateFrom;
  const availability = await availabilityRepository.listDoctorAvailability(doctorId);
  const appointments = await availabilityRepository.listAppointmentsForDoctor(
    doctorId,
    `${dateFrom}T00:00:00-05:00`,
    `${dateTo}T23:59:59-05:00`
  );

  return {
    availability,
    slots: buildSlots(availability, appointments, dateFrom, dateTo)
  };
}

module.exports = {
  createMyAvailability,
  deleteMyAvailability,
  getDoctorAvailability,
  listMyAvailability,
  updateMyAvailability
};
