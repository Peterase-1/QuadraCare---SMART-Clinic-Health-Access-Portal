const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get lab tech dashboard stats
// @route   GET /api/labtech/dashboard
// @access  Private (Lab Tech)
exports.getDashboardStats = async (req, res) => {
  try {
    // Count records where status is 'lab_test'
    const pendingRequests = await MedicalRecord.countDocuments({ status: 'lab_test' });
    // Count records where labRequest exists and status is NOT 'lab_test' (meaning completed)
    const completedRequests = await MedicalRecord.countDocuments({
      'labRequest.required': true,
      status: { $ne: 'lab_test' }
    });

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
    // Find records where status is 'lab_test' or lab work was done
    const requests = await MedicalRecord.find({ 'labRequest.required': true })
      .populate('patient', 'name email')
      .populate('doctor', 'name')
      .sort({ status: 1, date: -1 }); // 'lab_test' comes before others alphabetically? No, let's just fetch all and sort on frontend or refine query

    // Better: Fetch pending requests
    const pending = await MedicalRecord.find({ status: 'lab_test' })
      .populate('patient', 'name')
      .populate('doctor', 'name');

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload lab result (Update record)
// @route   PUT /api/labtech/requests/:id
// @access  Private (Lab Tech)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { resultData, comments, bloodPressure, temperature, heartRate, bloodSugar, cholesterol, wbc, hemoglobin } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // In a real app, check if assigned to this lab tech or if any lab tech can pick it up
    // For now, just check role (middleware does this)

    record.labResults = {
      resultData, // Summary or raw text
      bloodPressure,
      temperature,
      heartRate,
      bloodSugar,
      cholesterol,
      wbc,
      hemoglobin,
      comments,
      completionDate: Date.now()
    };
    record.status = 'review'; // Send back to doctor for review

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
