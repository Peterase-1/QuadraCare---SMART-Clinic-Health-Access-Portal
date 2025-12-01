const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get pharmacist dashboard stats
// @route   GET /api/pharmacist/dashboard
// @access  Private (Pharmacist)
exports.getDashboardStats = async (req, res) => {
  try {
    const pendingPrescriptions = await MedicalRecord.countDocuments({ status: 'pharmacy' });
    const dispensedPrescriptions = await MedicalRecord.countDocuments({ status: 'completed' });

    res.json({
      pendingPrescriptions,
      dispensedPrescriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all prescriptions (pending first)
// @route   GET /api/pharmacist/prescriptions
// @access  Private (Pharmacist)
exports.getPrescriptions = async (req, res) => {
  try {
    // Only fetch records that are in 'pharmacy' or 'completed' status
    const prescriptions = await MedicalRecord.find({
      status: { $in: ['pharmacy', 'completed'] }
    })
      .populate('patient', 'name email')
      .populate('doctor', 'name')
      .sort({ status: -1, date: -1 }); // 'pharmacy' > 'completed' (p > c)

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update prescription status (Dispense)
// @route   PUT /api/pharmacist/prescriptions/:id
// @access  Private (Pharmacist)
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    record.status = 'completed'; // Mark as completed/dispensed
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
