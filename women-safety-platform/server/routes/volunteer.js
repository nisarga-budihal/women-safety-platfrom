const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  registerVolunteer,
  toggleAvailability,
  acceptEmergency,
  declineEmergency,
  getNearbyAlerts,
  getMyResponses,
  getVolunteerProfile,
  updateVolunteerLocation
} = require('../controllers/volunteerController');

// @route   POST /api/volunteer/register
router.post('/register', auth, registerVolunteer);

// @route   GET /api/volunteer/profile
router.get('/profile', auth, roleCheck('volunteer'), getVolunteerProfile);

// @route   PUT /api/volunteer/availability
router.put('/availability', auth, roleCheck('volunteer'), toggleAvailability);

// @route   PUT /api/volunteer/location
router.put('/location', auth, roleCheck('volunteer'), updateVolunteerLocation);

// @route   GET /api/volunteer/alerts
router.get('/alerts', auth, roleCheck('volunteer'), getNearbyAlerts);

// @route   GET /api/volunteer/my-responses
router.get('/my-responses', auth, roleCheck('volunteer'), getMyResponses);

// @route   PUT /api/volunteer/:emergencyId/accept
router.put('/:emergencyId/accept', auth, roleCheck('volunteer'), acceptEmergency);

// @route   PUT /api/volunteer/:emergencyId/decline
router.put('/:emergencyId/decline', auth, roleCheck('volunteer'), declineEmergency);

module.exports = router;
