const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

async function checkAdminUser() {
  try {
    const connected = await connectDB();
    if (!connected) return;

    console.log('\n🔍 Checking admin users in database...');
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('+password');
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`\n--- Admin User ${index + 1} ---`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Department: ${user.department}`);
      console.log(`Employee ID: ${user.employeeId}`);
      console.log(`Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Updated: ${user.updatedAt}`);
    });

    // Test password comparison for admin@test.com
    console.log('\n🔐 Testing password for admin@test.com...');
    const testUser = await User.findOne({ email: 'admin@test.com' }).select('+password');
    
    if (testUser) {
      console.log('User found in database ✅');
      const isMatch = await testUser.comparePassword('admin123');
      console.log(`Password match for 'admin123': ${isMatch ? '✅ YES' : '❌ NO'}`);
      
      // Also test the raw bcrypt comparison
      const directMatch = await bcrypt.compare('admin123', testUser.password);
      console.log(`Direct bcrypt comparison: ${directMatch ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ User admin@test.com not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

checkAdminUser();
