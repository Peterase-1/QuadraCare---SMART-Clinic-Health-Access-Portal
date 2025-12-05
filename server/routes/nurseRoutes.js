const express = require('express');
const router = express.Router();
const {
  getAssignedRooms,
  getInpatientRecord,
  addDailyLog,
  administerMedication
} = require('../controllers/nurseController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is nurse
const nurseOnly = (req, res, next) => {
  if (req.user && req.user.role === 'nurse') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a nurse' });
  }
};

router.get('/rooms', protect, nurseOnly, getAssignedRooms);
router.get('/records/:id', protect, nurseOnly, getInpatientRecord);
router.post('/records/:id/log', protect, nurseOnly, addDailyLog);
router.post('/records/:id/medicate', protect, nurseOnly, administerMedication);

module.exports = router;
