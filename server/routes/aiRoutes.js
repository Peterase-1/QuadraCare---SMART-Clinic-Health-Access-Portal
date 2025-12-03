const express = require('express');
const router = express.Router();
const { generateDiagnosis } = require('../controllers/aiController');
const { protect, doctorOnly } = require('../middleware/authMiddleware');

router.post('/generate', protect, doctorOnly, generateDiagnosis);

module.exports = router;
