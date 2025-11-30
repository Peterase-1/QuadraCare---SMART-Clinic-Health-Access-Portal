const express = require('express');
console.log('Auth Routes File Loaded');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/test', (req, res) => res.send('Auth Route Working'));

module.exports = router;
