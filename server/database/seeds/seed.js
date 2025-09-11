const mongoose = require('mongoose');
const path = require('path');

// Clear any existing env and load fresh
delete process.env.MONGO_URI;
require('dotenv').config({ path: '.env' });

// Import models
const User = require('../../src/models/User');
const Faculty = require('../../src/models/Faculty');
const Classroom = require('../../src/models/Classroom');
const Subject = require('../../src/models/Subject');
const Batch = require('../../src/models/Batch');

const connectDB = async () => {
  try {
    console.log('Using MONGO_URI:', process.env.MONGO_URI?.substring(0, 50) + '...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  console.log('🌱 Seeding users...');

  const users = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      department: 'CSE',
      employeeId: 'ADMIN001',
      isActive: true
    },
    {
      name: 'HOD Computer Science',
      email: 'hod@cse.com',
      password: 'hod123',
      role: 'hod',
      department: 'CSE',
      employeeId: 'HOD001',
      isActive: true
    },
    {
      name: 'Dr. John Smith',
      email: 'faculty1@cse.com',
      password: 'faculty123',
      role: 'faculty',
      department: 'CSE',
      employeeId: 'FAC001',
      isActive: true
    },
    {
      name: 'Prof. Sarah Johnson',
      email: 'faculty2@cse.com',
      password: 'faculty123',
      role: 'faculty',
      department: 'CSE',
      employeeId: 'FAC002',
      isActive: true
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      await User.create(userData);
      console.log(`✓ Created user: ${userData.name} (${userData.email})`);
    } else {
      console.log(`- User already exists: ${userData.email}`);
    }
  }
};

const seedClassrooms = async () => {
  console.log('🌱 Seeding classrooms...');

  const classrooms = [
    {
      roomNumber: 'CS101',
      building: 'Computer Science Block',
      floor: 1,
      capacity: 60,
      type: 'lecture_hall',
      facilities: ['projector', 'whiteboard', 'air_conditioning', 'internet'],
      department: 'CSE',
      isActive: true
    },
    {
      roomNumber: 'CS201',
      building: 'Computer Science Block',
      floor: 2,
      capacity: 40,
      type: 'computer_lab',
      facilities: ['computer', 'projector', 'air_conditioning', 'internet'],
      department: 'CSE',
      isActive: true
    },
    {
      roomNumber: 'CS301',
      building: 'Computer Science Block',
      floor: 3,
      capacity: 30,
      type: 'tutorial_room',
      facilities: ['whiteboard', 'projector', 'air_conditioning'],
      department: 'CSE',
      isActive: true
    }
  ];

  for (const classroomData of classrooms) {
    const existing = await Classroom.findOne({ roomNumber: classroomData.roomNumber });
    if (!existing) {
      await Classroom.create(classroomData);
      console.log(`✓ Created classroom: ${classroomData.roomNumber}`);
    } else {
      console.log(`- Classroom already exists: ${classroomData.roomNumber}`);
    }
  }
};

const seedSubjects = async () => {
  console.log('🌱 Seeding subjects...');

  const subjects = [
    {
      code: 'CSE101',
      name: 'Programming Fundamentals',
      department: 'CSE',
      credits: 4,
      type: 'theory',
      semester: 1,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      academicYear: '2024-2025',
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 50,
        facilities: ['projector', 'whiteboard']
      },
      isActive: true
    },
    {
      code: 'CSE102',
      name: 'Programming Lab',
      department: 'CSE',
      credits: 2,
      type: 'lab',
      semester: 1,
      program: 'UG',
      sessionsPerWeek: 1,
      sessionDuration: 120,
      academicYear: '2024-2025',
      classroomRequirements: {
        type: 'computer_lab',
        minCapacity: 30,
        facilities: ['computer', 'projector']
      },
      isActive: true
    }
  ];

  for (const subjectData of subjects) {
    const existing = await Subject.findOne({ code: subjectData.code });
    if (!existing) {
      await Subject.create(subjectData);
      console.log(`✓ Created subject: ${subjectData.code} - ${subjectData.name}`);
    } else {
      console.log(`- Subject already exists: ${subjectData.code}`);
    }
  }
};

const runSeed = async () => {
  try {
    await connectDB();

    console.log('🚀 Starting database seeding...\n');

    await seedUsers();
    await seedClassrooms();
    await seedSubjects();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('Admin: admin@test.com / admin123');
    console.log('HOD: hod@cse.com / hod123');
    console.log('Faculty: faculty1@cse.com / faculty123');
    console.log('Faculty: faculty2@cse.com / faculty123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
