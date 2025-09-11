const mongoose = require('mongoose');
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const API_BASE_URL = 'http://localhost:5000/api';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/smartclassroom';
    console.log('🔌 Connecting to MongoDB...');
    console.log('Using URI:', mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@')); // Hide credentials
    
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

const testUserLogins = async () => {
  try {
    console.log('👥 Checking all users in database...\n');
    const users = await User.find({}).select('+password');
    
    console.log(`Found ${users.length} users:`);
    
    const credentials = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`${i + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      
      // Test common passwords for this user
      const testPasswords = ['admin123', 'password123', 'faculty123', 'hod123'];
      let correctPassword = null;
      
      for (const testPassword of testPasswords) {
        const isMatch = await user.comparePassword(testPassword);
        if (isMatch) {
          correctPassword = testPassword;
          break;
        }
      }
      
      if (correctPassword) {
        console.log(`   ✅ Password: ${correctPassword}`);
        credentials.push({
          name: user.name,
          email: user.email,
          password: correctPassword,
          role: user.role,
          department: user.department,
          employeeId: user.employeeId
        });
      } else {
        console.log(`   ❌ Password: Could not determine`);
      }
      console.log('');
    }
    
    // Now test API login for each credential
    console.log('\n🔐 Testing API login for each user...\n');
    
    for (const cred of credentials) {
      console.log(`Testing login for ${cred.name} (${cred.role})...`);
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: cred.email,
          password: cred.password
        });
        
        if (response.data.success) {
          console.log(`   ✅ Login successful`);
          console.log(`   Token: ${response.data.token.substring(0, 15)}...`);
          console.log(`   User ID: ${response.data.user.id}`);
          console.log(`   Role: ${response.data.user.role}`);
        } else {
          console.log(`   ❌ Login failed: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Login failed: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }
    
    return credentials;
    
  } catch (error) {
    console.error('❌ Error testing users:', error.message);
    return [];
  }
};

const checkFacultyRecords = async () => {
  try {
    console.log('📋 Checking Faculty records...\n');
    const facultyRecords = await Faculty.find({}).populate('user');
    
    console.log(`Found ${facultyRecords.length} faculty records:`);
    
    for (let i = 0; i < facultyRecords.length; i++) {
      const faculty = facultyRecords[i];
      console.log(`${i + 1}. Faculty ID: ${faculty._id}`);
      console.log(`   User: ${faculty.user?.name || 'No user linked'}`);
      console.log(`   Email: ${faculty.user?.email || 'No email'}`);
      console.log(`   Role: ${faculty.user?.role || 'No role'}`);
      console.log(`   Departments: ${faculty.departments?.join(', ') || 'None'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error checking faculty records:', error.message);
  }
};

const main = async () => {
  console.log('🚀 Starting comprehensive user login test...\n');
  
  const connected = await connectDB();
  if (connected) {
    const credentials = await testUserLogins();
    await checkFacultyRecords();
    
    // Print summary of all valid credentials
    console.log('\n📝 SUMMARY - Valid Login Credentials:\n');
    console.log('=' .repeat(60));
    
    const groupedByRole = credentials.reduce((acc, cred) => {
      if (!acc[cred.role]) acc[cred.role] = [];
      acc[cred.role].push(cred);
      return acc;
    }, {});
    
    Object.keys(groupedByRole).forEach(role => {
      console.log(`\n${role.toUpperCase()} USERS:`);
      groupedByRole[role].forEach(cred => {
        console.log(`  📧 Email: ${cred.email}`);
        console.log(`  🔑 Password: ${cred.password}`);
        console.log(`  👤 Name: ${cred.name}`);
        console.log(`  🏢 Department: ${cred.department || 'N/A'}`);
        console.log(`  🆔 Employee ID: ${cred.employeeId || 'N/A'}`);
        console.log('  ' + '-'.repeat(40));
      });
    });
    
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
  }
};

main().catch(console.error);
