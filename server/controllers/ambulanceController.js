const AmbulanceRequest = require('../models/AmbulanceRequest');

// @desc    Request an ambulance
// @route   POST /api/ambulance/request
// @access  Private (Patient)
exports.requestAmbulance = async (req, res) => {
  try {
    const { location, urgency } = req.body;

    const newRequest = new AmbulanceRequest({
      patient: req.user.id,
      location,
      urgency
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
