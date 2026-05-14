const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  triggerSOS,
  updateEmergencyLocation,
  cancelEmergency,
  resolveEmergency,
  getHistory,
  getActiveEmergency,
  getEmergencyById,
  sendChatMessage
} = require('../controllers/emergencyController');

// @route   POST /api/emergency/sos
router.post('/sos', auth, triggerSOS);

// @route   GET /api/emergency/active
router.get('/active', auth, getActiveEmergency);

// @route   GET /api/emergency/history
router.get('/history', auth, getHistory);

// @route   GET /api/emergency/:id
router.get('/:id', auth, getEmergencyById);

// @route   PUT /api/emergency/:id/location
router.put('/:id/location', auth, updateEmergencyLocation);

// @route   PUT /api/emergency/:id/cancel
router.put('/:id/cancel', auth, cancelEmergency);

// @route   PUT /api/emergency/:id/resolve
router.put('/:id/resolve', auth, resolveEmergency);

// @route   POST /api/emergency/:id/chat
router.post('/:id/chat', auth, sendChatMessage);

module.exports = router;
