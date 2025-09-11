const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../src/models/User');
const Faculty = require('../src/models/Faculty');
const Subject = require('../src/models/Subject');
const FacultySubject = require('../src/models/FacultySubject');
const FacultyFeedback = require('../src/models/FacultyFeedback');
const FacultyLeave = require('../src/models/FacultyLeave');
const Classroom = require('../src/models/Classroom');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

async function seedFacultyData() {
  try {
    const connected = await connectDB();
    if (!connected) return;

    console.log('🌱 Starting Faculty data seeding...');

    // Sample faculty data
    const facultySeed = [
      {
        userData: {
          name: 'Dr. Rajesh Patel',
          email: 'rajesh.patel@university.edu',
          password: 'password123',
          department: 'Computer Science',
          role: 'faculty'
        },
        facultyData: {
          departments: ['Computer Science'],
          personalInfo: {
            dateOfBirth: new Date('1980-05-15'),
            gender: 'Male',
            bloodGroup: 'A+',
            maritalStatus: 'Married',
            nationality: 'Indian',
            category: 'General'
          },
          contactInfo: {
            personalPhone: '+91 9876543210',
            emergencyContact: {
              name: 'Mrs. Priya Patel',
              relationship: 'Spouse',
              phone: '+91 9876543211'
            }
          },
          academicInfo: {
            qualification: [
              {
                degree: 'Ph.D',
                specialization: 'Computer Science',
                university: 'IIT Bombay',
                year: 2010,
                percentage: 85
              },
              {
                degree: 'M.Tech',
                specialization: 'Computer Science',
                university: 'NIT Surat',
                year: 2005,
                percentage: 88
              }
            ],
            experience: {
              totalExperience: 15,
              teachingExperience: 12,
              industryExperience: 3,
              researchExperience: 8
            },
            researchAreas: ['Machine Learning', 'Data Mining', 'Artificial Intelligence'],
            publications: [
              {
                title: 'Advanced Machine Learning Techniques',
                journal: 'International Journal of AI',
                year: 2020,
                type: 'Journal'
              }
            ]
          },
          professionalInfo: {
            employeeId: 'FAC001',
            joiningDate: new Date('2015-07-01'),
            designation: 'Associate Professor',
            currentSalary: 85000
          },
          teachingInfo: {
            specialization: ['Machine Learning', 'Data Structures', 'Algorithms'],
            maxClassesPerDay: 6,
            weeklyLoadLimit: 18,
            availability: [
              { day: 'monday', startTime: '09:00', endTime: '17:00' },
              { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
              { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
              { day: 'thursday', startTime: '09:00', endTime: '17:00' },
              { day: 'friday', startTime: '09:00', endTime: '17:00' }
            ]
          }
        }
      },
      {
        userData: {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@university.edu',
          password: 'password123',
          department: 'Computer Science',
          role: 'faculty'
        },
        facultyData: {
          departments: ['Computer Science'],
          personalInfo: {
            dateOfBirth: new Date('1985-03-22'),
            gender: 'Female',
            bloodGroup: 'B+',
            maritalStatus: 'Single',
            nationality: 'Indian',
            category: 'General'
          },
          contactInfo: {
            personalPhone: '+91 9876543212'
          },
          academicInfo: {
            qualification: [
              {
                degree: 'Ph.D',
                specialization: 'Software Engineering',
                university: 'IISc Bangalore',
                year: 2015,
                percentage: 90
              }
            ],
            experience: {
              totalExperience: 10,
              teachingExperience: 8,
              industryExperience: 2,
              researchExperience: 5
            },
            researchAreas: ['Software Engineering', 'Web Development', 'Database Systems']
          },
          professionalInfo: {
            employeeId: 'FAC002',
            joiningDate: new Date('2018-08-15'),
            designation: 'Assistant Professor',
            currentSalary: 75000
          },
          teachingInfo: {
            specialization: ['Software Engineering', 'Web Development', 'Database Management'],
            maxClassesPerDay: 5,
            weeklyLoadLimit: 15,
            availability: [
              { day: 'monday', startTime: '10:00', endTime: '16:00' },
              { day: 'tuesday', startTime: '10:00', endTime: '16:00' },
              { day: 'wednesday', startTime: '10:00', endTime: '16:00' },
              { day: 'thursday', startTime: '10:00', endTime: '16:00' },
              { day: 'friday', startTime: '10:00', endTime: '16:00' }
            ]
          }
        }
      },
      {
        userData: {
          name: 'Prof. Amit Kumar',
          email: 'amit.kumar@university.edu',
          password: 'password123',
          department: 'Mechanical Engineering',
          role: 'faculty'
        },
        facultyData: {
          departments: ['Mechanical Engineering'],
          personalInfo: {
            dateOfBirth: new Date('1975-11-10'),
            gender: 'Male',
            bloodGroup: 'O+',
            maritalStatus: 'Married',
            nationality: 'Indian',
            category: 'OBC'
          },
          academicInfo: {
            qualification: [
              {
                degree: 'Ph.D',
                specialization: 'Thermal Engineering',
                university: 'IIT Delhi',
                year: 2008,
                percentage: 87
              }
            ],
            experience: {
              totalExperience: 20,
              teachingExperience: 18,
              industryExperience: 2,
              researchExperience: 12
            },
            researchAreas: ['Thermal Engineering', 'Heat Transfer', 'Energy Systems']
          },
          professionalInfo: {
            employeeId: 'FAC003',
            joiningDate: new Date('2010-06-01'),
            designation: 'Professor',
            currentSalary: 120000
          },
          teachingInfo: {
            specialization: ['Thermodynamics', 'Heat Transfer', 'Manufacturing'],
            maxClassesPerDay: 4,
            weeklyLoadLimit: 12,
            availability: [
              { day: 'monday', startTime: '09:00', endTime: '15:00' },
              { day: 'tuesday', startTime: '09:00', endTime: '15:00' },
              { day: 'wednesday', startTime: '09:00', endTime: '15:00' },
              { day: 'thursday', startTime: '09:00', endTime: '15:00' }
            ]
          }
        }
      }
    ];

    // Create faculty members
    for (const faculty of facultySeed) {
      try {
        console.log(`Creating faculty: ${faculty.userData.name}`);
        
        // Create user
        const hashedPassword = await bcrypt.hash(faculty.userData.password, 12);
        const user = await User.create({
          ...faculty.userData,
          password: hashedPassword
        });

        // Create faculty profile
        await Faculty.create({
          user: user._id,
          ...faculty.facultyData
        });

        console.log(`✅ Created faculty: ${faculty.userData.name}`);
      } catch (error) {
        console.log(`❌ Error creating faculty ${faculty.userData.name}:`, error.message);
      }
    }

    // Create some sample feedback data
    console.log('📊 Creating sample feedback data...');
    const faculties = await Faculty.find().populate('user');
    const subjects = await Subject.find().limit(3);

    if (faculties.length > 0 && subjects.length > 0) {
      const sampleFeedback = [
        {
          faculty: faculties[0]._id,
          subject: subjects[0]._id,
          student: new mongoose.Types.ObjectId(), // Mock student ID
          academicYear: '2024-25',
          semester: 1,
          ratings: {
            subjectKnowledge: 4,
            teachingMethodology: 5,
            communicationSkills: 4,
            preparationOrganization: 5,
            studentInteraction: 4,
            punctuality: 5,
            technologyUse: 4,
            assignmentEvaluation: 4,
            overallSatisfaction: 4
          },
          comments: {
            positiveAspects: 'Excellent teaching methodology and subject knowledge',
            areasForImprovement: 'Could use more interactive sessions'
          }
        },
        // Add more feedback entries
        {
          faculty: faculties[0]._id,
          subject: subjects[0]._id,
          student: new mongoose.Types.ObjectId(),
          academicYear: '2024-25',
          semester: 1,
          ratings: {
            subjectKnowledge: 5,
            teachingMethodology: 4,
            communicationSkills: 5,
            preparationOrganization: 4,
            studentInteraction: 5,
            punctuality: 4,
            technologyUse: 5,
            assignmentEvaluation: 5,
            overallSatisfaction: 5
          }
        }
      ];

      for (const feedback of sampleFeedback) {
        try {
          await FacultyFeedback.create(feedback);
          console.log('✅ Created sample feedback');
        } catch (error) {
          console.log('❌ Error creating feedback:', error.message);
        }
      }
    }

    console.log('🎉 Faculty data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedFacultyData();
