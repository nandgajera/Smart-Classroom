const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config({ path: './server/.env' });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const fixHODPassword = async () => {
  try {
    console.log('🔍 Looking for HOD user...');
    
    const hodUser = await User.findOne({ role: 'hod' }).select('+password');
    
    if (!hodUser) {
      console.log('❌ HOD user not found');
      return;
    }
    
    console.log(`Found HOD: ${hodUser.name} (${hodUser.email})`);
    
    // Test various possible passwords
    const possiblePasswords = [
      'hod123',
      'password123', 
      'admin123',
      'faculty123',
      'hod@123',
      'hod',
      '123456',
      'cse123'
    ];
    
    let foundPassword = null;
    
    console.log('🔐 Testing possible passwords...');
    for (const password of possiblePasswords) {
      const isMatch = await hodUser.comparePassword(password);
      if (isMatch) {
        foundPassword = password;
        console.log(`✅ Found correct password: ${password}`);
        break;
      }
    }
    
    if (!foundPassword) {
      console.log('❌ Could not find correct password. Setting new password...');
      
      // Set a new password
      const newPassword = 'hod123';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await User.findByIdAndUpdate(hodUser._id, {
        password: hashedPassword
      });
      
      console.log(`✅ HOD password has been reset to: ${newPassword}`);
      return newPassword;
    }
    
    return foundPassword;
    
  } catch (error) {
    console.error('❌ Error fixing HOD password:', error.message);
    return null;
  }
};

const main = async () => {
  const connected = await connectDB();
  if (connected) {
    await fixHODPassword();
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
  }
};

main().catch(console.error);
