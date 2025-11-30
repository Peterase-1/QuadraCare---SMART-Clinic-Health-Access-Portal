const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  bookAppointment,
  getAppointments,
  getMedicalRecords,
  getDoctors
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.post('/appointments', protect, bookAppointment);
router.get('/appointments', protect, getAppointments);
router.get('/records', protect, getMedicalRecords);
router.get('/doctors', protect, getDoctors);

module.exports = router;
