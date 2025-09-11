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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartclassroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await School.deleteMany({});
    await Course.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Classroom.deleteMany({});
    await Batch.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await User.create([
      // Admin Users
      {
        name: 'Dr. Rajesh Kumar',
        email: 'admin@university.edu',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM001'
      },
      
      // HOD Users
      {
        name: 'Dr. Priya Sharma',
        email: 'hod.engineering@university.edu',
        password: hashedPassword,
        role: 'hod',
        department: 'Computer Science',
        employeeId: 'HOD001'
      },
      {
        name: 'Prof. Amit Patel',
        email: 'hod.management@university.edu',
        password: hashedPassword,
        role: 'hod',
        department: 'Business Administration',
        employeeId: 'HOD002'
      },
      
      // Faculty Users
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'Computer Science',
        employeeId: 'FAC001'
      },
      {
        name: 'Prof. Michael Chen',
        email: 'michael.chen@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'Mathematics',
        employeeId: 'FAC002'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'Physics',
        employeeId: 'FAC003'
      },
      {
        name: 'Prof. James Wilson',
        email: 'james.wilson@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'Chemistry',
        employeeId: 'FAC004'
      },
      {
        name: 'Dr. Lisa Brown',
        email: 'lisa.brown@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'English',
        employeeId: 'FAC005'
      }
    ]);

    console.log('👥 Created users');

    // Create Schools
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
        address: {
          building: 'Engineering Block A',
          campus: 'Main Campus',
          city: 'Gandhinagar',
          state: 'Gujarat',
          pincode: '382007'
        },
        contact: {
          phone: '+91 79 23201234',
          email: 'soe@university.edu',
          website: 'https://soe.university.edu'
        },
        departments: [
          { name: 'Computer Science & Engineering', code: 'CSE', head: 'Dr. Priya Sharma' },
          { name: 'Mechanical Engineering', code: 'ME', head: 'Prof. Rajesh Gupta' },
          { name: 'Electrical Engineering', code: 'EE', head: 'Dr. Suresh Patel' },
          { name: 'Civil Engineering', code: 'CE', head: 'Prof. Neeta Shah' }
        ]
      },
      {
        name: 'School of Management & Business Studies',
        code: 'SOM',
        description: 'Premier institution for management and business education',
        dean: {
          name: 'Prof. Amit Patel',
          email: 'hod.management@university.edu',
          phone: '+91 9876543211'
        },
        establishedYear: 2012,
        address: {
          building: 'Management Block',
          campus: 'Main Campus',
          city: 'Gandhinagar',
          state: 'Gujarat',
          pincode: '382007'
        },
        contact: {
          phone: '+91 79 23201235',
          email: 'som@university.edu',
          website: 'https://som.university.edu'
        },
        departments: [
          { name: 'Business Administration', code: 'BA', head: 'Prof. Amit Patel' },
          { name: 'Finance & Accounting', code: 'FA', head: 'Dr. Kavita Joshi' },
          { name: 'Marketing', code: 'MKT', head: 'Prof. Rohit Kumar' }
        ]
      },
      {
        name: 'School of Science & Mathematics',
        code: 'SSM',
        description: 'Excellence in pure and applied sciences',
        dean: {
          name: 'Dr. Vikram Singh',
          email: 'dean.science@university.edu',
          phone: '+91 9876543212'
        },
        establishedYear: 2008,
        address: {
          building: 'Science Block',
          campus: 'Main Campus',
          city: 'Gandhinagar',
          state: 'Gujarat',
          pincode: '382007'
        },
        contact: {
          phone: '+91 79 23201236',
          email: 'ssm@university.edu',
          website: 'https://ssm.university.edu'
        },
        departments: [
          { name: 'Physics', code: 'PHY', head: 'Dr. Emily Rodriguez' },
          { name: 'Chemistry', code: 'CHE', head: 'Prof. James Wilson' },
          { name: 'Mathematics', code: 'MAT', head: 'Prof. Michael Chen' }
        ]
      }
    ]);

    console.log('🏫 Created schools');

    // Create Courses
    const courses = await Course.create([
      // Engineering Courses
      {
        name: 'Bachelor of Technology in Computer Science Engineering',
        code: 'B.TECH-CSE',
        school: schools[0]._id,
        description: 'Comprehensive program covering software development, algorithms, data structures, and emerging technologies',
        duration: { years: 4, semesters: 8 },
        degreeType: 'Bachelor',
        level: 'UG',
        department: 'Computer Science & Engineering',
        eligibilityCriteria: {
          minimumMarks: 75,
          requiredQualification: '12th with PCM',
          ageLimit: { minimum: 17, maximum: 22 },
          additionalRequirements: ['JEE Main qualified', 'English proficiency']
        },
        fees: {
          tuitionFee: 150000,
          admissionFee: 25000,
          developmentFee: 15000,
          otherFees: 10000
        },
        intake: {
          totalSeats: 120,
          reservedSeats: { sc: 15, st: 7, obc: 32, ews: 12, pwd: 6 }
        },
        coordinator: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@university.edu',
          phone: '+91 9876543213',
          designation: 'Assistant Professor'
        }
      },
      {
        name: 'Bachelor of Technology in Mechanical Engineering',
        code: 'B.TECH-ME',
        school: schools[0]._id,
        description: 'Focus on mechanical systems, manufacturing, thermodynamics, and design',
        duration: { years: 4, semesters: 8 },
        degreeType: 'Bachelor',
        level: 'UG',
        department: 'Mechanical Engineering',
        eligibilityCriteria: {
          minimumMarks: 70,
          requiredQualification: '12th with PCM',
          ageLimit: { minimum: 17, maximum: 22 }
        },
        fees: {
          tuitionFee: 140000,
          admissionFee: 25000,
          developmentFee: 15000,
          otherFees: 10000
        },
        intake: {
          totalSeats: 100,
          reservedSeats: { sc: 12, st: 6, obc: 27, ews: 10, pwd: 5 }
        }
      },
      
      // Management Courses
      {
        name: 'Master of Business Administration',
        code: 'MBA',
        school: schools[1]._id,
        description: 'Comprehensive management program with specialization options',
        duration: { years: 2, semesters: 4 },
        degreeType: 'Master',
        level: 'PG',
        department: 'Business Administration',
        eligibilityCriteria: {
          minimumMarks: 60,
          requiredQualification: 'Bachelor degree in any discipline',
          ageLimit: { minimum: 21, maximum: 28 },
          additionalRequirements: ['CAT/MAT/XAT score', 'Work experience preferred']
        },
        fees: {
          tuitionFee: 250000,
          admissionFee: 30000,
          developmentFee: 20000,
          otherFees: 15000
        },
        intake: {
          totalSeats: 60,
          reservedSeats: { sc: 8, st: 4, obc: 16, ews: 6, pwd: 3 }
        },
        coordinator: {
          name: 'Prof. Amit Patel',
          email: 'amit.patel@university.edu',
          phone: '+91 9876543214',
          designation: 'Professor & HOD'
        }
      },
      
      // Science Courses
      {
        name: 'Bachelor of Science in Physics',
        code: 'B.SC-PHY',
        school: schools[2]._id,
        description: 'Fundamental and applied physics with research opportunities',
        duration: { years: 3, semesters: 6 },
        degreeType: 'Bachelor',
        level: 'UG',
        department: 'Physics',
        eligibilityCriteria: {
          minimumMarks: 65,
          requiredQualification: '12th with PCM',
          ageLimit: { minimum: 17, maximum: 22 }
        },
        fees: {
          tuitionFee: 80000,
          admissionFee: 15000,
          developmentFee: 10000,
          otherFees: 5000
        },
        intake: {
          totalSeats: 40,
          reservedSeats: { sc: 5, st: 3, obc: 11, ews: 4, pwd: 2 }
        }
      },
      {
        name: 'Master of Science in Computer Science',
        code: 'M.SC-CS',
        school: schools[2]._id,
        description: 'Advanced computer science with research focus',
        duration: { years: 2, semesters: 4 },
        degreeType: 'Master',
        level: 'PG',
        department: 'Computer Science',
        eligibilityCriteria: {
          minimumMarks: 60,
          requiredQualification: 'Bachelor in Computer Science/IT/Mathematics',
          ageLimit: { minimum: 20, maximum: 25 }
        },
        fees: {
          tuitionFee: 120000,
          admissionFee: 20000,
          developmentFee: 12000,
          otherFees: 8000
        },
        intake: {
          totalSeats: 30,
          reservedSeats: { sc: 4, st: 2, obc: 8, ews: 3, pwd: 1 }
        }
      }
    ]);

    console.log('📚 Created courses');

    // Create Subjects
    const subjects = await Subject.create([
      // CSE Subjects
      { name: 'Programming Fundamentals', code: 'CSE101', credits: 4, type: 'core', department: 'Computer Science' },
      { name: 'Data Structures', code: 'CSE201', credits: 4, type: 'core', department: 'Computer Science' },
      { name: 'Database Management Systems', code: 'CSE301', credits: 4, type: 'core', department: 'Computer Science' },
      { name: 'Web Development', code: 'CSE302', credits: 3, type: 'elective', department: 'Computer Science' },
      { name: 'Machine Learning', code: 'CSE401', credits: 4, type: 'elective', department: 'Computer Science' },
      
      // Common Subjects
      { name: 'Mathematics I', code: 'MAT101', credits: 4, type: 'core', department: 'Mathematics' },
      { name: 'Physics I', code: 'PHY101', credits: 4, type: 'core', department: 'Physics' },
      { name: 'English Communication', code: 'ENG101', credits: 2, type: 'core', department: 'English' },
      
      // MBA Subjects
      { name: 'Principles of Management', code: 'MGT101', credits: 3, type: 'core', department: 'Management' },
      { name: 'Financial Management', code: 'FIN201', credits: 3, type: 'core', department: 'Finance' },
      { name: 'Marketing Management', code: 'MKT201', credits: 3, type: 'core', department: 'Marketing' },
      { name: 'Operations Management', code: 'OPR301', credits: 3, type: 'core', department: 'Operations' }
    ]);

    console.log('📖 Created subjects');

    // Create Classrooms
    const classrooms = await Classroom.create([
      { name: 'Room A-101', code: 'A101', building: 'Engineering Block A', floor: 1, capacity: 60, type: 'lecture', equipment: ['Projector', 'Whiteboard', 'Sound System'] },
      { name: 'Room A-102', code: 'A102', building: 'Engineering Block A', floor: 1, capacity: 50, type: 'lecture', equipment: ['Projector', 'Whiteboard'] },
      { name: 'Lab CSE-1', code: 'CSE1', building: 'Engineering Block A', floor: 2, capacity: 30, type: 'lab', equipment: ['Computers', 'Projector', 'Software'] },
      { name: 'Lab CSE-2', code: 'CSE2', building: 'Engineering Block A', floor: 2, capacity: 30, type: 'lab', equipment: ['Computers', 'Projector', 'Software'] },
      { name: 'Seminar Hall', code: 'SH01', building: 'Management Block', floor: 0, capacity: 100, type: 'seminar', equipment: ['Projector', 'Sound System', 'Stage'] },
      { name: 'Room M-201', code: 'M201', building: 'Management Block', floor: 2, capacity: 40, type: 'lecture', equipment: ['Projector', 'Whiteboard'] }
    ]);

    console.log('🏛️ Created classrooms');

    // Create Faculty profiles
    const facultyUsers = users.filter(user => user.role === 'faculty' || user.role === 'hod');
    const facultyProfiles = await Faculty.create(
      facultyUsers.map(user => ({
        user: user._id,
        specialization: user.department === 'Computer Science' ? ['Programming', 'Database Systems', 'Web Development'] :
                       user.department === 'Mathematics' ? ['Calculus', 'Statistics', 'Discrete Mathematics'] :
                       user.department === 'Physics' ? ['Quantum Physics', 'Thermodynamics'] :
                       user.department === 'Chemistry' ? ['Organic Chemistry', 'Physical Chemistry'] :
                       user.department === 'English' ? ['Literature', 'Communication Skills'] :
                       ['Management', 'Leadership'],
        designation: user.role === 'hod' ? 'Professor' : Math.random() > 0.5 ? 'Assistant Professor' : 'Associate Professor',
        maxClassesPerDay: 6,
        weeklyLoadLimit: 18,
        availability: [
          { day: 'monday', startTime: '09:00', endTime: '17:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'thursday', startTime: '09:00', endTime: '17:00' },
          { day: 'friday', startTime: '09:00', endTime: '17:00' }
        ],
        departments: [user.department],
        tags: user.role === 'hod' ? ['hod', 'senior_faculty'] : ['faculty']
      }))
    );

    console.log('👨‍🏫 Created faculty profiles');

    // Create Batches
    const batches = await Batch.create([
      {
        name: 'B.Tech CSE 2024 Batch',
        code: 'BTCSE24A',
        department: 'Computer Science',
        program: 'UG',
        semester: 1,
        section: 'A',
        enrolledStudents: 45,
        maxCapacity: 50,
        academicYear: '2024-25',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2028-05-31'),
        subjects: [
          { subject: subjects.find(s => s.code === 'CSE101')._id, faculty: facultyProfiles.find(f => f.departments.includes('Computer Science'))._id },
          { subject: subjects.find(s => s.code === 'MAT101')._id, faculty: facultyProfiles.find(f => f.departments.includes('Mathematics'))._id },
          { subject: subjects.find(s => s.code === 'PHY101')._id, faculty: facultyProfiles.find(f => f.departments.includes('Physics'))._id },
          { subject: subjects.find(s => s.code === 'ENG101')._id, faculty: facultyProfiles.find(f => f.departments.includes('English'))._id }
        ]
      },
      {
        name: 'MBA 2024 Batch',
        code: 'MBA24A',
        department: 'Business Administration',
        program: 'PG',
        semester: 1,
        section: 'A',
        enrolledStudents: 35,
        maxCapacity: 40,
        academicYear: '2024-25',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2026-05-31'),
        subjects: [
          { subject: subjects.find(s => s.code === 'MGT101')._id },
          { subject: subjects.find(s => s.code === 'FIN201')._id },
          { subject: subjects.find(s => s.code === 'MKT201')._id }
        ]
      }
    ]);

    console.log('🎓 Created batches');

    // Generate comprehensive student data
    const studentData = [];
    
    // CSE Students (Semester 1)
    for (let i = 1; i <= 25; i++) {
      const rollNo = `CSE2024${String(i).padStart(3, '0')}`;
      const feeAmount = courses.find(c => c.code === 'B.TECH-CSE').fees.totalFee;
      const isPaid = Math.random() > 0.3; // 70% chance of payment
      
      studentData.push({
        rollNo,
        name: `Student ${rollNo}`,
        email: `${rollNo.toLowerCase()}@university.edu`,
        phone: `+91 98765${String(43000 + i).slice(-5)}`,
        dateOfBirth: new Date(2005, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.6 ? 'Female' : 'Male',
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        category: ['General', 'OBC', 'SC', 'ST', 'EWS'][Math.floor(Math.random() * 5)],
        
        address: {
          permanent: {
            street: `${100 + i} Sample Street`,
            city: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'][Math.floor(Math.random() * 4)],
            state: 'Gujarat',
            pincode: `3${String(80000 + i).slice(-5)}`,
            country: 'India'
          }
        },
        
        father: {
          name: `Father of Student ${i}`,
          occupation: ['Engineer', 'Teacher', 'Business', 'Doctor'][Math.floor(Math.random() * 4)],
          phone: `+91 98765${String(50000 + i).slice(-5)}`,
          annualIncome: 500000 + (i * 10000)
        },
        
        mother: {
          name: `Mother of Student ${i}`,
          occupation: ['Homemaker', 'Teacher', 'Nurse', 'Software Engineer'][Math.floor(Math.random() * 4)],
          phone: `+91 98765${String(60000 + i).slice(-5)}`
        },
        
        school: schools[0]._id,
        course: courses[0]._id,
        batch: batches[0]._id,
        currentSemester: 1,
        admissionDate: new Date('2024-07-15'),
        academicYear: '2024-25',
        section: 'A',
        
        academicRecord: {
          cgpa: 6.0 + (Math.random() * 3.5), // Random CGPA between 6.0 and 9.5
          sgpa: [
            { semester: 1, gpa: 6.0 + (Math.random() * 3.5), credits: 20, year: '2024-25' }
          ]
        },
        
        attendance: {
          overall: Math.floor(75 + (Math.random() * 25)), // Random attendance between 75-100%
          subjects: subjects.slice(0, 4).map(subject => ({
            subject: subject._id,
            totalClasses: 45 + Math.floor(Math.random() * 15),
            attendedClasses: Math.floor(35 + (Math.random() * 20)),
            percentage: Math.floor(75 + (Math.random() * 25))
          }))
        },
        
        fees: {
          totalFee: feeAmount,
          paidAmount: isPaid ? feeAmount : Math.floor(feeAmount * Math.random()),
          status: isPaid ? 'Paid' : (Math.random() > 0.5 ? 'Pending' : 'Overdue'),
          dueDate: new Date('2024-12-31'),
          paymentHistory: isPaid ? [{
            amount: feeAmount,
            paymentDate: new Date('2024-07-20'),
            paymentMethod: 'Online Banking',
            transactionId: `TXN${rollNo}${Date.now()}`,
            receiptNo: `RCP${rollNo}`
          }] : []
        },
        
        documents: {
          status: Math.random() > 0.2 ? 'Complete' : 'Incomplete',
          submitted: [
            { documentType: '10th Marksheet', fileName: `10th_${rollNo}.pdf`, uploadDate: new Date('2024-07-10'), verified: true },
            { documentType: '12th Marksheet', fileName: `12th_${rollNo}.pdf`, uploadDate: new Date('2024-07-10'), verified: true },
            { documentType: 'Passport Photo', fileName: `photo_${rollNo}.jpg`, uploadDate: new Date('2024-07-10'), verified: true }
          ],
          required: [
            { documentType: '10th Marksheet', mandatory: true, submitted: true },
            { documentType: '12th Marksheet', mandatory: true, submitted: true },
            { documentType: 'Passport Photo', mandatory: true, submitted: true },
            { documentType: 'Caste Certificate', mandatory: false, submitted: Math.random() > 0.5 }
          ]
        },
        
        medicalInfo: {
          allergies: Math.random() > 0.8 ? ['Peanuts'] : [],
          emergencyContact: {
            name: `Emergency Contact ${i}`,
            relation: 'Parent',
            phone: `+91 98765${String(70000 + i).slice(-5)}`
          }
        }
      });
    }
    
    // MBA Students (Semester 1)
    for (let i = 1; i <= 20; i++) {
      const rollNo = `MBA2024${String(i).padStart(3, '0')}`;
      const feeAmount = courses.find(c => c.code === 'MBA').fees.totalFee;
      const isPaid = Math.random() > 0.2; // 80% chance of payment for MBA
      
      studentData.push({
        rollNo,
        name: `MBA Student ${i}`,
        email: `${rollNo.toLowerCase()}@university.edu`,
        phone: `+91 98765${String(80000 + i).slice(-5)}`,
        dateOfBirth: new Date(1998 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.5 ? 'Female' : 'Male',
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        category: ['General', 'OBC', 'SC', 'ST', 'EWS'][Math.floor(Math.random() * 5)],
        
        address: {
          permanent: {
            street: `${200 + i} MBA Colony`,
            city: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'][Math.floor(Math.random() * 4)],
            state: ['Maharashtra', 'Delhi', 'Karnataka', 'Maharashtra'][Math.floor(Math.random() * 4)],
            pincode: `4${String(00000 + i).slice(-5)}`,
            country: 'India'
          }
        },
        
        father: {
          name: `MBA Father ${i}`,
          occupation: ['Business Owner', 'Manager', 'Consultant', 'Director'][Math.floor(Math.random() * 4)],
          phone: `+91 98765${String(90000 + i).slice(-5)}`,
          annualIncome: 1000000 + (i * 25000)
        },
        
        mother: {
          name: `MBA Mother ${i}`,
          occupation: ['Professional', 'Manager', 'Consultant', 'Entrepreneur'][Math.floor(Math.random() * 4)],
          phone: `+91 98765${String(95000 + i).slice(-5)}`
        },
        
        school: schools[1]._id,
        course: courses[2]._id, // MBA course
        batch: batches[1]._id,
        currentSemester: 1,
        admissionDate: new Date('2024-07-15'),
        academicYear: '2024-25',
        section: 'A',
        
        academicRecord: {
          cgpa: 7.0 + (Math.random() * 2.5), // MBA students typically have higher CGPA
          sgpa: [
            { semester: 1, gpa: 7.0 + (Math.random() * 2.5), credits: 18, year: '2024-25' }
          ]
        },
        
        attendance: {
          overall: Math.floor(80 + (Math.random() * 20)), // MBA students typically have higher attendance
          subjects: subjects.slice(8, 11).map(subject => ({
            subject: subject._id,
            totalClasses: 40 + Math.floor(Math.random() * 10),
            attendedClasses: Math.floor(35 + (Math.random() * 15)),
            percentage: Math.floor(80 + (Math.random() * 20))
          }))
        },
        
        fees: {
          totalFee: feeAmount,
          paidAmount: isPaid ? feeAmount : Math.floor(feeAmount * (0.3 + Math.random() * 0.6)),
          status: isPaid ? 'Paid' : (Math.random() > 0.7 ? 'Pending' : 'Partial'),
          dueDate: new Date('2024-12-31'),
          paymentHistory: isPaid ? [{
            amount: feeAmount,
            paymentDate: new Date('2024-07-18'),
            paymentMethod: 'Demand Draft',
            transactionId: `TXN${rollNo}${Date.now()}`,
            receiptNo: `RCP${rollNo}`
          }] : []
        },
        
        documents: {
          status: Math.random() > 0.1 ? 'Complete' : 'Incomplete', // MBA students more likely to have complete docs
          submitted: [
            { documentType: 'Bachelor Degree', fileName: `degree_${rollNo}.pdf`, uploadDate: new Date('2024-07-08'), verified: true },
            { documentType: 'Work Experience', fileName: `experience_${rollNo}.pdf`, uploadDate: new Date('2024-07-08'), verified: true },
            { documentType: 'CAT Score', fileName: `cat_${rollNo}.pdf`, uploadDate: new Date('2024-07-08'), verified: true }
          ],
          required: [
            { documentType: 'Bachelor Degree', mandatory: true, submitted: true },
            { documentType: 'Work Experience', mandatory: false, submitted: Math.random() > 0.3 },
            { documentType: 'CAT Score', mandatory: true, submitted: true }
          ]
        }
      });
    }

    // Create all students
    const students = await Student.create(studentData);
    console.log('🎓 Created students');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Schools: ${schools.length}`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Classrooms: ${classrooms.length}`);
    console.log(`   Faculty: ${facultyProfiles.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Students: ${students.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@university.edu / password123');
    console.log('   HOD Engineering: hod.engineering@university.edu / password123');
    console.log('   HOD Management: hod.management@university.edu / password123');
    console.log('   Faculty: sarah.johnson@university.edu / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n📤 Database connection closed');
  }
};

// Run the seed function
seedData();
