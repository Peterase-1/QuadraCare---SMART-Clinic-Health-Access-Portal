const AmbulanceRequest = require('../models/AmbulanceRequest');

// @desc    Request an ambulance
// @route   POST /api/ambulance/request
// @access  Private (Patient)
exports.requestAmbulance = async (req, res) => {
  try {
    const { location, urgency, phoneNumber, caseDescription } = req.body;

    const newRequest = new AmbulanceRequest({
      patient: req.user.id,
      location,
      urgency,
      phoneNumber,
      caseDescription
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Ambulance requested successfully',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient's active ambulance request
// @route   GET /api/ambulance/my-request
// @access  Private (Patient)
exports.getMyActiveRequest = async (req, res) => {
  try {
    // Find most recent request that isn't completed
    const request = await AmbulanceRequest.findOne({
      patient: req.user.id,
      status: { $ne: 'Completed' }
    }).sort({ createdAt: -1 });

    if (!request) {
      return res.status(200).json(null);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
