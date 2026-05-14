const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const { generateToken } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role === 'volunteer' ? 'volunteer' : 'user'
    });

    // If registering as volunteer, create volunteer profile
    if (role === 'volunteer') {
      const { documentType, documentNumber, specializations, bio } = req.body;
      await Volunteer.create({
        userId: user._id,
        idVerification: {
          documentType: documentType || 'aadhar',
          documentNumber: documentNumber || 'PENDING',
          status: 'pending'
        },
        specializations: specializations || ['general'],
        bio: bio || ''
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyContacts: user.emergencyContacts,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last seen
    user.lastSeen = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Get volunteer info if applicable
    let volunteerInfo = null;
    if (user.role === 'volunteer') {
      volunteerInfo = await Volunteer.findOne({ userId: user._id });
    }

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyContacts: user.emergencyContacts,
        location: user.location,
        volunteerInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let volunteerInfo = null;
    if (user.role === 'volunteer') {
      volunteerInfo = await Volunteer.findOne({ userId: user._id });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyContacts: user.emergencyContacts,
        location: user.location,
        isActive: user.isActive,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        volunteerInfo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Update emergency contacts
// @route   PUT /api/auth/emergency-contacts
// @access  Private
const updateEmergencyContacts = async (req, res) => {
  try {
    const { emergencyContacts } = req.body;

    if (!Array.isArray(emergencyContacts)) {
      return res.status(400).json({ message: 'Emergency contacts must be an array' });
    }

    // Validate each contact
    for (const contact of emergencyContacts) {
      if (!contact.name || !contact.phone || !contact.relationship) {
        return res.status(400).json({
          message: 'Each contact must have name, phone, and relationship'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { emergencyContacts },
      { new: true }
    );

    res.json({
      message: 'Emergency contacts updated successfully',
      emergencyContacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating contacts' });
  }
};

// @desc    Update user location
// @route   PUT /api/auth/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid coordinates [lng, lat] required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: { type: 'Point', coordinates },
        lastSeen: Date.now()
      },
      { new: true }
    );

    // Also update volunteer location if applicable
    if (user.role === 'volunteer') {
      await Volunteer.findOneAndUpdate(
        { userId: user._id },
        { location: { type: 'Point', coordinates } }
      );
    }

    res.json({ message: 'Location updated', location: user.location });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating location' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateEmergencyContacts,
  updateLocation
};
