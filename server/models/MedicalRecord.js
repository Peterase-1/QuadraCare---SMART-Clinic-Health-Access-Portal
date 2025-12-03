const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Patient Vitals & Info (Entered by Doctor)
  patientDetails: {
    age: Number,
    weight: String,
    bloodPressure: String,
    symptoms: String,
    notes: String
  },
  // Lab Request (Optional)
  labRequest: {
    required: { type: Boolean, default: false },
    testType: String,
    requestDescription: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestDate: Date,
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  },
  // Lab Results (Entered by Lab Tech)
  labResults: {
    resultData: String, // Keep for backward compatibility or summary
    bloodPressure: String,
    temperature: String,
    heartRate: String,
    bloodSugar: String,
    cholesterol: String,
    wbc: String,
    hemoglobin: String,
    comments: String,
    completionDate: Date,
    attachment: String // URL/Path if needed
  },
  // Final Diagnosis & Prescription (Entered by Doctor)
  diagnosis: {
    type: String,
    required: false
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      route: String, // e.g., Oral, IV
      timing: String, // e.g., After Meal
      notes: String
    }],
    instructions: String
  },
  // Workflow Status
  status: {
    type: String,
    enum: ['consultation', 'lab_test', 'review', 'pharmacy', 'closed', 'completed'],
    default: 'consultation'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
