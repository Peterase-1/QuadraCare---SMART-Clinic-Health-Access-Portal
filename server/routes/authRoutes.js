const express = require('express');
console.log('Auth Routes File Loaded');
const router = express.Router();
const { registerUser, loginUser, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', protect, updateUserProfile);
router.get('/test', (req, res) => res.send('Auth Route Working'));

module.exports = router;
