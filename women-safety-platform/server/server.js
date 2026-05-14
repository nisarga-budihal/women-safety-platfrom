const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Make io accessible to route handlers
app.set('io', io);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/volunteer', require('./routes/volunteer'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Women Safety & Emergency Assistance Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      emergency: '/api/emergency',
      volunteer: '/api/volunteer',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Socket.IO setup
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Auto-seed demo accounts
const seedDemoAccounts = async () => {
  const User = require('./models/User');
  const Volunteer = require('./models/Volunteer');

  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('   ✓ Demo accounts already exist');
      return;
    }

    // Create admin
    await User.create({
      name: 'System Admin',
      email: 'admin@safeguard.com',
      phone: '+91-9999999999',
      password: 'admin123',
      role: 'admin'
    });

    // Create demo volunteer
    const volUser = await User.create({
      name: 'Demo Volunteer',
      email: 'volunteer@safeguard.com',
      phone: '+91-8888888888',
      password: 'volunteer123',
      role: 'volunteer',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] }
    });

    await Volunteer.create({
      userId: volUser._id,
      idVerification: {
        documentType: 'aadhar',
        documentNumber: 'XXXX-XXXX-1234',
        status: 'verified',
        verifiedAt: new Date()
      },
      availability: true,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      specializations: ['first_aid', 'general'],
      bio: 'Experienced first responder and community volunteer'
    });

    // Create demo user
    await User.create({
      name: 'Demo User',
      email: 'user@safeguard.com',
      phone: '+91-7777777777',
      password: 'user123',
      role: 'user',
      emergencyContacts: [
        { name: 'Family Member', phone: '+91-1234567890', relationship: 'Parent' },
        { name: 'Best Friend', phone: '+91-0987654321', relationship: 'Friend' }
      ],
      location: { type: 'Point', coordinates: [77.5900, 12.9700] }
    });

    console.log('   ✓ Demo accounts seeded (admin/volunteer/user)');
  } catch (err) {
    console.log('   ⚠️  Seed skipped:', err.message);
  }
};

const PORT = process.env.PORT || 5000;

// Start server
const start = async () => {
  await connectDB();
  await seedDemoAccounts();

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   🛡️  Women Safety Platform API Server          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║   🌐 Server:  http://localhost:${PORT}             ║`);
    console.log(`║   📡 Socket:  ws://localhost:${PORT}               ║`);
    console.log('║   📊 Health:  /api/health                       ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║   Demo Accounts:                                ║');
    console.log('║   👩 user@safeguard.com / user123               ║');
    console.log('║   🚑 volunteer@safeguard.com / volunteer123     ║');
    console.log('║   🛡️  admin@safeguard.com / admin123             ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
};

start();

module.exports = { app, server, io };
