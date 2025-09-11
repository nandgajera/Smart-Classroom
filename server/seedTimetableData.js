const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

// Import models
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const Subject = require('./src/models/Subject');
const Classroom = require('./src/models/Classroom');
const Batch = require('./src/models/Batch');
const Course = require('./src/models/Course');
const School = require('./src/models/School');

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

const clearExistingData = async () => {
  console.log('🗑️ Clearing existing timetable-related data...');
  
  // Only clear what we're going to recreate
  await Subject.deleteMany({});
  await Classroom.deleteMany({});
  await Batch.deleteMany({});
  
  console.log('✅ Existing data cleared');
};

const seedSubjects = async () => {
  console.log('📚 Seeding subjects...');
  
  const subjects = [
    // CSE Engineering - Semester 3
    {
      code: 'CS301',
      name: 'Data Structures and Algorithms',
      department: 'CSE',
      credits: 4,
      type: 'theory',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 4,
      sessionDuration: 60,
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 60,
        facilities: ['projector', 'whiteboard']
      },
      facultyRequirements: {
        specialization: ['Data Structures', 'Algorithms', 'Programming']
      },
      academicYear: '2024-25',
      isActive: true
    },
    {
      code: 'CS302',
      name: 'Database Management Systems',
      department: 'CSE',
      credits: 4,
      type: 'theory',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 60,
        facilities: ['projector', 'whiteboard']
      },
      facultyRequirements: {
        specialization: ['Database Systems', 'SQL']
      },
      academicYear: '2024-25',
      isActive: true
    },
    {
      code: 'CS303',
      name: 'Database Lab',
      department: 'CSE',
      credits: 2,
      type: 'lab',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 2,
      sessionDuration: 120,
      classroomRequirements: {
        type: 'computer_lab',
        minCapacity: 30,
        facilities: ['computer', 'internet', 'projector']
      },
      facultyRequirements: {
        specialization: ['Database Systems', 'SQL']
      },
      academicYear: '2024-25',
      isActive: true
    },
    {
      code: 'CS304',
      name: 'Object Oriented Programming',
      department: 'CSE',
      credits: 3,
      type: 'theory',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 60,
        facilities: ['projector', 'whiteboard']
      },
      facultyRequirements: {
        specialization: ['Programming', 'Java', 'OOP']
      },
      academicYear: '2024-25',
      isActive: true
    },
    {
      code: 'CS305',
      name: 'OOP Lab',
      department: 'CSE',
      credits: 2,
      type: 'lab',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 2,
      sessionDuration: 120,
      classroomRequirements: {
        type: 'computer_lab',
        minCapacity: 30,
        facilities: ['computer', 'internet', 'projector']
      },
      facultyRequirements: {
        specialization: ['Programming', 'Java', 'OOP']
      },
      academicYear: '2024-25',
      isActive: true
    },
    {
      code: 'MA301',
      name: 'Discrete Mathematics',
      department: 'CSE',
      credits: 3,
      type: 'theory',
      semester: 3,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      classroomRequirements: {
        type: 'lecture_hall',
        minCapacity: 60,
        facilities: ['whiteboard']
      },
      facultyRequirements: {
        specialization: ['Mathematics', 'Discrete Math']
      },
      academicYear: '2024-25',
      isActive: true
    }
  ];
  
  const createdSubjects = await Subject.insertMany(subjects);
  console.log(`✅ Created ${createdSubjects.length} subjects`);
  return createdSubjects;
};

const seedClassrooms = async () => {
  console.log('🏢 Seeding classrooms...');
  
  const classrooms = [
    // Lecture Halls
    {
      roomNumber: 'LH-101',
      building: 'Academic Block A',
      floor: 1,
      capacity: 80,
      type: 'lecture_hall',
      department: 'CSE',
      facilities: ['projector', 'whiteboard', 'audio_system', 'air_conditioning'],
      isActive: true
    },
    {
      roomNumber: 'LH-102',
      building: 'Academic Block A',
      floor: 1,
      capacity: 70,
      type: 'lecture_hall',
      department: 'CSE',
      facilities: ['projector', 'whiteboard', 'audio_system'],
      isActive: true
    },
    {
      roomNumber: 'LH-201',
      building: 'Academic Block A',
      floor: 2,
      capacity: 90,
      type: 'lecture_hall',
      department: 'CSE',
      facilities: ['projector', 'whiteboard', 'audio_system', 'air_conditioning'],
      isActive: true
    },
    {
      roomNumber: 'LH-202',
      building: 'Academic Block A',
      floor: 2,
      capacity: 75,
      type: 'lecture_hall',
      department: 'CSE',
      facilities: ['projector', 'whiteboard', 'audio_system'],
      isActive: true
    },
    
    // Computer Labs
    {
      roomNumber: 'CL-101',
      building: 'Lab Block B',
      floor: 1,
      capacity: 30,
      type: 'computer_lab',
      department: 'CSE',
      facilities: ['computer', 'internet', 'projector', 'whiteboard', 'air_conditioning'],
      isActive: true
    },
    {
      roomNumber: 'CL-102',
      building: 'Lab Block B',
      floor: 1,
      capacity: 35,
      type: 'computer_lab',
      department: 'CSE',
      facilities: ['computer', 'internet', 'projector', 'whiteboard', 'air_conditioning'],
      isActive: true
    },
    {
      roomNumber: 'CL-201',
      building: 'Lab Block B',
      floor: 2,
      capacity: 40,
      type: 'computer_lab',
      department: 'CSE',
      facilities: ['computer', 'internet', 'projector', 'whiteboard', 'air_conditioning'],
      isActive: true
    },
    
    // Tutorial Rooms
    {
      roomNumber: 'TR-101',
      building: 'Academic Block A',
      floor: 1,
      capacity: 40,
      type: 'tutorial_room',
      department: 'CSE',
      facilities: ['whiteboard', 'projector'],
      isActive: true
    },
    {
      roomNumber: 'TR-102',
      building: 'Academic Block A',
      floor: 1,
      capacity: 35,
      type: 'tutorial_room',
      department: 'CSE',
      facilities: ['whiteboard', 'projector'],
      isActive: true
    }
  ];
  
  const createdClassrooms = await Classroom.insertMany(classrooms);
  console.log(`✅ Created ${createdClassrooms.length} classrooms`);
  return createdClassrooms;
};

