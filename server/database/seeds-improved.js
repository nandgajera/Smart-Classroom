const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const School = require('../src/models/School');
const Course = require('../src/models/Course');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Subject = require('../src/models/Subject');
const Classroom = require('../src/models/Classroom');
const Batch = require('../src/models/Batch');

// Configure mongoose to be more patient
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/smartclassroom';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Socket timeout
      bufferCommands: false
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const clearCollections = async () => {
  console.log('🗑️ Clearing existing collections...');
  
  try {
    // Clear collections one by one with timeout
    const collections = [User, School, Course, Student, Faculty, Subject, Classroom, Batch];
    const collectionNames = ['Users', 'Schools', 'Courses', 'Students', 'Faculty', 'Subjects', 'Classrooms', 'Batches'];
    
    for (let i = 0; i < collections.length; i++) {
      try {
        console.log(`   Clearing ${collectionNames[i]}...`);
        await collections[i].deleteMany({}).maxTimeMS(10000);
        console.log(`   ✅ ${collectionNames[i]} cleared`);
      } catch (error) {
        console.log(`   ⚠️ ${collectionNames[i]} might be empty or error:`, error.message);
      }
    }
    
    console.log('✅ Collections cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing collections:', error.message);
    throw error;
  }
};

const createBasicData = async () => {
  console.log('👥 Creating basic user data...');
  
  try {
    // const adminPassword = await bcrypt.hash('admin123', 12);
    // const defaultPassword = await bcrypt.hash('password123', 12);
    
    // Create fewer users initially
    const users = await User.create([
      {
        name: 'Administrator',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM001'
      },
      
      {
        name: 'System Administrator',
        email: 'admin123@test.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM002'
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'hod.engineering@university.edu',
        password: 'password123',
        role: 'hod',
        department: 'Computer Science',
        employeeId: 'HOD001'
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        password: 'password123',
        role: 'faculty',
        department: 'Computer Science',
        employeeId: 'FAC001'
      }
    ]);
    
    console.log('✅ Created users:', users.length);
    
    // Create schools
    console.log('🏫 Creating schools...');
    const schools = await School.create([
      {
        name: 'School of Engineering & Technology',
        code: 'SOE',
        description: 'Leading school for engineering and technology education',
        dean: {
          name: 'Dr. Priya Sharma',
          email: 'hod.engineering@university.edu',
          phone: '+91 9876543210'
        },
        establishedYear: 2010,
        departments: [
          { name: 'Computer Science & Engineering', code: 'CSE', head: 'Dr. Priya Sharma' }
        ]
      },
      {
        name: 'School of Management & Business Studies',
        code: 'SOM',
        description: 'Premier institution for management and business education',
        establishedYear: 2012,
        departments: [
          { name: 'Business Administration', code: 'BA', head: 'Prof. Amit Patel' }
        ]
      }
    ]);
    
    console.log('✅ Created schools:', schools.length);
    
    // Create basic subjects
    console.log('📚 Creating subjects...');
    const subjects = await Subject.create([
      { 
        name: 'Programming Fundamentals', 
        code: 'CSE101', 
        credits: 4, 
        type: 'theory', 
        department: 'Computer Science',
        semester: 1,
        program: 'UG',
        sessionsPerWeek: 4,
        sessionDuration: 60,
        academicYear: '2024-25'
      },
      { 
        name: 'Mathematics I', 
        code: 'MAT101', 
        credits: 4, 
        type: 'theory', 
        department: 'Mathematics',
        semester: 1,
        program: 'UG',
        sessionsPerWeek: 4,
        sessionDuration: 60,
        academicYear: '2024-25'
      },
      { 
        name: 'Principles of Management', 
        code: 'MGT101', 
        credits: 3, 
        type: 'theory', 
        department: 'Management',
        semester: 1,
        program: 'PG',
        sessionsPerWeek: 3,
        sessionDuration: 60,
        academicYear: '2024-25'
      }
    ]);
    
    console.log('✅ Created subjects:', subjects.length);
    
    // Create courses
    console.log('📖 Creating courses...');
    const courses = await Course.create([
      {
        name: 'Bachelor of Technology in Computer Science Engineering',
        code: 'B.TECH-CSE',
        school: schools[0]._id,
        description: 'Comprehensive program covering software development and emerging technologies',
        duration: { years: 4, semesters: 8 },
        degreeType: 'Bachelor',
        level: 'UG',
        department: 'Computer Science & Engineering',
        fees: {
          tuitionFee: 150000,
          admissionFee: 25000,
          developmentFee: 15000,
          otherFees: 10000
        },
        intake: { totalSeats: 60 }
      },
      {
        name: 'Master of Business Administration',
        code: 'MBA',
        school: schools[1]._id,
        description: 'Comprehensive management program',
        duration: { years: 2, semesters: 4 },
        degreeType: 'Master',
        level: 'PG',
        department: 'Business Administration',
        fees: {
          tuitionFee: 250000,
          admissionFee: 30000,
          developmentFee: 20000,
          otherFees: 15000
        },
        intake: { totalSeats: 40 }
      }
    ]);
    
    console.log('✅ Created courses:', courses.length);
    
    return { users, schools, courses, subjects };
    
  } catch (error) {
    console.error('❌ Error creating basic data:', error.message);
    throw error;
  }
};

