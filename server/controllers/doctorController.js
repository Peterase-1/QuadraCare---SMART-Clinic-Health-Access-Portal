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
    const appointments = await Appointment.find({
      doctor: req.user.id,
      status: { $ne: 'completed' }
    })
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

// @desc    Create new consultation record
// @route   POST /api/doctor/records
// @access  Private (Doctor)
const fs = require('fs');
const path = require('path');

exports.createConsultation = async (req, res) => {
  const logFile = path.join(__dirname, '../debug.log');
  const log = (msg) => fs.appendFileSync(logFile, new Date().toISOString() + ': ' + msg + '\n');

  log('--- createConsultation START ---');
  log('Request Body: ' + JSON.stringify(req.body, null, 2));

  try {
    if (!req.user || !req.user._id) {
      throw new Error('User not authenticated or missing ID');
    }
    log('User ID: ' + req.user._id);

    const { patientId, patientDetails, labRequest } = req.body;

    if (!patientId) {
      throw new Error('patientId is missing');
    }

    const recordData = {
      doctor: req.user._id,
      patient: patientId,
      patientDetails,
      status: 'consultation'
    };

    // If lab is requested
    if (labRequest && labRequest.required) {
      log('Processing Lab Request...');
      recordData.labRequest = {
        required: true,
        testType: labRequest.testType,
        requestDate: Date.now()
      };
      // Only add assignedTo if it's a valid ID (not null/undefined)
      if (labRequest.assignedTo) {
        log('Assigning to: ' + labRequest.assignedTo);
        recordData.labRequest.assignedTo = labRequest.assignedTo;
      } else {
        log('No specific Lab Tech assigned (assignedTo is null/undefined)');
      }
      recordData.status = 'lab_test';
    }

    log('Creating Medical Record with data: ' + JSON.stringify(recordData, null, 2));
    const record = await MedicalRecord.create(recordData);
    log('Medical Record Created Successfully: ' + record._id);

    // Mark appointment as completed so it disappears from the list
    // We assume the doctor starts consultation from an appointment
    // Find the appointment for this patient and doctor that is 'approved'
    const appointment = await Appointment.findOne({
      patient: patientId,
      doctor: req.user._id,
      status: 'approved'
    });

    if (appointment) {
      appointment.status = 'completed';
      await appointment.save();
      log('Appointment marked as completed: ' + appointment._id);
    }

    res.status(201).json(record);
  } catch (error) {
    log('!!! Error in createConsultation !!!');
    log('Error Name: ' + error.name);
    log('Error Message: ' + error.message);
    log('Stack: ' + error.stack);
    console.error('Error in createConsultation:', error);
    res.status(500).json({ message: error.message, error: error.toString() });
  }
};

// @desc    Finalize record (Diagnosis & Prescription)
// @route   PUT /api/doctor/records/:id/finalize
// @access  Private (Doctor)
exports.finalizeRecord = async (req, res) => {
  const { diagnosis, prescription } = req.body;

  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    record.diagnosis = diagnosis;
    record.prescription = prescription;
    record.status = 'pharmacy'; // Send to pharmacy

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close a medical record (Case Closed)
// @route   PUT /api/doctor/records/:id/close
// @access  Private (Doctor)
exports.closeRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    record.status = 'closed';
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Doctor's Patients
// @route   GET /api/doctor/patients
// @access  Private (Doctor)
exports.getDoctorPatients = async (req, res) => {
  try {
    // For now, return all patients. In real app, filter by doctor's appointments
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Records for a Patient
// @route   GET /api/doctor/patients/:id/records
// @access  Private (Doctor)
exports.getPatientRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'name')
      .populate('labRequest.assignedTo', 'name')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get Active Records (Consultation, Lab, Review)
// @route   GET /api/doctor/records/active
// @access  Private (Doctor)
exports.getActiveRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      doctor: req.user._id,
      status: { $in: ['consultation', 'lab_test', 'review'] }
    })
      .populate('patient', 'name email')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
