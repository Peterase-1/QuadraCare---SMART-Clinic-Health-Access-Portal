const mongoose = require('mongoose');

const inpatientRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: { // Admitting doctor
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Admitted', 'Discharged', 'Transferred'],
    default: 'Admitted'
  },
  diagnosis: String,

  // Nurse Daily Logs
  dailyLogs: [{
    date: {
      type: Date,
      default: Date.now
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vitals: {
      temperature: String,
      bloodPressure: String,
      heartRate: String,
      respiratoryRate: String,
      oxygenSaturation: String
    },
    notes: String,

    // Medications administered *during this log entry/shift*
    medicationsAdministered: [{
      name: String,
      dosage: String,
      time: Date,
      administeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],

  // Active Prescriptions for this admission (copied/linked from MedicalRecord or new)
  activePrescriptions: [{
    name: String,
    dosage: String,
    frequency: String,
    route: String,
    startDate: Date,
    endDate: Date,
    instructions: String,
    active: {
      type: Boolean,
      default: true
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InpatientRecord', inpatientRecordSchema);
