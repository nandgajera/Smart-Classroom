const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

// MongoDB connection options
const MONGODB_OPTIONS = [
  process.env.MONGODB_URI,
  process.env.MONGO_URI,
  'mongodb://localhost:27017/smart-classroom',
  'mongodb://127.0.0.1:27017/smart-classroom'
].filter(Boolean);

async function connectToMongoDB() {
  for (const uri of MONGODB_OPTIONS) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000 // 3 second timeout
      });
      console.log(`Connected to MongoDB at: ${uri}`);
      return true;
    } catch (error) {
      console.log(`Failed to connect to ${uri}: ${error.message}`);
    }
  }
  return false;
}

async function updateAdminUser() {
  try {
    // Try to connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('\n❌ Could not connect to MongoDB!');
      console.log('\nPlease ensure MongoDB is running:');
      console.log('1. If using local MongoDB, start the mongod service');
      console.log('2. If using MongoDB Atlas, check your connection string');
      console.log('3. If using Docker: docker run -d -p 27017:27017 --name mongodb mongo');
      return;
    }

    // First, delete any existing admin users to avoid conflicts
    await User.deleteMany({ role: 'admin' });
    console.log('Cleared existing admin users');
    
    // Create new admin user (password will be hashed by pre-save hook)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@test.com',
      password: 'admin123', // Plain password - will be hashed automatically
      role: 'admin',
      department: 'Administration',
      employeeId: 'ADMIN001',
      isActive: true
    });

    console.log('Admin user updated successfully:');
    console.log({
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      department: adminUser.department,
      employeeId: adminUser.employeeId
    });

    console.log('\nAdmin Login Credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error updating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

updateAdminUser();
