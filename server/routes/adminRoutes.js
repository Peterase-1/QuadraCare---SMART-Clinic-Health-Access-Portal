const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  createUser,
  deleteUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

router.get('/dashboard', protect, adminOnly, getAdminDashboard);
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
