const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const { buildPagination, getPagination } = require('../../utils/pagination');
const doctorsRepository = require('./doctors.repository');

async function searchDoctors(filters) {
  const pagination = getPagination(filters);
  const result = await doctorsRepository.searchDoctors({
    ...filters,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    minYearsExperience: filters.minYearsExperience ? Number(filters.minYearsExperience) : undefined,
    ...pagination
  });

  return {
    data: result.rows,
    pagination: buildPagination({ ...pagination, total: result.total })
  };
}

async function getPublicDoctorProfile(doctorId) {
  const doctor = await doctorsRepository.findPublicDoctorById(doctorId);

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
}

function validateDocumentPayload(payload) {
  const requiredFields = ['documentType', 'fileName', 'fileUrl'];
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    throw new AppError('Validation error', 400, { missingFields });
  }
}

async function uploadMedicalDocument(payload, user) {
  validateDocumentPayload(payload);

  const doctorProfile = await doctorsRepository.findDoctorProfileByUserId(user.sub);

  if (!doctorProfile) {
    throw new AppError('Doctor profile not found for authenticated user', 403);
  }

  if (!['registro_basico', 'pendiente_documentacion', 'documentacion_en_revision'].includes(doctorProfile.validationStatus)) {
    throw new AppError('Doctor is not allowed to upload documents in current status', 409);
  }

  return doctorsRepository.createMedicalDocument({
    doctorId: doctorProfile.id,
    documentType: payload.documentType,
    fileName: payload.fileName,
    fileUrl: payload.fileUrl
  });
}

async function listDoctorsPendingReview() {
  return doctorsRepository.listDoctorsPendingReview();
}

async function reviewMedicalDocument(doctorId, documentId, payload, user) {
  if (!['aprobado', 'rechazado'].includes(payload.reviewStatus)) {
    throw new AppError('Invalid document review status', 400);
  }

  const adminProfile = await doctorsRepository.findAdminProfileByUserId(user.sub);

  if (!adminProfile) {
    throw new AppError('Admin profile not found for authenticated user', 403);
  }

  const document = await doctorsRepository.reviewMedicalDocument({
    doctorId,
    documentId,
    reviewStatus: payload.reviewStatus,
    reviewObservation: payload.reviewObservation,
    adminProfileId: adminProfile.adminProfileId || adminProfile.id
  });

  if (!document) {
    throw new AppError('Medical document not found', 404);
  }

  await writeAudit({
    actorUserId: user.sub,
    entity: 'documento_medico',
    entityId: document.id,
    action: 'revisar_documento_medico',
    newValues: {
      reviewStatus: payload.reviewStatus,
      doctorId
    }
  });

  return document;
}

async function approveDoctor(doctorId, user) {
  const adminProfile = await doctorsRepository.findAdminProfileByUserId(user.sub);

  if (!adminProfile) {
    throw new AppError('Admin profile not found for authenticated user', 403);
  }

  let reviewSummary = await doctorsRepository.getDocumentReviewSummary(doctorId);

  if (reviewSummary && reviewSummary.approvedDocuments < 1 && reviewSummary.totalDocuments > 0 && reviewSummary.rejectedDocuments === 0) {
    await doctorsRepository.approvePendingDocumentsForDoctor(doctorId, adminProfile.adminProfileId || adminProfile.id);
    reviewSummary = await doctorsRepository.getDocumentReviewSummary(doctorId);
  }

  if (!reviewSummary || reviewSummary.approvedDocuments < 1) {
    throw new AppError('Doctor requires at least one approved document before activation', 409);
  }

  if (reviewSummary.rejectedDocuments > 0) {
    throw new AppError('Doctor has rejected documents and cannot be activated yet', 409);
  }

  const doctor = await doctorsRepository.approveDoctor(doctorId, adminProfile.adminProfileId || adminProfile.id);

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  await writeAudit({
    actorUserId: user.sub,
    entity: 'perfil_medico',
    entityId: doctor.id,
    action: 'aprobar_medico',
    newValues: {
      validationStatus: doctor.validationStatus
    }
  });

  return doctor;
}

async function rejectDoctor(doctorId, payload, user) {
  const adminProfile = await doctorsRepository.findAdminProfileByUserId(user.sub);

  if (!adminProfile) {
    throw new AppError('Admin profile not found for authenticated user', 403);
  }

  const doctor = await doctorsRepository.rejectDoctor(
    doctorId,
    adminProfile.adminProfileId || adminProfile.id,
    payload.reason
  );

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
}

module.exports = {
  approveDoctor,
  getPublicDoctorProfile,
  listDoctorsPendingReview,
  rejectDoctor,
  reviewMedicalDocument,
  searchDoctors,
  uploadMedicalDocument
};
