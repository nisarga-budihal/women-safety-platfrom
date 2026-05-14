const Emergency = require('../models/Emergency');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const SMSService = require('../utils/smsService');

// @desc    Trigger SOS emergency
// @route   POST /api/emergency/sos
// @access  Private (User)
const triggerSOS = async (req, res) => {
  try {
    const { coordinates, description, emergencyType } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid coordinates [lng, lat] required' });
    }

    // Check for existing active emergency
    const activeEmergency = await Emergency.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    if (activeEmergency) {
      return res.status(400).json({
        message: 'You already have an active emergency',
        emergency: activeEmergency
      });
    }

    // Create emergency
    const emergency = await Emergency.create({
      userId: req.user._id,
      userLocation: { lat: coordinates[1], lng: coordinates[0] },
      location: { type: 'Point', coordinates },
      description: description || 'Emergency SOS Alert',
      emergencyType: emergencyType || 'other',
      locationHistory: [{ coordinates, timestamp: new Date() }]
    });

    // Update user location
    await User.findByIdAndUpdate(req.user._id, {
      location: { type: 'Point', coordinates }
    });

    // Find nearby available volunteers (within 10km radius)
    const nearbyVolunteers = await Volunteer.find({
      availability: true,
      'idVerification.status': 'verified',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: 10000 // 10km in meters
        }
      }
    }).populate('userId', 'name phone email');

    // Store notified volunteer IDs
    const notifiedIds = nearbyVolunteers.map(v => v.userId._id);
    emergency.notifiedVolunteers = notifiedIds;
    await emergency.save();

    // Emit SOS via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const alertData = {
        emergencyId: emergency._id,
        userId: req.user._id,
        userName: req.user.name,
        userPhone: req.user.phone,
        location: emergency.location,
        description: emergency.description,
        emergencyType: emergency.emergencyType,
        createdAt: emergency.createdAt
      };

      // Broadcast to all connected volunteers
      io.to('volunteers').emit('sos:alert', alertData);

      // Also notify specific nearby volunteers
      notifiedIds.forEach(id => {
        io.to(`user:${id}`).emit('sos:alert', alertData);
      });
    }

    // Send SMS to emergency contacts
    const user = await User.findById(req.user._id);
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      await SMSService.sendSOS(user.emergencyContacts, user.name, emergency.location);
    }

    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate('userId', 'name phone email');

    res.status(201).json({
      message: 'SOS alert triggered successfully',
      emergency: populatedEmergency,
      nearbyVolunteers: nearbyVolunteers.length
    });
  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({ message: 'Server error triggering SOS' });
  }
};

// @desc    Update live location during emergency
// @route   PUT /api/emergency/:id/location
// @access  Private
const updateEmergencyLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const isUser = emergency.userId.toString() === req.user._id.toString();
    const isVolunteer = (emergency.assignedVolunteer && emergency.assignedVolunteer.toString() === req.user._id.toString()) || 
                        (emergency.volunteerId && emergency.volunteerId.toString() === req.user._id.toString());

    if (!isUser && !isVolunteer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update location
    if (isUser) {
      emergency.location = { type: 'Point', coordinates };
      emergency.userLocation = { lat: coordinates[1], lng: coordinates[0] };
      emergency.locationHistory.push({ coordinates, timestamp: new Date() });
    } else if (isVolunteer) {
      emergency.volunteerLocation = { lat: coordinates[1], lng: coordinates[0] };
    }
    
    await emergency.save();

    // Broadcast updated location
    const io = req.app.get('io');
    if (io) {
      io.to(`emergency:${emergency._id}`).emit('location:update', {
        emergencyId: emergency._id,
        coordinates,
        userId: req.user._id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Location updated', location: emergency.location });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating location' });
  }
};

