const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLabRequests,
  updateRequestStatus
} = require('../controllers/labTechController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is lab tech
const labTechOnly = (req, res, next) => {
  if (req.user && req.user.role === 'lab_tech') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a lab technician' });
  }
};

router.get('/dashboard', protect, labTechOnly, getDashboardStats);
router.get('/requests', protect, labTechOnly, getLabRequests);
router.put('/requests/:id', protect, labTechOnly, updateRequestStatus);

module.exports = router;
