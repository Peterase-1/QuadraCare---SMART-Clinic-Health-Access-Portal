const AmbulanceRequest = require('../models/AmbulanceRequest');
const User = require('../models/User');

// @desc    Get all ambulance requests
// @route   GET /api/emergency/requests
// @access  Private (Emergency)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await AmbulanceRequest.find()
      .populate('patient', 'name email')
      .populate('assignedDoctor', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/emergency/requests/:id/status
// @access  Private (Emergency)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await AmbulanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign doctor to request
// @route   PUT /api/emergency/requests/:id/assign
// @access  Private (Emergency)
exports.assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const request = await AmbulanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.assignedDoctor = doctorId;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get requests assigned to doctor
// @route   GET /api/emergency/my-requests
// @access  Private (Doctor)
exports.getDoctorRequests = async (req, res) => {
  try {
    const requests = await AmbulanceRequest.find({ assignedDoctor: req.user._id })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