// @desc    Cancel emergency
// @route   PUT /api/emergency/:id/cancel
// @access  Private
const cancelEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    if (emergency.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['resolved', 'cancelled'].includes(emergency.status)) {
      return res.status(400).json({ message: 'Emergency already ended' });
    }

    emergency.status = 'cancelled';
    emergency.cancelledAt = new Date();
    emergency.cancelReason = req.body.reason || 'Cancelled by user';
    await emergency.save();

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`emergency:${emergency._id}`).emit('emergency:cancelled', {
        emergencyId: emergency._id
      });
      io.to('volunteers').emit('emergency:cancelled', {
        emergencyId: emergency._id
      });
    }

    res.json({ message: 'Emergency cancelled', emergency });
  } catch (error) {
    res.status(500).json({ message: 'Server error cancelling emergency' });
  }
};

// @desc    Resolve emergency
// @route   PUT /api/emergency/:id/resolve
// @access  Private
const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Allow resolution by user, assigned volunteer, or admin
    const isUser = emergency.userId.toString() === req.user._id.toString();
    const isVolunteer = emergency.assignedVolunteer &&
      emergency.assignedVolunteer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isVolunteer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    emergency.status = 'resolved';
    emergency.resolvedAt = new Date();
    if (emergency.createdAt) {
      emergency.responseTime = Math.round(
        (emergency.resolvedAt - emergency.createdAt) / 1000
      );
    }
    await emergency.save();

    // Update volunteer stats
    if (emergency.assignedVolunteer) {
      const volunteer = await Volunteer.findOne({ userId: emergency.assignedVolunteer });
      if (volunteer) {
        volunteer.responseCount += 1;
        const totalTime = volunteer.avgResponseTime * (volunteer.responseCount - 1) + (emergency.responseTime || 0);
        volunteer.avgResponseTime = Math.round(totalTime / volunteer.responseCount);
        await volunteer.save();
      }
    }

    // Send resolved notification to emergency contacts
    const user = await User.findById(emergency.userId);
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      await SMSService.sendResolved(user.emergencyContacts, user.name);
    }

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`emergency:${emergency._id}`).emit('emergency:resolved', {
        emergencyId: emergency._id,
        responseTime: emergency.responseTime
      });
    }

    res.json({ message: 'Emergency resolved', emergency });
  } catch (error) {
    res.status(500).json({ message: 'Server error resolving emergency' });
  }
};

// @desc    Get user's emergency history
// @route   GET /api/emergency/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const emergencies = await Emergency.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedVolunteer', 'name phone');

    const total = await Emergency.countDocuments({ userId: req.user._id });

    res.json({
      emergencies,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// @desc    Get active emergencies for current user
// @route   GET /api/emergency/active
// @access  Private
const getActiveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    })
      .populate('assignedVolunteer', 'name phone email')
      .populate('userId', 'name phone email');

    res.json({ emergency });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get emergency by ID
// @route   GET /api/emergency/:id
// @access  Private
const getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('userId', 'name phone email emergencyContacts')
      .populate('assignedVolunteer', 'name phone email')
      .populate('chatMessages.sender', 'name');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    res.json({ emergency });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send chat message in emergency
// @route   POST /api/emergency/:id/chat
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const chatMsg = {
      sender: req.user._id,
      message,
      timestamp: new Date()
    };

    emergency.chatMessages.push(chatMsg);
    await emergency.save();

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`emergency:${emergency._id}`).emit('chat:message', {
        emergencyId: emergency._id,
        sender: { _id: req.user._id, name: req.user.name },
        message,
        timestamp: chatMsg.timestamp
      });
    }

    res.json({ message: 'Message sent', chatMessage: chatMsg });
  } catch (error) {
    res.status(500).json({ message: 'Server error sending message' });
  }
};

module.exports = {
  triggerSOS,
  updateEmergencyLocation,
  cancelEmergency,
  resolveEmergency,
  getHistory,
  getActiveEmergency,
  getEmergencyById,
  sendChatMessage
};
