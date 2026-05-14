const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  updateEmergencyContacts,
  updateLocation
} = require('../controllers/authController');

// @route   POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').trim().notEmpty().withMessage('Phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// @route   GET /api/auth/me
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// @route   PUT /api/auth/emergency-contacts
router.put('/emergency-contacts', auth, updateEmergencyContacts);

// @route   PUT /api/auth/location
router.put('/location', auth, updateLocation);

module.exports = router;
