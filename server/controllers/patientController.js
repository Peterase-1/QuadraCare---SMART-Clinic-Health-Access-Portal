const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

// @desc    Get patient dashboard stats
// @route   GET /api/patient/dashboard
// @access  Private (Patient)
exports.getDashboardStats = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id });
    const records = await MedicalRecord.find({ patient: req.user.id });

    res.json({
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      totalRecords: records.length,
      recentAppointments: appointments.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book an appointment
// @route   POST /api/patient/appointments
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
  const { doctorId, date, time, reason } = req.body;

  try {
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      reason
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private (Patient)
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name email')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient medical records
// @route   GET /api/patient/records
// @access  Private (Patient)
exports.getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.id })
      .populate('doctor', 'name')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all doctors
// @route   GET /api/patient/doctors
// @access  Private
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