const createStudentData = async (schools, courses) => {
  console.log('👨‍🎓 Creating student data...');
  
  try {
    const studentData = [];
    
    // Create 10 CSE students
    for (let i = 1; i <= 10; i++) {
      const rollNo = `CSE2024${String(i).padStart(3, '0')}`;
      const feeAmount = courses.find(c => c.code === 'B.TECH-CSE').fees.totalFee;
      const isPaid = Math.random() > 0.3;
      
      studentData.push({
        rollNo,
        name: `CSE Student ${i}`,
        email: `${rollNo.toLowerCase()}@university.edu`,
        phone: `+91 98765${String(43000 + i).slice(-5)}`,
        dateOfBirth: new Date(2003, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.6 ? 'Female' : 'Male',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
        category: ['General', 'OBC', 'SC', 'ST'][Math.floor(Math.random() * 4)],
        
        father: {
          name: `Father of Student ${i}`,
          occupation: 'Engineer'
        },
        mother: {
          name: `Mother of Student ${i}`,
          occupation: 'Teacher'
        },
        
        school: schools[0]._id,
        course: courses[0]._id,
        currentSemester: 1,
        admissionDate: new Date('2024-07-15'),
        academicYear: '2024-25',
        
        academicRecord: {
          cgpa: 6.0 + (Math.random() * 3.5)
        },
        
        attendance: {
          overall: Math.floor(75 + (Math.random() * 25))
        },
        
        fees: {
          totalFee: feeAmount,
          paidAmount: isPaid ? feeAmount : 0,
          status: isPaid ? 'Paid' : 'Pending'
        },
        
        documents: {
          status: Math.random() > 0.2 ? 'Complete' : 'Incomplete'
        }
      });
    }
    
    // Create 8 MBA students
    for (let i = 1; i <= 8; i++) {
      const rollNo = `MBA2024${String(i).padStart(3, '0')}`;
      const feeAmount = courses.find(c => c.code === 'MBA').fees.totalFee;
      const isPaid = Math.random() > 0.2;
      
      studentData.push({
        rollNo,
        name: `MBA Student ${i}`,
        email: `${rollNo.toLowerCase()}@university.edu`,
        phone: `+91 98765${String(80000 + i).slice(-5)}`,
        dateOfBirth: new Date(1998 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.5 ? 'Female' : 'Male',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
        category: ['General', 'OBC'][Math.floor(Math.random() * 2)],
        
        father: {
          name: `MBA Father ${i}`,
          occupation: 'Business Owner'
        },
        mother: {
          name: `MBA Mother ${i}`,
          occupation: 'Professional'
        },
        
        school: schools[1]._id,
        course: courses[1]._id,
        currentSemester: 1,
        admissionDate: new Date('2024-07-15'),
        academicYear: '2024-25',
        
        academicRecord: {
          cgpa: 7.0 + (Math.random() * 2.5)
        },
        
        attendance: {
          overall: Math.floor(80 + (Math.random() * 20))
        },
        
        fees: {
          totalFee: feeAmount,
          paidAmount: isPaid ? feeAmount : Math.floor(feeAmount * 0.5),
          status: isPaid ? 'Paid' : 'Pending'
        },
        
        documents: {
          status: Math.random() > 0.1 ? 'Complete' : 'Incomplete'
        }
      });
    }
    
    // Create students in smaller batches
    console.log('   Creating students in batches...');
    const batchSize = 5;
    const students = [];
    
    for (let i = 0; i < studentData.length; i += batchSize) {
      const batch = studentData.slice(i, i + batchSize);
      console.log(`   Creating batch ${Math.floor(i/batchSize) + 1}...`);
      const createdStudents = await Student.create(batch);
      students.push(...createdStudents);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Created students:', students.length);
    return students;
    
  } catch (error) {
    console.error('❌ Error creating student data:', error.message);
    throw error;
  }
};

const seedData = async () => {
  console.log('🌱 Starting improved database seeding...');
  
  let connected = false;
  
  try {
    // Connect to database
    connected = await connectDB();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Clear existing data
    await clearCollections();
    
    // Create basic data
    const { users, schools, courses, subjects } = await createBasicData();
    
    // Create student data
    const students = await createStudentData(schools, courses);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Schools: ${schools.length}`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Students: ${students.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@university.edu / password123');
    console.log('   HOD: hod.engineering@university.edu / password123');
    console.log('   Faculty: sarah.johnson@university.edu / password123');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    if (connected) {
      try {
        await mongoose.connection.close();
        console.log('\n📤 Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError.message);
      }
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

// Run the improved seed function
seedData();
