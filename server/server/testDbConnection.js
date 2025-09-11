const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/smartclassroom';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const checkUsers = async () => {
  try {
    console.log('👥 Checking users in database...');
    const users = await User.find({}).select('+password');
    
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password hash starts with: ${user.password.substring(0, 10)}...`);
      console.log('');
    });
    
    // Test both admin users
    console.log('🔍 Testing admin@gmail.com with password admin123...');
    const adminUser1 = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    if (adminUser1) {
      const isMatch1 = await adminUser1.comparePassword('admin123');
      console.log(`   Password match test: ${isMatch1 ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    console.log('🔍 Testing admin123@test.com with password admin123...');
    const adminUser2 = await User.findOne({ email: 'admin123@test.com' }).select('+password');
    if (adminUser2) {
      const isMatch2 = await adminUser2.comparePassword('admin123');
      console.log(`   Password match test: ${isMatch2 ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (connected) {
    await checkUsers();
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
  }
};

main().catch(console.error);
