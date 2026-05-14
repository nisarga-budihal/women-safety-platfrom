const Volunteer = require('../models/Volunteer');
const Emergency = require('../models/Emergency');
const User = require('../models/User');

// @desc    Register as volunteer (create volunteer profile)
// @route   POST /api/volunteer/register
// @access  Private
const registerVolunteer = async (req, res) => {
  try {
    const existing = await Volunteer.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Volunteer profile already exists' });
    }

    const { documentType, documentNumber, specializations, bio } = req.body;

    const volunteer = await Volunteer.create({
      userId: req.user._id,
      idVerification: {
        documentType: documentType || 'aadhar',
        documentNumber: documentNumber || 'PENDING'
      },
      specializations: specializations || ['general'],
      bio: bio || ''
    });

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'volunteer' });

    res.status(201).json({ message: 'Volunteer registration submitted', volunteer });
  } catch (error) {
    console.error('Volunteer register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle availability
// @route   PUT /api/volunteer/availability
// @access  Private (Volunteer)
const toggleAvailability = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer profile not found' });
    }

    volunteer.availability = !volunteer.availability;
    await volunteer.save();

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('volunteer:statusChange', {
        volunteerId: volunteer._id,
        userId: req.user._id,
        availability: volunteer.availability
      });
    }

    res.json({
      message: `Availability set to ${volunteer.availability ? 'online' : 'offline'}`,
      availability: volunteer.availability
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept emergency request
// @route   PUT /api/volunteer/:emergencyId/accept
// @access  Private (Volunteer)
const acceptEmergency = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const emergency = await Emergency.findById(req.params.emergencyId);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    if (emergency.status !== 'pending') {
      return res.status(400).json({ message: 'Emergency already accepted or resolved' });
    }

    emergency.status = 'accepted';
    emergency.assignedVolunteer = req.user._id;
    emergency.volunteerId = req.user._id;

    if (coordinates && coordinates.length === 2) {
      emergency.volunteerLocation = { lat: coordinates[1], lng: coordinates[0] };
    }

    await emergency.save();

    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate('userId', 'name phone email emergencyContacts location')
      .populate('assignedVolunteer', 'name phone email');

    // Notify user via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${emergency.userId}`).emit('sos:accepted', {
        emergencyId: emergency._id,
        volunteer: {
          _id: req.user._id,
          name: req.user.name,
          phone: req.user.phone
        }
      });

      // Notify other volunteers that this emergency is taken
      io.to('volunteers').emit('emergency:taken', {
        emergencyId: emergency._id
      });
    }

    res.json({
      message: 'Emergency accepted',
      emergency: populatedEmergency
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error accepting emergency' });
  }
};

// @desc    Decline emergency request
// @route   PUT /api/volunteer/:emergencyId/decline
// @access  Private (Volunteer)
const declineEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.emergencyId);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Simply remove this volunteer from notified list
    emergency.notifiedVolunteers = emergency.notifiedVolunteers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await emergency.save();

    res.json({ message: 'Emergency declined' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get nearby active emergencies for volunteer
// @route   GET /api/volunteer/alerts
// @access  Private (Volunteer)
const getNearbyAlerts = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });

    let query = { status: 'pending' };

    // If volunteer has location, find nearby emergencies
    if (volunteer && volunteer.location && volunteer.location.coordinates[0] !== 0) {
      query.location = {
        $near: {
          $geometry: volunteer.location,
          $maxDistance: 15000 // 15km
        }
      };
    }

    const emergencies = await Emergency.find(query)
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ emergencies });
  } catch (error) {
    // If geo query fails (no 2dsphere index or no location), fallback to all pending
    const emergencies = await Emergency.find({ status: 'pending' })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ emergencies });
  }
};

// @desc    Get volunteer's accepted emergencies
// @route   GET /api/volunteer/my-responses
// @access  Private (Volunteer)
const getMyResponses = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      assignedVolunteer: req.user._id
    })
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get volunteer profile/stats
// @route   GET /api/volunteer/profile
// @access  Private (Volunteer)
const getVolunteerProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer profile not found' });
    }

    res.json({ volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update volunteer location
// @route   PUT /api/volunteer/location
// @access  Private (Volunteer)
const updateVolunteerLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;

    await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      { location: { type: 'Point', coordinates } }
    );

    await User.findByIdAndUpdate(req.user._id, {
      location: { type: 'Point', coordinates },
      lastSeen: Date.now()
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerVolunteer,
  toggleAvailability,
  acceptEmergency,
  declineEmergency,
  getNearbyAlerts,
  getMyResponses,
  getVolunteerProfile,
  updateVolunteerLocation
};
