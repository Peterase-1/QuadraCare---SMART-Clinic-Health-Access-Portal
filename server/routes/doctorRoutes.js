const express = require('express');
const router = express.Router();
const {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  getDoctorPatients,
  createConsultation,
  finalizeRecord,
  getPatientRecords,
  getActiveRecords
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is doctor
const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a doctor' });
  }
};

router.get('/dashboard', protect, doctorOnly, getDoctorDashboard);
router.get('/appointments', protect, doctorOnly, getDoctorAppointments);
router.put('/appointments/:id', protect, doctorOnly, updateAppointmentStatus);
router.get('/patients', protect, doctorOnly, getDoctorPatients);
router.post('/records', protect, doctorOnly, createConsultation);
router.put('/records/:id/finalize', protect, doctorOnly, finalizeRecord);
router.get('/patients/:id/records', protect, doctorOnly, getPatientRecords);

router.get('/records/active', protect, doctorOnly, getActiveRecords);

module.exports = router;
