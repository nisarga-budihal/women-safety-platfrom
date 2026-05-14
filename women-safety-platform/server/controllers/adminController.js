const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Emergency = require('../models/Emergency');

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVolunteers,
      verifiedVolunteers,
      pendingVerifications,
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      cancelledEmergencies
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'volunteer' }),
      Volunteer.countDocuments({ 'idVerification.status': 'verified' }),
      Volunteer.countDocuments({ 'idVerification.status': 'pending' }),
      Emergency.countDocuments(),
      Emergency.countDocuments({ status: { $in: ['pending', 'accepted', 'in_progress'] } }),
      Emergency.countDocuments({ status: 'resolved' }),
      Emergency.countDocuments({ status: 'cancelled' })
    ]);

    // Calculate average response time
    const avgResponseResult = await Emergency.aggregate([
      { $match: { status: 'resolved', responseTime: { $ne: null } } },
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
    ]);
    const avgResponseTime = avgResponseResult.length > 0
      ? Math.round(avgResponseResult[0].avgTime)
      : 0;

    // Get recent emergencies
    const recentEmergencies = await Emergency.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone')
      .populate('assignedVolunteer', 'name');

    // Emergency trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrend = await Emergency.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Emergency type distribution
    const typeDistribution = await Emergency.aggregate([
      { $group: { _id: '$emergencyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Online volunteers
    const onlineVolunteers = await Volunteer.countDocuments({ availability: true });

    res.json({
      stats: {
        totalUsers,
        totalVolunteers,
        verifiedVolunteers,
        pendingVerifications,
        totalEmergencies,
        activeEmergencies,
        resolvedEmergencies,
        cancelledEmergencies,
        avgResponseTime,
        onlineVolunteers
      },
      recentEmergencies,
      dailyTrend,
      typeDistribution
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({ users, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all volunteers
// @route   GET /api/admin/volunteers
// @access  Private (Admin)
const getVolunteers = async (req, res) => {
  try {
    const status = req.query.status || '';
    let query = {};
    if (status) query['idVerification.status'] = status;

    const volunteers = await Volunteer.find(query)
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    res.json({ volunteers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify/reject volunteer
// @route   PUT /api/admin/volunteer/:id/verify
// @access  Private (Admin)
const verifyVolunteer = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }

    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    volunteer.idVerification.status = status;
    if (status === 'verified') {
      volunteer.idVerification.verifiedAt = new Date();
    }
    if (status === 'rejected' && rejectionReason) {
      volunteer.idVerification.rejectionReason = rejectionReason;
    }
    await volunteer.save();

    // Notify volunteer via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${volunteer.userId}`).emit('volunteer:verified', {
        status,
        rejectionReason
      });
    }

    res.json({ message: `Volunteer ${status}`, volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all emergencies
// @route   GET /api/admin/emergencies
// @access  Private (Admin)
const getEmergencies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';

    let query = {};
    if (status) query.status = status;

    const emergencies = await Emergency.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name phone email')
      .populate('assignedVolunteer', 'name phone');

    const total = await Emergency.countDocuments(query);

    res.json({ emergencies, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/user/:id/toggle
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getVolunteers,
  verifyVolunteer,
  getEmergencies,
  toggleUserStatus
};
