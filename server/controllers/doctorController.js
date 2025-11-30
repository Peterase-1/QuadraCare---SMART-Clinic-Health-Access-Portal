const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

// @desc    Get doctor dashboard stats
// @route   GET /api/doctor/dashboard
// @access  Private (Doctor)
exports.getDoctorDashboard = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id });
    const patients = await User.find({ role: 'patient' }); // In a real app, filter by doctor's patients

    res.json({
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      totalPatients: patients.length, // Simplified for now
      recentAppointments: appointments.sort((a, b) => b.date - a.date).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor)
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/doctor/appointments/:id
// @access  Private (Doctor)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all patients (for record addition)
// @route   GET /api/doctor/patients
// @access  Private (Doctor)
exports.getPatients = async (req, res) => {
  try {
    // Ideally, only patients who have booked with this doctor
    // For now, return all patients to simplify
    const patients = await User.find({ role: 'patient' }).select('name email');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add medical record
// @route   POST /api/doctor/records
// @access  Private (Doctor)
exports.addMedicalRecord = async (req, res) => {
  const { patientId, diagnosis, prescription, labResults } = req.body;

  try {
    const record = await MedicalRecord.create({
      patient: patientId,
      doctor: req.user.id,
      diagnosis,
      prescription,
      labResults
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
