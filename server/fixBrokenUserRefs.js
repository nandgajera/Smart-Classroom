const mongoose = require('mongoose');
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
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

const checkBrokenReferences = async () => {
  try {
    console.log('🔍 Checking Faculty-User references...');
    
    const facultyRecords = await Faculty.find({}).lean();
    const allUsers = await User.find({}).lean();
    
    console.log(`Found ${facultyRecords.length} faculty records`);
    console.log(`Found ${allUsers.length} users`);
    
    const userIdMap = {};
    allUsers.forEach(user => {
      userIdMap[user._id.toString()] = user;
    });
    
    const brokenReferences = [];
    const validReferences = [];
    
    for (const faculty of facultyRecords) {
      const userIdStr = faculty.user.toString();
      if (userIdMap[userIdStr]) {
        validReferences.push({ faculty, user: userIdMap[userIdStr] });
        console.log(`✅ Valid: Faculty ${faculty._id} -> User ${faculty.user} (${userIdMap[userIdStr].name})`);
      } else {
        brokenReferences.push(faculty);
        console.log(`❌ Broken: Faculty ${faculty._id} -> User ${faculty.user} (NOT FOUND)`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Valid references: ${validReferences.length}`);
    console.log(`  Broken references: ${brokenReferences.length}`);
    
    // Fix broken references by linking with existing faculty users
    if (brokenReferences.length > 0) {
      console.log('\n🔧 Fixing broken references...');
      
      const availableFacultyUsers = allUsers.filter(user => user.role === 'faculty');
      const linkedUserIds = validReferences.map(ref => ref.user._id.toString());
      const unlinkedFacultyUsers = availableFacultyUsers.filter(user => 
        !linkedUserIds.includes(user._id.toString())
      );
      
      console.log(`Available unlinked faculty users: ${unlinkedFacultyUsers.length}`);
      
      for (let i = 0; i < brokenReferences.length; i++) {
        const faculty = brokenReferences[i];
        
        if (i < unlinkedFacultyUsers.length) {
          // Link with existing unlinked faculty user
          const user = unlinkedFacultyUsers[i];
          
          console.log(`  Linking Faculty ${faculty._id} with existing User ${user._id} (${user.name})`);
          
          await Faculty.findByIdAndUpdate(faculty._id, {
            user: user._id
          });
          
        } else {
          // Create new user for this faculty
          const department = faculty.departments?.[0] || 'Computer Science';
          const designation = faculty.professionalInfo?.designation || 'Assistant Professor';
          
          const newUser = await User.create({
            name: `${designation} ${i + 1}`,
            email: `newfaculty${i + 1}@${department.toLowerCase().replace(/\s+/g, '')}.edu`,
            password: 'faculty123',
            role: 'faculty',
            department: department,
            employeeId: `NEWFAC${String(200 + i).padStart(3, '0')}`
          });
          
          console.log(`  Created new User ${newUser._id} (${newUser.name}) for Faculty ${faculty._id}`);
          
          await Faculty.findByIdAndUpdate(faculty._id, {
            user: newUser._id
          });
        }
      }
      
      console.log('✅ All broken references have been fixed');
    }
    
  } catch (error) {
    console.error('❌ Error checking references:', error.message);
  }
};

const verifyFixes = async () => {
  try {
    console.log('\n🔍 Verifying fixes...');
    
    const facultyRecords = await Faculty.find({}).populate('user');
    
    console.log(`\nTotal Faculty records: ${facultyRecords.length}`);
    
    let linkedCount = 0;
    let brokenCount = 0;
    
    for (const faculty of facultyRecords) {
      if (faculty.user) {
        linkedCount++;
        console.log(`✅ ${faculty.user.name} (${faculty.user.email}) - ${faculty.user.role}`);
      } else {
        brokenCount++;
        console.log(`❌ Broken faculty: ${faculty._id}`);
      }
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`  Successfully linked: ${linkedCount}`);
    console.log(`  Still broken: ${brokenCount}`);
    
  } catch (error) {
    console.error('❌ Error verifying fixes:', error.message);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (connected) {
    await checkBrokenReferences();
    await verifyFixes();
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
  }
};

main().catch(console.error);
