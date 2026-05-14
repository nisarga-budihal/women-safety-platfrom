const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getDashboard,
  getUsers,
  getVolunteers,
  verifyVolunteer,
  getEmergencies,
  toggleUserStatus
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(auth, roleCheck('admin'));

// @route   GET /api/admin/dashboard
router.get('/dashboard', getDashboard);

// @route   GET /api/admin/users
router.get('/users', getUsers);

// @route   GET /api/admin/volunteers
router.get('/volunteers', getVolunteers);

// @route   PUT /api/admin/volunteer/:id/verify
router.put('/volunteer/:id/verify', verifyVolunteer);

// @route   GET /api/admin/emergencies
router.get('/emergencies', getEmergencies);

// @route   PUT /api/admin/user/:id/toggle
router.put('/user/:id/toggle', toggleUserStatus);

module.exports = router;
