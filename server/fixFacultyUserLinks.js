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

const fixFacultyUserLinks = async () => {
  try {
    console.log('🔍 Looking for orphaned Faculty records...');
    
    // Find faculty records without linked users
    const orphanedFaculty = await Faculty.find({
      $or: [
        { user: null },
        { user: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orphanedFaculty.length} orphaned faculty records`);
    
    if (orphanedFaculty.length === 0) {
      console.log('✅ No orphaned faculty records found');
      return;
    }
    
    // Check existing faculty users to link with or create new ones
    const existingFacultyUsers = await User.find({ role: 'faculty' });
    console.log(`Found ${existingFacultyUsers.length} existing faculty users`);
    
    for (let i = 0; i < orphanedFaculty.length; i++) {
      const faculty = orphanedFaculty[i];
      console.log(`\nProcessing Faculty ${i + 1}:`);
      console.log(`  ID: ${faculty._id}`);
      console.log(`  Departments: ${faculty.departments?.join(', ')}`);
      console.log(`  Designation: ${faculty.professionalInfo?.designation}`);
      
      // Try to find an unlinked faculty user from the same department
      const potentialUser = existingFacultyUsers.find(user => {
        // Check if this user is already linked to a faculty record
        return !orphanedFaculty.find(f => f.user?.toString() === user._id.toString()) &&
               faculty.departments?.includes(user.department);
      });
      
      if (potentialUser && i < existingFacultyUsers.length) {
        // Link with existing user
        console.log(`  ✅ Linking with existing user: ${potentialUser.name} (${potentialUser.email})`);
        await Faculty.findByIdAndUpdate(faculty._id, {
          user: potentialUser._id
        });
        
        // Remove this user from the list so it won't be used again
        const userIndex = existingFacultyUsers.findIndex(u => u._id.toString() === potentialUser._id.toString());
        if (userIndex > -1) {
          existingFacultyUsers.splice(userIndex, 1);
        }
        
      } else {
        // Create a new user for this faculty
        const department = faculty.departments?.[0] || 'Computer Science';
        const designation = faculty.professionalInfo?.designation || 'Assistant Professor';
        
        const newUser = await User.create({
          name: `${designation} ${i + 1}`,
          email: `faculty${Date.now()}_${i}@${department.toLowerCase().replace(/\s+/g, '')}.edu`,
          password: 'faculty123',
          role: 'faculty',
          department: department,
          employeeId: `FAC${String(100 + i).padStart(3, '0')}`
        });
        
        console.log(`  ✅ Created new user: ${newUser.name} (${newUser.email})`);
        
        // Link faculty with the new user
        await Faculty.findByIdAndUpdate(faculty._id, {
          user: newUser._id
        });
        
        console.log(`  ✅ Linked faculty with new user`);
      }
    }
    
    console.log('\n✅ All faculty records have been processed');
    
  } catch (error) {
    console.error('❌ Error fixing faculty user links:', error.message);
  }
};

const verifyLinks = async () => {
  try {
    console.log('\n🔍 Verifying Faculty-User links...');
    
    const allFaculty = await Faculty.find({}).populate('user');
    
    console.log(`\nTotal Faculty records: ${allFaculty.length}`);
    
    let linkedCount = 0;
    let orphanedCount = 0;
    
    for (const faculty of allFaculty) {
      if (faculty.user) {
        linkedCount++;
        console.log(`✅ ${faculty.user.name} (${faculty.user.email}) - ${faculty.user.role}`);
      } else {
        orphanedCount++;
        console.log(`❌ Orphaned faculty: ${faculty._id}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Linked: ${linkedCount}`);
    console.log(`  Orphaned: ${orphanedCount}`);
    
  } catch (error) {
    console.error('❌ Error verifying links:', error.message);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (connected) {
    await fixFacultyUserLinks();
    await verifyLinks();
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
  }
};

main().catch(console.error);
