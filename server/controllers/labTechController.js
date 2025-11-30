const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get lab tech dashboard stats
// @route   GET /api/labtech/dashboard
// @access  Private (Lab Tech)
exports.getDashboardStats = async (req, res) => {
  try {
    // Count records where labResults is empty (meaning pending lab work) or explicitly use labStatus if we want to be stricter
    // For now, let's assume any record can have lab work added, but we'll focus on those that might need it.
    // Actually, usually a doctor orders a lab. Since we don't have a separate "Lab Order" model, 
    // let's assume any record with 'pending' labStatus is a request.
    const pendingRequests = await MedicalRecord.countDocuments({ labStatus: 'pending' });
    const completedRequests = await MedicalRecord.countDocuments({ labStatus: 'completed' });

    res.json({
      pendingRequests,
      completedRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all lab requests (pending first)
// @route   GET /api/labtech/requests
// @access  Private (Lab Tech)
exports.getLabRequests = async (req, res) => {
  try {
    const requests = await MedicalRecord.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name')
      .sort({ labStatus: -1, date: -1 }); // pending > completed

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload lab result (Update record)
// @route   PUT /api/labtech/requests/:id
// @access  Private (Lab Tech)
exports.uploadLabResult = async (req, res) => {
  try {
    const { labResults } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    record.labResults = labResults;
    record.labStatus = 'completed';
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
