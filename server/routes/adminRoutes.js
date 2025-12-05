const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  createUser,
  deleteUser,
  getAllWards,
  createWard,
  updateWard,
  deleteWard,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  assignNurseToRoom
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

router.get('/wards', protect, adminOnly, getAllWards);
router.post('/wards', protect, adminOnly, createWard);
router.put('/wards/:id', protect, adminOnly, updateWard);
router.delete('/wards/:id', protect, adminOnly, deleteWard);

router.get('/rooms', protect, adminOnly, getAllRooms);
router.post('/rooms', protect, adminOnly, createRoom);
router.put('/rooms/:id', protect, adminOnly, updateRoom);
router.delete('/rooms/:id', protect, adminOnly, deleteRoom);
router.put('/rooms/:id/assign', protect, adminOnly, assignNurseToRoom);

module.exports = router;
