const mongoose = require('mongoose');

const AmbulanceRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['Critical', 'Non-Critical'],
    default: 'Critical'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  caseDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'Completed'],
    default: 'Pending'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AmbulanceRequest', AmbulanceRequestSchema);