const seedBatches = async (subjects) => {
  console.log('👥 Seeding batches...');
  
  // Get existing faculty to assign to subjects
  const faculty = await Faculty.find({ 
    $or: [
      { departments: 'CSE' },
      { departments: { $in: ['CSE'] } }
    ]
  }).limit(4);
  
  console.log(`Found ${faculty.length} faculty members for assignment`);
  faculty.forEach(f => {
    console.log(`  Faculty available: ${f._id} (${f.departments})`);
  });
  
  const batches = [
    {
      name: 'CSE 3rd Semester Section A',
      code: 'CSE-3-A',
      department: 'CSE',
      program: 'UG',
      semester: 3,
      section: 'A',
      enrolledStudents: 65,
      maxCapacity: 70,
      academicYear: '2024-25',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2025-05-15'),
      shift: 'morning',
      subjects: [
        {
          subject: subjects.find(s => s.code === 'CS301')._id,
          faculty: faculty[0]?._id,
          isElective: false,
          enrolledCount: 65
        },
        {
          subject: subjects.find(s => s.code === 'CS302')._id,
          faculty: faculty[1]?._id,
          isElective: false,
          enrolledCount: 65
        },
        {
          subject: subjects.find(s => s.code === 'CS303')._id,
          faculty: faculty[1]?._id,
          isElective: false,
          enrolledCount: 65
        },
        {
          subject: subjects.find(s => s.code === 'CS304')._id,
          faculty: faculty[2]?._id,
          isElective: false,
          enrolledCount: 65
        },
        {
          subject: subjects.find(s => s.code === 'CS305')._id,
          faculty: faculty[2]?._id,
          isElective: false,
          enrolledCount: 65
        },
        {
          subject: subjects.find(s => s.code === 'MA301')._id,
          faculty: faculty[3]?._id,
          isElective: false,
          enrolledCount: 65
        }
      ],
      constraints: {
        maxClassesPerDay: 6,
        blockedTimeSlots: [
          {
            day: 'friday',
            startTime: '14:00',
            endTime: '17:00',
            reason: 'Sports and Cultural Activities'
          }
        ]
      },
      isActive: true
    },
    {
      name: 'CSE 3rd Semester Section B',
      code: 'CSE-3-B',
      department: 'CSE',
      program: 'UG',
      semester: 3,
      section: 'B',
      enrolledStudents: 58,
      maxCapacity: 70,
      academicYear: '2024-25',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2025-05-15'),
      shift: 'morning',
      subjects: [
        {
          subject: subjects.find(s => s.code === 'CS301')._id,
          faculty: faculty[0]?._id,
          isElective: false,
          enrolledCount: 58
        },
        {
          subject: subjects.find(s => s.code === 'CS302')._id,
          faculty: faculty[1]?._id,
          isElective: false,
          enrolledCount: 58
        },
        {
          subject: subjects.find(s => s.code === 'CS303')._id,
          faculty: faculty[1]?._id,
          isElective: false,
          enrolledCount: 58
        },
        {
          subject: subjects.find(s => s.code === 'CS304')._id,
          faculty: faculty[2]?._id,
          isElective: false,
          enrolledCount: 58
        },
        {
          subject: subjects.find(s => s.code === 'CS305')._id,
          faculty: faculty[2]?._id,
          isElective: false,
          enrolledCount: 58
        },
        {
          subject: subjects.find(s => s.code === 'MA301')._id,
          faculty: faculty[3]?._id,
          isElective: false,
          enrolledCount: 58
        }
      ],
      constraints: {
        maxClassesPerDay: 6,
        blockedTimeSlots: []
      },
      isActive: true
    }
  ];
  
  const createdBatches = await Batch.insertMany(batches);
  console.log(`✅ Created ${createdBatches.length} batches`);
  return createdBatches;
};

const seedTimetableData = async () => {
  console.log('🌱 Starting timetable data seeding...\n');
  
  const connected = await connectDB();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  try {
    await clearExistingData();
    
    const subjects = await seedSubjects();
    const classrooms = await seedClassrooms();
    const batches = await seedBatches(subjects);
    
    console.log('\n✅ Timetable data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Classrooms: ${classrooms.length}`);
    console.log(`   Batches: ${batches.length}`);
    
    console.log('\n🎯 Ready to test timetable generation!');
    console.log('   Use the following parameters:');
    console.log('   - Department: CSE');
    console.log('   - Academic Year: 2024-25');
    console.log('   - Semester: 3');
    
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Seeding interrupted');
  try {
    await mongoose.connection.close();
  } catch (error) {
    // Ignore close errors during interruption
  }
  process.exit(0);
});

// Run the seeding
seedTimetableData();
