const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['General', 'Surgical', 'Pediatric', 'Maternity', 'ICU', 'Emergency'],
    default: 'General'
  },
  capacity: {
    type: Number,
    required: true,
    default: 20
  },
  gender: { // Optional: some wards might be gender specific
    type: String,
    enum: ['Mixed', 'Male', 'Female'],
    default: 'Mixed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ward', wardSchema);
