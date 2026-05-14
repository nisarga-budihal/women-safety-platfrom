const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        // Allow anonymous connections but mark them
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      // Allow connection even without valid token
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} ${socket.user ? `(${socket.user.name})` : '(anonymous)'}`);

    // Join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
      
      // Join role-based room
      if (socket.user.role === 'volunteer') {
        socket.join('volunteers');
        console.log(`   👤 Volunteer joined: ${socket.user.name}`);
      }
      if (socket.user.role === 'admin') {
        socket.join('admin');
        console.log(`   👑 Admin joined: ${socket.user.name}`);
      }
    }

    // Join emergency room
    socket.on('emergency:join', (emergencyId) => {
      socket.join(`emergency:${emergencyId}`);
      console.log(`   📍 Joined emergency room: ${emergencyId}`);
    });

    // Leave emergency room
    socket.on('emergency:leave', (emergencyId) => {
      socket.leave(`emergency:${emergencyId}`);
    });

    // Strict Tracking: Join user-specific room
    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`   📍 Joined direct user room: ${userId}`);
    });

    // Strict Tracking: Broadcast live location
    socket.on('updateLocation', (data) => {
      if (data.userId) {
        io.to(data.userId).emit('volunteerLocationUpdate', data);
      }
    });

    // Legacy Real-time location update
    socket.on('location:update', (data) => {
      if (data.emergencyId) {
        // Broadcast to emergency room
        socket.to(`emergency:${data.emergencyId}`).emit('location:update', {
          emergencyId: data.emergencyId,
          coordinates: data.coordinates,
          userId: socket.user?._id,
          timestamp: new Date()
        });
      }
    });

    // Chat message within emergency
    socket.on('chat:message', (data) => {
      if (data.emergencyId && socket.user) {
        io.to(`emergency:${data.emergencyId}`).emit('chat:message', {
          emergencyId: data.emergencyId,
          sender: {
            _id: socket.user._id,
            name: socket.user.name
          },
          message: data.message,
          timestamp: new Date()
        });
      }
    });

    // Volunteer location update (for tracking available volunteers)
    socket.on('volunteer:location', (data) => {
      if (socket.user && socket.user.role === 'volunteer') {
        // Could store this or broadcast to admin
        io.to('admin').emit('volunteer:location', {
          volunteerId: socket.user._id,
          name: socket.user.name,
          coordinates: data.coordinates,
          timestamp: new Date()
        });
      }
    });

    // Panic button (simulated shake detection)
    socket.on('panic:trigger', (data) => {
      if (socket.user) {
        console.log(`🚨 PANIC triggered by ${socket.user.name}`);
        // This will be handled by the emergency API, but we can also
        // send an immediate notification
        io.to('volunteers').emit('panic:alert', {
          userId: socket.user._id,
          userName: socket.user.name,
          coordinates: data.coordinates,
          timestamp: new Date()
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = socketHandler;
