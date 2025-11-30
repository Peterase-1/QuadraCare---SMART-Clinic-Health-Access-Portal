const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPrescriptions,
  updatePrescriptionStatus
} = require('../controllers/pharmacistController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is pharmacist
const pharmacistOnly = (req, res, next) => {
  if (req.user && req.user.role === 'pharmacist') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a pharmacist' });
  }
};

router.get('/dashboard', protect, pharmacistOnly, getDashboardStats);
router.get('/prescriptions', protect, pharmacistOnly, getPrescriptions);
router.put('/prescriptions/:id', protect, pharmacistOnly, updatePrescriptionStatus);

module.exports = router;
