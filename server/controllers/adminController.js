const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Ward = require('../models/Ward');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const doctors = await User.countDocuments({ role: 'doctor' });
    const patients = await User.countDocuments({ role: 'patient' });

    res.json({
      totalUsers,
      totalAppointments,
      doctors,
      patients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new user (Doctor, Staff, etc.)
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password, // Password hashing is handled in User model pre-save hook
      role
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all wards
// @route   GET /api/admin/wards
// @access  Private (Admin)
exports.getAllWards = async (req, res) => {
  try {
    const wards = await Ward.find();
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new ward
// @route   POST /api/admin/wards
// @access  Private (Admin)
exports.createWard = async (req, res) => {
  const { name, type, capacity, description, gender } = req.body;
  try {
    const ward = await Ward.create({ name, type, capacity, description, gender });
    res.status(201).json(ward);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a ward
// @route   DELETE /api/admin/wards/:id
// @access  Private (Admin)
exports.deleteWard = async (req, res) => {
  try {
    await Ward.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ward removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all rooms
// @route   GET /api/admin/rooms
// @access  Private (Admin)
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('ward', 'name').populate('assignedNurses', 'name email');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new room
// @route   POST /api/admin/rooms
// @access  Private (Admin)
exports.createRoom = async (req, res) => {
  const { roomNumber, ward, type, capacity, features } = req.body;
  try {
    const room = await Room.create({ roomNumber, ward, type, capacity, features });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/admin/rooms/:id
// @access  Private (Admin)
exports.deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a ward
// @route   PUT /api/admin/wards/:id
// @access  Private (Admin)
exports.updateWard = async (req, res) => {
  const { name, type, capacity, description, status } = req.body;
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return res.status(404).json({ message: 'Ward not found' });

    ward.name = name || ward.name;
    ward.type = type || ward.type;
    ward.capacity = capacity || ward.capacity;
    ward.description = description || ward.description;

    // Optional: Add status field to schema later if needed

    const updatedWard = await ward.save();
    res.json(updatedWard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/admin/rooms/:id
// @access  Private (Admin)
exports.updateRoom = async (req, res) => {
  const { roomNumber, ward, type, capacity, currentOccupancy, status, assignedNurses } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.roomNumber = roomNumber || room.roomNumber;
    room.ward = ward || room.ward;
    room.type = type || room.type;
    room.capacity = capacity || room.capacity;
    // room.currentOccupancy = currentOccupancy !== undefined ? currentOccupancy : room.currentOccupancy;
    room.status = status || room.status;

    if (req.body.assignedNurses) {
      room.assignedNurses = req.body.assignedNurses;
    }

    const updatedRoom = await room.save();
    const populatedRoom = await Room.findById(updatedRoom._id).populate('ward', 'name').populate('assignedNurses', 'name email');
    res.json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign nurses to a room
// @route   PUT /api/admin/rooms/:id/assign
// @access  Private (Admin)
exports.assignNurseToRoom = async (req, res) => {
  const { nurseIds } = req.body; // Expect an array of User IDs
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Verify all IDs are nurses
    // This check is optional but good practice

    room.assignedNurses = nurseIds;
    await room.save();

    const updatedRoom = await Room.findById(req.params.id).populate('ward', 'name').populate('assignedNurses', 'name email');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
