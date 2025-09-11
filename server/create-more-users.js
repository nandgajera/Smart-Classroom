const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const User = require('./src/models/User');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_classroom';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const createAdditionalUsers = async () => {
  try {
    console.log('👥 Creating additional users...');

    // Delete existing problematic users first
    await User.deleteMany({
      email: { 
        $in: [
          'admin@gmail.com', 
          'hod@university.edu',
          'faculty@university.edu'
        ]
      }
    });

    // Create new users with unique employeeIds
    const users = [
      {
        name: 'Main Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin', 
        department: 'Administration',
        employeeId: 'ADM999' // Changed to unique ID
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'hod@university.edu',
        password: 'hod123',
        role: 'hod',
        department: 'Computer Science',
        employeeId: 'HOD999' // Changed to unique ID
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'faculty@university.edu', 
        password: 'faculty123',
        role: 'faculty',
        department: 'Computer Science',
        employeeId: 'FAC999' // Changed to unique ID
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = new User(userData);
        await user.save(); // This will trigger the password hashing
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdUsers.length} additional users!`);
    
    console.log('\n🔑 All Login Credentials:');
    console.log('📧 Admin: admin@university.edu | 🔑 Password: admin123');
    console.log('📧 Admin: admin@gmail.com | 🔑 Password: admin123');  
    console.log('📧 HOD: hod@university.edu | 🔑 Password: hod123');
    console.log('📧 Faculty: faculty@university.edu | 🔑 Password: faculty123');
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    await createAdditionalUsers();
    
    console.log('\n✅ All users are now available!');
    console.log('🌐 You can now login to the application at http://localhost:3000');
    console.log('🔐 Use any of the above credentials to access different role features');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
  }
};

main();
