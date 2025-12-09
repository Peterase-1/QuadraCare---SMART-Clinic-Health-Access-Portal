const express = require('express');
const router = express.Router();
const { requestAmbulance, getMyActiveRequest } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestAmbulance);
router.get('/my-request', protect, getMyActiveRequest);

module.exports = router;
