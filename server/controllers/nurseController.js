const InpatientRecord = require('../models/InpatientRecord');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Get rooms assigned to nurse
// @route   GET /api/nurse/rooms
// @access  Private (Nurse)
exports.getAssignedRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ assignedNurses: req.user.id })
      .populate('ward', 'name')
      .populate({
        path: 'ward',
        select: 'name'
      });

    // We might also want to fetch the patients in these rooms
    // This could be a separate query or we can iterate and find active InpatientRecords

    const roomsWithPatients = await Promise.all(rooms.map(async (room) => {
      const records = await InpatientRecord.find({ room: room._id, status: 'Admitted' })
        .populate('patient', 'name email gender dateOfBirth') // Assuming DOB exists or calculate age
        .populate('doctor', 'name');
      return {
        ...room.toObject(),
        patients: records
      };
    }));

    res.json(roomsWithPatients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inpatient record details
// @route   GET /api/nurse/records/:id
// @access  Private (Nurse)
exports.getInpatientRecord = async (req, res) => {
  try {
    const record = await InpatientRecord.findById(req.params.id)
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .populate('room', 'roomNumber');

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add daily log
// @route   POST /api/nurse/records/:id/log
// @access  Private (Nurse)
exports.addDailyLog = async (req, res) => {
  const { vitals, notes } = req.body;
  try {
    const record = await InpatientRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    record.dailyLogs.push({
      nurse: req.user.id,
      vitals,
      notes,
      date: Date.now()
    });

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Administer medication
// @route   POST /api/nurse/records/:id/medicate
// @access  Private (Nurse)
exports.administerMedication = async (req, res) => {
  const { name, dosage } = req.body;
  try {
    const record = await InpatientRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Find the latest log for today or create a new one? 
    // Usually medications are recorded in real-time.
    // Let's create a new log entry just for medication or append to today's if exists

    // Simple approach: Add to the latest log if it was created by this nurse today, else new log
    // For simplicity, we'll just push a new log entry with medication info primarily

    const lastLog = record.dailyLogs[record.dailyLogs.length - 1];
    const isToday = lastLog && new Date(lastLog.date).toDateString() === new Date().toDateString();

    if (isToday && lastLog.nurse && lastLog.nurse.toString() === req.user.id) {
      lastLog.medicationsAdministered.push({
        name,
        dosage,
        time: Date.now(),
        administeredBy: req.user.id
      });
    } else {
      record.dailyLogs.push({
        nurse: req.user.id,
        date: Date.now(),
        medicationsAdministered: [{
          name,
          dosage,
          time: Date.now(),
          administeredBy: req.user.id
        }]
      });
    }

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
