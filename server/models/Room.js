const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true // Room numbers should probably be unique across the hospital, or compound unique with Ward
  },
  ward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true
  },
  type: {
    type: String,
    enum: ['Private', 'Semi-Private', 'General'],
    default: 'General'
  },
  capacity: {
    type: Number,
    required: true,
    default: 1
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Full', 'Maintenance', 'Cleaning'],
    default: 'Available'
  },
  features: [String], // e.g., "Oxygen", "Ventilator"
  assignedNurses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
