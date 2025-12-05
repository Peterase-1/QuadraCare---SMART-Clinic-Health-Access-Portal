const express = require('express');
const router = express.Router();
const { requestAmbulance } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestAmbulance);

module.exports = router;
