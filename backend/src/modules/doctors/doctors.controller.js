const doctorsService = require('./doctors.service');

async function searchDoctors(req, res) {
  const result = await doctorsService.searchDoctors({
    city: req.query.city,
    specialty: req.query.specialty,
    minRating: req.query.minRating,
    minYearsExperience: req.query.minYearsExperience,
    page: req.query.page,
    limit: req.query.limit
  });

  res.status(200).json(result);
}

async function getPublicDoctorProfile(req, res) {
  const doctor = await doctorsService.getPublicDoctorProfile(req.params.doctorId);

  res.status(200).json({
    data: doctor
  });
}

async function uploadMedicalDocument(req, res) {
  const result = await doctorsService.uploadMedicalDocument(req.body, req.user);

  res.status(201).json({
    message: 'Medical document uploaded successfully',
    data: result
  });
}

async function listDoctorsPendingReview(req, res) {
  const doctors = await doctorsService.listDoctorsPendingReview();

  res.status(200).json({
    data: doctors
  });
}

async function reviewMedicalDocument(req, res) {
  const document = await doctorsService.reviewMedicalDocument(
    req.params.doctorId,
    req.params.documentId,
    req.body,
    req.user
  );

  res.status(200).json({
    message: 'Medical document reviewed successfully',
    data: document
  });
}

async function approveDoctor(req, res) {
  const doctor = await doctorsService.approveDoctor(req.params.doctorId, req.user);

  res.status(200).json({
    message: 'Doctor approved successfully',
    data: doctor
  });
}

async function rejectDoctor(req, res) {
  const doctor = await doctorsService.rejectDoctor(req.params.doctorId, req.body, req.user);

  res.status(200).json({
    message: 'Doctor rejected successfully',
    data: doctor
  });
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
