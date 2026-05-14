const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/women-safety';

    // First try connecting to the configured URI
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.log('⚠️  Could not connect to external MongoDB. Starting in-memory server...');
    }

    // Fallback: use in-memory MongoDB server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ MongoDB In-Memory Server started');
    console.log(`   URI: ${memUri}`);
    console.log('   ⚠️  Data will be lost when server stops');
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
