const User = require('../models/User');
const bcrypt = require('bcrypt');

// @desc    Get all users (employees)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isArchived: false }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive a user (deactivate without deleting)
// @route   PUT /api/users/:id/archive
// @access  Private/Admin
const archiveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isArchived = true;
      const updatedUser = await user.save();
      res.json({ message: 'User archived', user: updatedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private/Admin
const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.passwordHash = req.body.password; // pre-save hook will hash it
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, archiveUser, changePassword };
