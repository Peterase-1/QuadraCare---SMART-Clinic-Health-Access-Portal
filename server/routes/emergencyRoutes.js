const express = require('express');
const router = express.Router();
const { getAllRequests, updateRequestStatus, assignDoctor, getDoctorRequests } = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is emergency staff
const emergencyOnly = (req, res, next) => {
  if (req.user && req.user.role === 'emergency') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as emergency staff' });
  }
};

router.get('/requests', protect, emergencyOnly, getAllRequests);
router.get('/my-requests', protect, getDoctorRequests);
router.put('/requests/:id/status', protect, emergencyOnly, updateRequestStatus);
router.put('/requests/:id/assign', protect, emergencyOnly, assignDoctor);

module.exports = router;
