/**
 * Seed Script — Creates default admin account and demo data
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Volunteer = require('./models/Volunteer');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/women-safety');
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('⚠️  Admin account already exists:', adminExists.email);
    } else {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@safeguard.com',
        phone: '+91-9999999999',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin account created');
      console.log('   Email: admin@safeguard.com');
      console.log('   Password: admin123');
    }

    // Create demo volunteer if not exists
    const demoVolunteerUser = await User.findOne({ email: 'volunteer@safeguard.com' });
    if (!demoVolunteerUser) {
      const volUser = await User.create({
        name: 'Demo Volunteer',
        email: 'volunteer@safeguard.com',
        phone: '+91-8888888888',
        password: 'volunteer123',
        role: 'volunteer',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore coordinates
        }
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
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        },
        specializations: ['first_aid', 'general'],
        bio: 'Experienced first responder and community volunteer'
      });

      console.log('✅ Demo volunteer created');
      console.log('   Email: volunteer@safeguard.com');
      console.log('   Password: volunteer123');
    } else {
      console.log('⚠️  Demo volunteer already exists');
    }

    // Create demo user if not exists
    const demoUser = await User.findOne({ email: 'user@safeguard.com' });
    if (!demoUser) {
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
        location: {
          type: 'Point',
          coordinates: [77.5900, 12.9700]
        }
      });
      console.log('✅ Demo user created');
      console.log('   Email: user@safeguard.com');
      console.log('   Password: user123');
    } else {
      console.log('⚠️  Demo user already exists');
    }

    console.log('\n🎉 Seeding complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
